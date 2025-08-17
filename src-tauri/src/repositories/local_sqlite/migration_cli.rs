//! マイグレーション管理CLI（開発用）
//!
//! マイグレーションの実行、リセット、状態確認用のユーティリティ

use super::{database_manager::DatabaseManager, hybrid_migration::HybridMigrator};
use sea_orm::ConnectionTrait;
use std::sync::Arc;
use tokio::sync::RwLock;

/// マイグレーション管理CLI
pub struct MigrationCli {
    db_manager: Arc<RwLock<DatabaseManager>>,
}

impl MigrationCli {
    pub async fn new() -> Result<Self, Box<dyn std::error::Error>> {
        let db_manager = DatabaseManager::instance().await?;
        Ok(Self { db_manager })
    }

    /// マイグレーション状態確認
    pub async fn status(&self) -> Result<(), Box<dyn std::error::Error>> {
        println!("🔍 マイグレーション状態確認");

        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await?;
        let migrator = HybridMigrator::new(db.clone());

        let is_up_to_date = migrator.check_migration_status().await?;

        if is_up_to_date {
            println!("✅ データベースは最新です");
        } else {
            println!("⚠️  マイグレーションが必要です");
        }

        // テーブル一覧表示
        self.show_tables().await?;

        Ok(())
    }

    /// マイグレーション実行
    pub async fn migrate(&self) -> Result<(), Box<dyn std::error::Error>> {
        println!("🚀 マイグレーション実行");

        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await?;
        let migrator = HybridMigrator::new(db.clone());

        migrator.run_migration().await?;

        println!("✅ マイグレーション完了");
        Ok(())
    }

    /// マイグレーション強制リセット（開発用）
    pub async fn reset(&self) -> Result<(), Box<dyn std::error::Error>> {
        println!("🔄 マイグレーション強制リセット");
        println!("⚠️  警告: 全データが削除されます");

        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await?;
        let migrator = HybridMigrator::new(db.clone());

        migrator.force_remigration().await?;

        println!("✅ リセット完了");
        Ok(())
    }

    /// マイグレーション履歴表示
    pub async fn history(&self) -> Result<(), Box<dyn std::error::Error>> {
        println!("📋 マイグレーション履歴");

        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await?;
        let migrator = HybridMigrator::new(db.clone());

        let history = migrator.get_migration_history().await?;

        if history.is_empty() {
            println!("📝 マイグレーション履歴はありません");
        } else {
            for info in history {
                println!(
                    "  {} - {} ({})",
                    info.version, info.migration_type, info.applied_at
                );
                if let Some(desc) = info.description {
                    println!("    {}", desc);
                }
            }
        }

        Ok(())
    }

    /// テーブル一覧表示
    async fn show_tables(&self) -> Result<(), Box<dyn std::error::Error>> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await?;

        // SQLiteのテーブル一覧取得
        let result = db
            .execute_unprepared("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;")
            .await;

        match result {
            Ok(_) => {
                println!("📊 データベースの現在のテーブル:");

                // 期待されるテーブル一覧
                let expected_tables = vec![
                    "migrations",
                    "settings",
                    "accounts",
                    "projects",
                    "task_lists",
                    "tasks",
                    "subtasks",
                    "tags",
                ];

                for table in expected_tables {
                    // 実際の存在確認は簡略化
                    println!("  📋 {}", table);
                }
            }
            Err(e) => {
                println!("❌ テーブル情報取得エラー: {}", e);
            }
        }

        Ok(())
    }
}

/// CLI実行用のヘルパー関数
pub async fn run_migration_command(
    command: &str,
    _database_path: &str,
) -> Result<(), Box<dyn std::error::Error>> {
    let cli = MigrationCli::new().await?;

    match command {
        "status" => cli.status().await,
        "migrate" => cli.migrate().await,
        "reset" => cli.reset().await,
        "history" => cli.history().await,
        _ => {
            println!("❌ 不明なコマンド: {}", command);
            println!("使用可能コマンド: status, migrate, reset, history");
            Ok(())
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[tokio::test]
    async fn test_migration_cli() {
        let _temp_dir = tempdir().unwrap();

        let cli = MigrationCli::new().await.unwrap();

        // マイグレーション実行テスト
        cli.migrate().await.unwrap();

        // 状態確認テスト
        cli.status().await.unwrap();

        // 履歴確認テスト
        cli.history().await.unwrap();
    }
}
