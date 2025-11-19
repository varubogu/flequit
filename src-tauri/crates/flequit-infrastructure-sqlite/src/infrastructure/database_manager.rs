//! SQLiteデータベース接続の管理
//!
//! シングルトンパターンでデータベース接続を管理し、
//! アプリケーション全体で単一の接続を共有する。

use crate::errors::sqlite_error::SQLiteError;
use sea_orm::{ConnectOptions, Database, DatabaseConnection};
use std::path::Path;
use std::sync::Arc;
use tokio::sync::{OnceCell, RwLock};

/// SQLiteデータベース接続のシングルトン管理
#[derive(Debug)]
pub struct DatabaseManager {
    connection: OnceCell<DatabaseConnection>,
    database_path: String,
}

/// グローバルなDatabaseManagerのシングルトンインスタンス
static DATABASE_MANAGER: OnceCell<Arc<RwLock<DatabaseManager>>> = OnceCell::const_new();

impl DatabaseManager {
    /// 新しいデータベースマネージャーを作成（プライベート）
    fn new(database_path: impl Into<String>) -> Self {
        Self {
            connection: OnceCell::new(),
            database_path: database_path.into(),
        }
    }

    /// テスト用: 指定パスで新しいDatabaseManagerを作成
    pub fn new_for_test(database_path: impl Into<String>) -> Self {
        Self::new(database_path)
    }

    /// シングルトンインスタンスを取得
    pub async fn instance() -> Result<Arc<RwLock<DatabaseManager>>, SQLiteError> {
        DATABASE_MANAGER
            .get_or_try_init(|| async {
                // デフォルトのデータベースパスを取得
                let default_path = get_default_database_path().ok_or_else(|| {
                    SQLiteError::ConfigurationError(
                        "Failed to get default database path".to_string(),
                    )
                })?;
                Ok(Arc::new(RwLock::new(DatabaseManager::new(default_path))))
            })
            .await
            .cloned()
    }

    /// データベース接続を取得（初回接続時は自動的に初期化）
    pub async fn get_connection(&self) -> Result<&DatabaseConnection, SQLiteError> {
        self.connection
            .get_or_try_init(|| async {
                // SQLiteデータベースファイルのディレクトリを作成
                if let Some(parent) = Path::new(&self.database_path).parent() {
                    tokio::fs::create_dir_all(parent).await.map_err(|e| {
                        SQLiteError::DatabaseError(format!(
                            "Failed to create database directory: {}",
                            e
                        ))
                    })?;
                }

                // 接続オプション設定
                let mut opt =
                    ConnectOptions::new(format!("sqlite://{}?mode=rwc", self.database_path));
                opt.max_connections(100)
                    .min_connections(5)
                    .connect_timeout(std::time::Duration::from_secs(8))
                    .acquire_timeout(std::time::Duration::from_secs(8))
                    .idle_timeout(std::time::Duration::from_secs(8))
                    .max_lifetime(std::time::Duration::from_secs(8))
                    .sqlx_logging(false);

                // データベースに接続
                let db = Database::connect(opt).await.map_err(SQLiteError::from)?;

                // ハイブリッドマイグレーション実行（常に実行してテーブルの存在を確保）
                let migrator = super::hybrid_migration::HybridMigrator::new(db.clone());
                migrator.run_migration().await.map_err(SQLiteError::from)?;

                Ok(db)
            })
            .await
    }

    /// データベース接続を閉じる
    pub async fn close(&self) -> Result<(), sea_orm::DbErr> {
        // OncelCellから取得した値は共有参照なので、closeは呼び出さない
        // 実際のアプリケーションでは、アプリケーション終了時に自動的にクリーンアップされる
        Ok(())
    }
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
