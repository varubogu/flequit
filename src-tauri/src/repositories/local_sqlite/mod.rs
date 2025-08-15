//! SQLiteベースのローカルリポジトリ
//! 
//! SQLiteデータベースを使用したローカルストレージの実装
//! 高速なクエリとリレーショナルなデータアクセスを提供

use sea_orm::{Database, DatabaseConnection, ConnectOptions};
use std::path::Path;
use tokio::sync::OnceCell;

pub mod settings_repository;
pub mod account_repository;
pub mod project_repository;
pub mod project_repository_impl;
pub mod task_list_repository;
pub mod task_repository;
pub mod subtask_repository;
pub mod tag_repository;
pub mod migration;
pub mod schema_migration;
pub mod hybrid_migration;
pub mod migration_cli;

/// SQLiteデータベース接続の管理
pub struct DatabaseManager {
    connection: OnceCell<DatabaseConnection>,
    database_path: String,
}

impl DatabaseManager {
    /// 新しいデータベースマネージャーを作成
    pub fn new(database_path: impl Into<String>) -> Self {
        Self {
            connection: OnceCell::new(),
            database_path: database_path.into(),
        }
    }

    /// データベース接続を取得（初回接続時は自動的に初期化）
    pub async fn get_connection(&self) -> Result<&DatabaseConnection, sea_orm::DbErr> {
        self.connection.get_or_try_init(|| async {
            // SQLiteデータベースファイルのディレクトリを作成
            if let Some(parent) = Path::new(&self.database_path).parent() {
                tokio::fs::create_dir_all(parent).await.map_err(|e| {
                    sea_orm::DbErr::Custom(format!("Failed to create database directory: {}", e))
                })?;
            }

            // 接続オプション設定
            let mut opt = ConnectOptions::new(format!("sqlite://{}?mode=rwc", self.database_path));
            opt.max_connections(100)
                .min_connections(5)
                .connect_timeout(std::time::Duration::from_secs(8))
                .acquire_timeout(std::time::Duration::from_secs(8))
                .idle_timeout(std::time::Duration::from_secs(8))
                .max_lifetime(std::time::Duration::from_secs(8))
                .sqlx_logging(false);

            // データベースに接続
            let db = Database::connect(opt).await?;
            
            // ハイブリッドマイグレーション実行
            let migrator = hybrid_migration::HybridMigrator::new(db.clone());
            
            // マイグレーション状態をチェック
            let needs_migration = !migrator.check_migration_status().await
                .unwrap_or(false);
            
            if needs_migration {
                migrator.run_migration().await?;
            } else {
                println!("ℹ️  マイグレーションは最新です");
            }

            Ok(db)
        }).await
    }

    /// デフォルトパスでデータベースマネージャーを作成
    pub async fn with_default_path() -> Result<Self, sea_orm::DbErr> {
        // デフォルトのデータベースパスを取得
        let default_path = get_default_database_path().unwrap_or_else(|| "./data/flequit.sqlite".to_string());
        Ok(Self::new(default_path))
    }

    /// データベース接続を閉じる
    pub async fn close(&self) -> Result<(), sea_orm::DbErr> {
        // OncelCellから取得した値は共有参照なので、closeは呼び出さない
        // 実際のアプリケーションでは、アプリケーション終了時に自動的にクリーンアップされる
        Ok(())
    }
}

/// リポジトリの共通エラー型
#[derive(Debug, thiserror::Error)]
pub enum RepositoryError {
    #[error("Database error: {0}")]
    Database(#[from] sea_orm::DbErr),
    
    #[error("Model conversion error: {0}")]
    Conversion(String),
    
    #[error("Entity not found: {0}")]
    NotFound(String),
    
    #[error("Constraint violation: {0}")]
    ConstraintViolation(String),
}

/// デフォルトデータベースパスを取得
fn get_default_database_path() -> Option<String> {
    use std::env;
    
    // 環境変数からデータベースパスを取得
    if let Ok(db_path) = env::var("FLEQUIT_DB_PATH") {
        return Some(db_path);
    }
    
    // ユーザーディレクトリ内のアプリデータディレクトリを使用
    if let Some(home_dir) = dirs::data_dir() {
        let app_data_dir = home_dir.join("flequit");
        let db_path = app_data_dir.join("database.sqlite");
        return Some(db_path.to_string_lossy().to_string());
    }
    
    None
}

/// 共通リポジトリトレイト
#[async_trait::async_trait]
pub trait Repository<T> {
    /// エンティティを保存
    async fn save(&self, entity: &T) -> Result<T, RepositoryError>;
    
    /// IDでエンティティを検索
    async fn find_by_id(&self, id: &str) -> Result<Option<T>, RepositoryError>;
    
    /// エンティティを更新
    async fn update(&self, entity: &T) -> Result<T, RepositoryError>;
    
    /// IDでエンティティを削除
    async fn delete_by_id(&self, id: &str) -> Result<bool, RepositoryError>;
    
    /// 全エンティティを取得
    async fn find_all(&self) -> Result<Vec<T>, RepositoryError>;
}