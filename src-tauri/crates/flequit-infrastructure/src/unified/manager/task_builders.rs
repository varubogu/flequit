//! タスク・タスクリスト・サブタスク用UnifiedRepositoryビルダー
//!
//! Task、TaskList、SubTask エンティティのUnifiedRepositoryを構築するメソッドを提供する

use super::{UnifiedManager, get_default_automerge_path};
use crate::unified::{SubTaskUnifiedRepository, TaskListUnifiedRepository, TaskUnifiedRepository};
use flequit_infrastructure_automerge::infrastructure::task_projects::{
    subtask::SubTaskLocalAutomergeRepository, task::TaskLocalAutomergeRepository,
    task_list::TaskListLocalAutomergeRepository,
};
use flequit_infrastructure_sqlite::infrastructure::database_manager::DatabaseManager;
use flequit_infrastructure_sqlite::infrastructure::task_projects::{
    subtask::SubTaskLocalSqliteRepository, task::TaskLocalSqliteRepository,
    task_list::TaskListLocalSqliteRepository,
};

impl UnifiedManager {
    /// タスク用UnifiedRepositoryを構築
    pub async fn create_task_unified_repository(
        &self,
    ) -> Result<TaskUnifiedRepository, Box<dyn std::error::Error>> {
        let mut repo = TaskUnifiedRepository::default();

        // SQLiteリポジトリの設定
        if self.config.sqlite_search_enabled || self.config.sqlite_storage_enabled {
            let db_manager = DatabaseManager::instance().await?;

            // 検索にSQLiteリポジトリを追加
            if self.config.sqlite_search_enabled {
                let sqlite_repo = TaskLocalSqliteRepository::new(db_manager.clone());
                repo.add_sqlite_for_search(sqlite_repo);
                tracing::info!("SQLiteリポジトリを検索用に追加しました（Task）");
            }

            // 保存にもSQLiteリポジトリを追加（設定により）
            if self.config.sqlite_storage_enabled {
                let sqlite_repo = TaskLocalSqliteRepository::new(db_manager.clone());
                repo.add_sqlite_for_save(sqlite_repo);
                tracing::info!("SQLiteリポジトリを保存用に追加しました（Task）");
            }
        }

        // Automergeリポジトリの設定
        if self.config.automerge_storage_enabled {
            let automerge_repo = if let Some(doc_manager) = &self.shared_document_manager {
                TaskLocalAutomergeRepository::new_with_manager(doc_manager.clone()).await?
            } else {
                let base_path =
                    get_default_automerge_path().ok_or("Failed to get default Automerge path")?;
                TaskLocalAutomergeRepository::new(base_path).await?
            };

            repo.add_automerge_for_save(automerge_repo);
            tracing::info!("Automergeリポジトリを保存用に追加しました（Task）");
        }

        tracing::info!(
            "TaskUnifiedRepository構築完了 - 保存用: {} 検索用: {} リポジトリ",
            repo.save_repositories_count(),
            repo.search_repositories_count()
        );

        Ok(repo)
    }

    /// タスクリスト用UnifiedRepositoryを構築
    pub async fn create_task_list_unified_repository(
        &self,
    ) -> Result<TaskListUnifiedRepository, Box<dyn std::error::Error>> {
        let mut repo = TaskListUnifiedRepository::default();

        // SQLiteリポジトリの設定
        if self.config.sqlite_search_enabled || self.config.sqlite_storage_enabled {
            let db_manager = DatabaseManager::instance().await?;

            // 検索にSQLiteリポジトリを追加
            if self.config.sqlite_search_enabled {
                let sqlite_repo = TaskListLocalSqliteRepository::new(db_manager.clone());
                repo.add_sqlite_for_search(sqlite_repo);
                tracing::info!("SQLiteリポジトリを検索用に追加しました（TaskList）");
            }

            // 保存にもSQLiteリポジトリを追加（設定により）
            if self.config.sqlite_storage_enabled {
                let sqlite_repo = TaskListLocalSqliteRepository::new(db_manager.clone());
                repo.add_sqlite_for_save(sqlite_repo);
                tracing::info!("SQLiteリポジトリを保存用に追加しました（TaskList）");
            }
        }

        // Automergeリポジトリの設定
        if self.config.automerge_storage_enabled {
            let automerge_repo = if let Some(doc_manager) = &self.shared_document_manager {
                TaskListLocalAutomergeRepository::new_with_manager(doc_manager.clone()).await?
            } else {
                let base_path =
                    get_default_automerge_path().ok_or("Failed to get default Automerge path")?;
                TaskListLocalAutomergeRepository::new(base_path).await?
            };

            repo.add_automerge_for_save(automerge_repo);
            tracing::info!("Automergeリポジトリを保存用に追加しました（TaskList）");
        }

        tracing::info!(
            "TaskListUnifiedRepository構築完了 - 保存用: {} 検索用: {} リポジトリ",
            repo.save_repositories_count(),
            repo.search_repositories_count()
        );

        Ok(repo)
    }

    /// SubTask用UnifiedRepositoryを構築
    pub async fn create_sub_task_unified_repository(
        &self,
    ) -> Result<SubTaskUnifiedRepository, Box<dyn std::error::Error>> {
        let mut repo = SubTaskUnifiedRepository::default();

        // SQLiteリポジトリの設定
        if self.config.sqlite_search_enabled || self.config.sqlite_storage_enabled {
            let db_manager = DatabaseManager::instance().await?;

            if self.config.sqlite_search_enabled {
                let sqlite_repo = SubTaskLocalSqliteRepository::new(db_manager.clone());
                repo.add_sqlite_for_search(sqlite_repo);
                tracing::info!("SQLiteリポジトリを検索用に追加しました（SubTask）");
            }

            if self.config.sqlite_storage_enabled {
                let sqlite_repo = SubTaskLocalSqliteRepository::new(db_manager.clone());
                repo.add_sqlite_for_save(sqlite_repo);
                tracing::info!("SQLiteリポジトリを保存用に追加しました（SubTask）");
            }
        }

        // Automergeリポジトリの設定
        if self.config.automerge_storage_enabled {
            let automerge_repo = if let Some(doc_manager) = &self.shared_document_manager {
                SubTaskLocalAutomergeRepository::new_with_manager(doc_manager.clone()).await?
            } else {
                let base_path =
                    get_default_automerge_path().ok_or("Failed to get default Automerge path")?;
                SubTaskLocalAutomergeRepository::new(base_path).await?
            };

            repo.add_automerge_for_save(automerge_repo);
            tracing::info!("Automergeリポジトリを保存用に追加しました（SubTask）");
        }

        tracing::info!(
            "SubTaskUnifiedRepository構築完了 - 保存用: {} 検索用: {} リポジトリ",
            repo.save_repositories_count(),
            repo.search_repositories_count()
        );

        Ok(repo)
    }
}
