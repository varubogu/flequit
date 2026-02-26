//! タスクアサインメント・サブタスクアサインメント用UnifiedRepositoryビルダー
//!
//! TaskAssignment、SubTaskAssignment エンティティのUnifiedRepositoryを構築するメソッドを提供する

use super::{get_default_automerge_path, UnifiedManager};
use crate::unified::{SubTaskAssignmentUnifiedRepository, TaskAssignmentUnifiedRepository};
use flequit_infrastructure_automerge::infrastructure::task_projects::{
    subtask_assignments::SubtaskAssignmentLocalAutomergeRepository,
    task_assignments::TaskAssignmentLocalAutomergeRepository,
};
use flequit_infrastructure_sqlite::infrastructure::database_manager::DatabaseManager;
use flequit_infrastructure_sqlite::infrastructure::task_projects::{
    subtask_assignments::SubtaskAssignmentLocalSqliteRepository,
    task_assignments::TaskAssignmentLocalSqliteRepository,
};

impl UnifiedManager {
    /// TaskAssignment用UnifiedRepositoryを構築
    pub async fn create_task_assignment_unified_repository(
        &self,
    ) -> Result<TaskAssignmentUnifiedRepository, Box<dyn std::error::Error>> {
        let mut repo = TaskAssignmentUnifiedRepository::default();

        // SQLiteリポジトリの設定
        if self.config.sqlite_search_enabled || self.config.sqlite_storage_enabled {
            let db_manager = DatabaseManager::instance().await?;

            if self.config.sqlite_search_enabled {
                let sqlite_repo = TaskAssignmentLocalSqliteRepository::new(db_manager.clone());
                repo.add_sqlite_for_search(sqlite_repo);
                tracing::info!("SQLiteリポジトリを検索用に追加しました（TaskAssignment）");
            }

            if self.config.sqlite_storage_enabled {
                let sqlite_repo = TaskAssignmentLocalSqliteRepository::new(db_manager.clone());
                repo.add_sqlite_for_save(sqlite_repo);
                tracing::info!("SQLiteリポジトリを保存用に追加しました（TaskAssignment）");
            }
        }

        // Automergeリポジトリの設定
        if self.config.automerge_storage_enabled {
            let automerge_repo = if let Some(doc_manager) = &self.shared_document_manager {
                TaskAssignmentLocalAutomergeRepository::new_with_manager(doc_manager.clone())
                    .await?
            } else {
                let base_path = get_default_automerge_path()
                    .ok_or("Failed to get default Automerge path")?;
                TaskAssignmentLocalAutomergeRepository::new(base_path).await?
            };

            repo.add_automerge_for_save(automerge_repo);
            tracing::info!("Automergeリポジトリを保存用に追加しました（TaskAssignment）");
        }

        tracing::info!(
            "TaskAssignmentUnifiedRepository構築完了 - 保存用: {} 検索用: {} リポジトリ",
            repo.save_repositories_count(),
            repo.search_repositories_count()
        );

        Ok(repo)
    }

    /// SubTaskAssignment用UnifiedRepositoryを構築
    pub async fn create_sub_task_assignment_unified_repository(
        &self,
    ) -> Result<SubTaskAssignmentUnifiedRepository, Box<dyn std::error::Error>> {
        let mut repo = SubTaskAssignmentUnifiedRepository::default();

        // SQLiteリポジトリの設定
        if self.config.sqlite_search_enabled || self.config.sqlite_storage_enabled {
            let db_manager = DatabaseManager::instance().await?;

            if self.config.sqlite_search_enabled {
                let sqlite_repo =
                    SubtaskAssignmentLocalSqliteRepository::new(db_manager.clone());
                repo.add_sqlite_for_search(sqlite_repo);
                tracing::info!("SQLiteリポジトリを検索用に追加しました（SubTaskAssignment）");
            }

            if self.config.sqlite_storage_enabled {
                let sqlite_repo =
                    SubtaskAssignmentLocalSqliteRepository::new(db_manager.clone());
                repo.add_sqlite_for_save(sqlite_repo);
                tracing::info!("SQLiteリポジトリを保存用に追加しました（SubTaskAssignment）");
            }
        }

        // Automergeリポジトリの設定
        if self.config.automerge_storage_enabled {
            let automerge_repo = if let Some(doc_manager) = &self.shared_document_manager {
                SubtaskAssignmentLocalAutomergeRepository::new_with_manager(doc_manager.clone())
                    .await?
            } else {
                let base_path = get_default_automerge_path()
                    .ok_or("Failed to get default Automerge path")?;
                SubtaskAssignmentLocalAutomergeRepository::new(base_path).await?
            };

            repo.add_automerge_for_save(automerge_repo);
            tracing::info!("Automergeリポジトリを保存用に追加しました（SubTaskAssignment）");
        }

        tracing::info!(
            "SubTaskAssignmentUnifiedRepository構築完了 - 保存用: {} 検索用: {} リポジトリ",
            repo.save_repositories_count(),
            repo.search_repositories_count()
        );

        Ok(repo)
    }
}
