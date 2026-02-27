//! 繰り返しルール・タスク繰り返し・サブタスク繰り返し用UnifiedRepositoryビルダー
//!
//! RecurrenceRule、TaskRecurrence、SubTaskRecurrence エンティティのUnifiedRepositoryを構築するメソッドを提供する

use super::{UnifiedManager, get_default_automerge_path};
use crate::unified::{
    RecurrenceRuleUnifiedRepository, SubTaskRecurrenceUnifiedRepository,
    TaskRecurrenceUnifiedRepository,
};
use flequit_infrastructure_automerge::infrastructure::task_projects::{
    recurrence_rule::RecurrenceRuleLocalAutomergeRepository,
    subtask_recurrence::SubtaskRecurrenceLocalAutomergeRepository,
    task_recurrence::TaskRecurrenceLocalAutomergeRepository,
};
use flequit_infrastructure_sqlite::infrastructure::database_manager::DatabaseManager;
use flequit_infrastructure_sqlite::infrastructure::task_projects::{
    recurrence_rule::RecurrenceRuleLocalSqliteRepository,
    subtask_recurrence::SubtaskRecurrenceLocalSqliteRepository,
    task_recurrence::TaskRecurrenceLocalSqliteRepository,
};

impl UnifiedManager {
    /// RecurrenceRule用UnifiedRepositoryを構築
    pub async fn create_recurrence_rule_unified_repository(
        &self,
    ) -> Result<RecurrenceRuleUnifiedRepository, Box<dyn std::error::Error>> {
        let mut repo = RecurrenceRuleUnifiedRepository::default();

        // SQLiteリポジトリの設定
        if self.config.sqlite_search_enabled || self.config.sqlite_storage_enabled {
            let db_manager = DatabaseManager::instance().await?;

            if self.config.sqlite_search_enabled {
                let sqlite_repo = RecurrenceRuleLocalSqliteRepository::new(db_manager.clone());
                repo.add_sqlite_for_search(sqlite_repo);
                tracing::info!("SQLiteリポジトリを検索用に追加しました（RecurrenceRule）");
            }

            if self.config.sqlite_storage_enabled {
                let sqlite_repo = RecurrenceRuleLocalSqliteRepository::new(db_manager.clone());
                repo.add_sqlite_for_save(sqlite_repo);
                tracing::info!("SQLiteリポジトリを保存用に追加しました（RecurrenceRule）");
            }
        }

        // Automergeリポジトリの設定
        if self.config.automerge_storage_enabled {
            let automerge_repo = if let Some(doc_manager) = &self.shared_document_manager {
                RecurrenceRuleLocalAutomergeRepository::new_with_manager(doc_manager.clone())
                    .await?
            } else {
                let base_path =
                    get_default_automerge_path().ok_or("Failed to get default Automerge path")?;
                RecurrenceRuleLocalAutomergeRepository::new(base_path).await?
            };

            repo.add_automerge_for_save(automerge_repo);
            tracing::info!("Automergeリポジトリを保存用に追加しました（RecurrenceRule）");
        }

        tracing::info!(
            "RecurrenceRuleUnifiedRepository構築完了 - 保存用: {} 検索用: {} リポジトリ",
            repo.save_repositories_count(),
            repo.search_repositories_count()
        );

        Ok(repo)
    }

    /// TaskRecurrence用UnifiedRepositoryを構築
    pub async fn create_task_recurrence_unified_repository(
        &self,
    ) -> Result<TaskRecurrenceUnifiedRepository, Box<dyn std::error::Error>> {
        let mut repo = TaskRecurrenceUnifiedRepository::default();

        // SQLiteリポジトリの設定
        if self.config.sqlite_search_enabled || self.config.sqlite_storage_enabled {
            let db_manager = DatabaseManager::instance().await?;

            if self.config.sqlite_search_enabled {
                let sqlite_repo = TaskRecurrenceLocalSqliteRepository::new(db_manager.clone());
                repo.add_sqlite_for_search(sqlite_repo);
                tracing::info!("SQLiteリポジトリを検索用に追加しました（TaskRecurrence）");
            }

            if self.config.sqlite_storage_enabled {
                let sqlite_repo = TaskRecurrenceLocalSqliteRepository::new(db_manager.clone());
                repo.add_sqlite_for_save(sqlite_repo);
                tracing::info!("SQLiteリポジトリを保存用に追加しました（TaskRecurrence）");
            }
        }

        // Automergeリポジトリの設定
        if self.config.automerge_storage_enabled {
            let automerge_repo = if let Some(doc_manager) = &self.shared_document_manager {
                TaskRecurrenceLocalAutomergeRepository::new_with_manager(doc_manager.clone())
                    .await?
            } else {
                let base_path =
                    get_default_automerge_path().ok_or("Failed to get default Automerge path")?;
                TaskRecurrenceLocalAutomergeRepository::new(base_path).await?
            };

            repo.add_automerge_for_save(automerge_repo);
            tracing::info!("Automergeリポジトリを保存用に追加しました（TaskRecurrence）");
        }

        tracing::info!(
            "TaskRecurrenceUnifiedRepository構築完了 - 保存用: {} 検索用: {} リポジトリ",
            repo.save_repositories_count(),
            repo.search_repositories_count()
        );

        Ok(repo)
    }

    /// SubTaskRecurrence用UnifiedRepositoryを構築
    pub async fn create_subtask_recurrence_unified_repository(
        &self,
    ) -> Result<SubTaskRecurrenceUnifiedRepository, Box<dyn std::error::Error>> {
        let mut repo = SubTaskRecurrenceUnifiedRepository::default();

        // SQLiteリポジトリの設定
        if self.config.sqlite_search_enabled || self.config.sqlite_storage_enabled {
            let db_manager = DatabaseManager::instance().await?;

            if self.config.sqlite_search_enabled {
                let sqlite_repo = SubtaskRecurrenceLocalSqliteRepository::new(db_manager.clone());
                repo.add_sqlite_for_search(sqlite_repo);
                tracing::info!("SQLiteリポジトリを検索用に追加しました（SubTaskRecurrence）");
            }

            if self.config.sqlite_storage_enabled {
                let sqlite_repo = SubtaskRecurrenceLocalSqliteRepository::new(db_manager.clone());
                repo.add_sqlite_for_save(sqlite_repo);
                tracing::info!("SQLiteリポジトリを保存用に追加しました（SubTaskRecurrence）");
            }
        }

        // Automergeリポジトリの設定
        if self.config.automerge_storage_enabled {
            let automerge_repo = if let Some(doc_manager) = &self.shared_document_manager {
                SubtaskRecurrenceLocalAutomergeRepository::new_with_manager(doc_manager.clone())
                    .await?
            } else {
                let base_path =
                    get_default_automerge_path().ok_or("Failed to get default Automerge path")?;
                SubtaskRecurrenceLocalAutomergeRepository::new(base_path).await?
            };

            repo.add_automerge_for_save(automerge_repo);
            tracing::info!("Automergeリポジトリを保存用に追加しました（SubTaskRecurrence）");
        }

        tracing::info!(
            "SubTaskRecurrenceUnifiedRepository構築完了 - 保存用: {} 検索用: {} リポジトリ",
            repo.save_repositories_count(),
            repo.search_repositories_count()
        );

        Ok(repo)
    }
}
