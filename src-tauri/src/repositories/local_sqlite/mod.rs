//! SQLiteベースのローカルリポジトリ
//!
//! SQLiteデータベースを使用したローカルストレージの実装
//! 高速なクエリとリレーショナルなデータアクセスを提供

use crate::errors::repository_error::RepositoryError;
use sea_orm::{ConnectOptions, Database, DatabaseConnection};
use std::path::Path;
use tokio::sync::OnceCell;

pub mod account;
pub mod hybrid_migration;
pub mod local_sqlite_repositories;
pub mod migration;
pub mod migration_cli;
pub mod project;
pub mod schema_migration;
pub mod settings;
pub mod subtask;
pub mod tag;
pub mod task;
pub mod task_list;

/// SQLiteデータベース接続の管理
pub struct DatabaseManager {
    connection: OnceCell<DatabaseConnection>,
    database_path: String,
}

impl Clone for DatabaseManager {
    fn clone(&self) -> Self {
        Self {
            connection: OnceCell::new(),
            database_path: self.database_path.clone(),
        }
    }
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
    pub async fn get_connection(&self) -> Result<&DatabaseConnection, RepositoryError> {
        self.connection
            .get_or_try_init(|| async {
                // SQLiteデータベースファイルのディレクトリを作成
                if let Some(parent) = Path::new(&self.database_path).parent() {
                    tokio::fs::create_dir_all(parent).await.map_err(|e| {
                        RepositoryError::DatabaseError(format!(
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
                let db = Database::connect(opt)
                    .await
                    .map_err(RepositoryError::from)?;

                // ハイブリッドマイグレーション実行
                let migrator = hybrid_migration::HybridMigrator::new(db.clone());

                // マイグレーション状態をチェック
                let needs_migration = !migrator.check_migration_status().await.unwrap_or(false);

                if needs_migration {
                    migrator
                        .run_migration()
                        .await
                        .map_err(RepositoryError::from)?;
                } else {
                    println!("ℹ️  マイグレーションは最新です");
                }

                Ok(db)
            })
            .await
    }

    /// デフォルトパスでデータベースマネージャーを作成
    pub async fn with_default_path() -> Result<Self, RepositoryError> {
        // デフォルトのデータベースパスを取得
        let default_path = get_default_database_path().ok_or_else(|| {
            RepositoryError::ConfigurationError("Failed to get default database path".to_string())
        })?;
        Ok(Self::new(default_path))
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
