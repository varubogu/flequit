//! SQLite統合テスト用の共通テストハーネス
//!
//! テンプレートデータベースの作成とテスト用データベースのセットアップを提供し、
//! 各テストが独立したデータベース環境で実行されることを保証する

use chrono::Utc;
use flequit_lib::repositories::local_sqlite::database_manager::DatabaseManager;
use serde_json::json;
use std::path::{Path, PathBuf};
use std::sync::Arc;
use tokio::sync::{OnceCell, RwLock};

/// テンプレートデータベースのパス（固定）
const TEMPLATE_DB_PATH: &str = "/tmp/flequit/test_database.db";

/// テンプレートデータベースの初期化状態
static TEMPLATE_DB_INITIALIZED: OnceCell<()> = OnceCell::const_new();

/// SQLiteテストハーネス
pub struct SqliteTestHarness;

impl SqliteTestHarness {
    /// テンプレートデータベースを確保（全体で1回のみ実行）
    pub async fn ensure_template_database() -> Result<(), Box<dyn std::error::Error>> {
        TEMPLATE_DB_INITIALIZED
            .get_or_try_init(|| async {
                println!("🔧 テンプレートデータベース作成開始: {}", TEMPLATE_DB_PATH);
                
                let template_path = std::path::Path::new(TEMPLATE_DB_PATH);
                
                // ディレクトリを確実に作成
                if let Some(parent) = template_path.parent() {
                    println!("📁 ディレクトリ作成: {}", parent.display());
                    std::fs::create_dir_all(parent).map_err(|e| {
                        format!("ディレクトリ作成失敗 {}: {}", parent.display(), e)
                    })?;
                    println!("✅ ディレクトリ作成完了: {}", parent.display());
                }
                
                // 既存のテンプレートがあれば削除
                if template_path.exists() {
                    std::fs::remove_file(template_path)?;
                    println!("🗑️ 既存のテンプレートDB削除: {}", TEMPLATE_DB_PATH);
                }
                
                // テンプレート用環境変数設定
                std::env::set_var("FLEQUIT_DB_PATH", TEMPLATE_DB_PATH);
                
                // DatabaseManagerインスタンスを作成してマイグレーション実行
                println!("🔧 テンプレートDB用DatabaseManager作成中...");
                let db_manager = DatabaseManager::instance().await.map_err(|e| {
                    format!("テンプレートDBマネージャー作成失敗: {:?}", e)
                })?;
                
                // 接続確立（マイグレーション実行）
                let db_manager_lock = db_manager.read().await;
                let _connection = db_manager_lock.get_connection().await.map_err(|e| {
                    format!("テンプレートDB接続失敗: {:?}", e)
                })?;
                drop(db_manager_lock);
                
                // テンプレートファイルの存在確認
                if template_path.exists() {
                    let file_size = std::fs::metadata(template_path)?.len();
                    println!("✅ テンプレートデータベース作成完了: {} ({} bytes)", 
                             TEMPLATE_DB_PATH, file_size);
                } else {
                    return Err(Box::from("テンプレートデータベースファイルが作成されませんでした") as Box<dyn std::error::Error>);
                }
                
                Ok(())
            })
            .await?;
        
        Ok(())
    }
    
    /// テスト用データベースを作成（固定テンプレートからコピー）
    pub async fn create_test_database(test_name: &str) -> Result<Arc<RwLock<DatabaseManager>>, Box<dyn std::error::Error>> {
        // テンプレートデータベースを確保（全体で1回のみ実行）
        Self::ensure_template_database().await?;
        
        // テスト用データベースパスを生成
        let test_base_dir = std::env::temp_dir().join("flequit_test_dbs");
        std::fs::create_dir_all(&test_base_dir)?;
        
        let unique_db_name = format!("{}_{}_{}.db", 
            test_name, 
            std::process::id(), 
            chrono::Utc::now().timestamp_nanos_opt().unwrap_or(0)
        );
        let test_db_path = test_base_dir.join(unique_db_name);
        
        // 固定パスのテンプレートをテスト用データベースにコピー
        let template_path = std::path::Path::new(TEMPLATE_DB_PATH);
        std::fs::copy(template_path, &test_db_path).map_err(|e| {
            format!("テンプレートコピー失敗 {} -> {}: {}", 
                   TEMPLATE_DB_PATH, test_db_path.display(), e)
        })?;
        
        println!("📋 テスト用データベース作成: {} ({}からコピー)", 
                test_db_path.display(), TEMPLATE_DB_PATH);
        
        // テスト用環境変数設定
        let test_db_path_str = test_db_path.to_string_lossy().to_string();
        std::env::set_var("FLEQUIT_DB_PATH", &test_db_path_str);
        
        // シングルトンをクリア
        Self::force_reset_database_manager_singleton().await;
        
        // 新しいDatabaseManagerインスタンス取得
        // マイグレーション済みDBを使うため、マイグレーション処理はスキップされる
        let db_manager = DatabaseManager::instance().await.map_err(|e| {
            format!("テスト用DBマネージャー作成失敗: {:?}", e)
        })?;
        
        // データベースファイルの確認
        if test_db_path.exists() {
            let file_size = std::fs::metadata(&test_db_path)?.len();
            println!("✅ テスト用データベース準備完了: {} ({} bytes)", 
                     test_db_path.display(), file_size);
        } else {
            return Err(format!("テスト用データベースファイルが存在しません: {}", 
                              test_db_path.display()).into());
        }
        
        // テストデータをクリア
        Self::clear_test_tables(&db_manager).await?;
        
        Ok(db_manager)
    }
    
    /// DatabaseManagerシングルトンを強制リセット（テスト専用）
    async fn force_reset_database_manager_singleton() {
        // 環境変数のクリーンアップ
        let vars_to_remove: Vec<String> = std::env::vars()
            .filter_map(|(k, _)| {
                if k.starts_with("FLEQUIT_DB") || k.starts_with("DATABASE_") {
                    Some(k)
                } else {
                    None
                }
            })
            .collect();
        
        for var in vars_to_remove {
            if var != "FLEQUIT_DB_PATH" { // 現在設定中のもの以外をクリア
                std::env::remove_var(var);
            }
        }
        
        // シングルトンの再初期化を促進
        tokio::time::sleep(std::time::Duration::from_millis(10)).await;
    }
    
    /// テスト用テーブルをクリア
    async fn clear_test_tables(db_manager: &Arc<RwLock<DatabaseManager>>) -> Result<(), Box<dyn std::error::Error>> {
        use sea_orm::{EntityTrait, Statement, ConnectionTrait, DbBackend};
        use flequit_lib::models::sqlite::{
            project::Entity as ProjectEntity,
            task::Entity as TaskEntity,
            task_list::Entity as TaskListEntity,
            subtask::Entity as SubtaskEntity,
            tag::Entity as TagEntity,
        };
        
        let db_manager_lock = db_manager.read().await;
        let db = db_manager_lock.get_connection().await?;
        
        // 外部キー制約を一時的に無効化
        let _ = db.execute(Statement::from_string(
            DbBackend::Sqlite,
            "PRAGMA foreign_keys = OFF;".to_string(),
        )).await;
        
        // 全テーブルをクリア（外部キー制約順序に注意）
        let _ = SubtaskEntity::delete_many().exec(db).await;
        let _ = TaskEntity::delete_many().exec(db).await;
        let _ = TaskListEntity::delete_many().exec(db).await;
        let _ = TagEntity::delete_many().exec(db).await;
        let _ = ProjectEntity::delete_many().exec(db).await;
        
        // SQLiteのAUTOINCREMENTカウンターもリセット
        let tables = ["subtasks", "tasks", "task_lists", "tags", "projects"];
        for table in &tables {
            let _ = db.execute(Statement::from_string(
                DbBackend::Sqlite,
                format!("DELETE FROM sqlite_sequence WHERE name='{}';", table),
            )).await;
        }
        
        // 外部キー制約を再度有効化
        let _ = db.execute(Statement::from_string(
            DbBackend::Sqlite,
            "PRAGMA foreign_keys = ON;".to_string(),
        )).await;
        
        println!("🧹 テストテーブルクリア完了");
        Ok(())
    }
    
    /// テスト結果の永続保存ディレクトリを作成
    pub fn create_persistent_test_dir(test_name: &str) -> PathBuf {
        let timestamp = Utc::now().format("%Y%m%d_%H%M%S").to_string();
        
        let current_dir = std::env::current_dir().expect("現在のディレクトリ取得失敗");
        let project_root = if current_dir.ends_with("src-tauri") {
            current_dir.parent().unwrap().to_path_buf()
        } else {
            current_dir
        };
        
        let base_path = project_root.join(".tmp/tests/cargo/integration/local_sqlite_repository_test");
        let test_dir = base_path.join(test_name).join(&timestamp);
        
        if let Err(e) = std::fs::create_dir_all(&test_dir) {
            eprintln!("永続テストディレクトリ作成失敗: {}", e);
            return std::env::temp_dir()
                .join("flequit_fallback")
                .join(test_name)
                .join(&timestamp);
        }
        
        println!("📁 統合テスト結果保存先: {:?}", test_dir);
        test_dir
    }
    
    /// テスト結果をユーザー確認用ディレクトリにコピー
    pub fn copy_to_persistent_storage(
        src_dir: &Path,
        dest_dir: &Path,
        test_name: &str,
    ) -> Result<(), Box<dyn std::error::Error>> {
        if !src_dir.exists() {
            return Ok(());
        }
        
        // メタデータファイルを作成
        let metadata = json!({
            "test_name": test_name,
            "test_type": "sqlite_integration_test",
            "execution_time": Utc::now().to_rfc3339(),
            "source_directory": src_dir.to_string_lossy(),
            "destination_directory": dest_dir.to_string_lossy(),
            "test_harness": "custom_sqlite_harness"
        });
        
        let metadata_file = dest_dir.join("test_metadata.json");
        std::fs::write(&metadata_file, serde_json::to_string_pretty(&metadata)?)?;
        
        // 固定テンプレートDBをコピー
        let template_path = std::path::Path::new(TEMPLATE_DB_PATH);
        if template_path.exists() {
            let dst_path = dest_dir.join("template_database.db");
            let _ = std::fs::copy(template_path, &dst_path);
            println!("📋 テンプレートDBコピー: {} -> {}", 
                    TEMPLATE_DB_PATH, dst_path.display());
        }
        
        // その他のSQLiteデータベースファイルもコピー
        if let Ok(entries) = std::fs::read_dir(src_dir) {
            for entry in entries.flatten() {
                let src_path = entry.path();
                if src_path.extension().map_or(false, |ext| ext == "sqlite" || ext == "db") {
                    let dst_path = dest_dir.join(entry.file_name());
                    let _ = std::fs::copy(&src_path, &dst_path);
                    println!("📋 データベースファイルコピー: {} -> {}", 
                            src_path.display(), dst_path.display());
                }
            }
        }
        
        println!("💾 統合テスト結果を永続ストレージにコピー完了: {:?}", dest_dir);
        Ok(())
    }
}