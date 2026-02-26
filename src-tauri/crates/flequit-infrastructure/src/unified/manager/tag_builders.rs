//! タグ・タスクタグ・サブタスクタグ用UnifiedRepositoryビルダー
//!
//! Tag、TaskTag、SubTaskTag エンティティのUnifiedRepositoryを構築するメソッドを提供する

use super::{get_default_automerge_path, UnifiedManager};
use crate::unified::{SubTaskTagUnifiedRepository, TagUnifiedRepository, TaskTagUnifiedRepository};
use flequit_infrastructure_automerge::infrastructure::task_projects::{
    subtask_tag::SubtaskTagLocalAutomergeRepository, tag::TagLocalAutomergeRepository,
    task_tag::TaskTagLocalAutomergeRepository,
};
use flequit_infrastructure_sqlite::infrastructure::database_manager::DatabaseManager;
use flequit_infrastructure_sqlite::infrastructure::task_projects::{
    subtask_tag::SubtaskTagLocalSqliteRepository, tag::TagLocalSqliteRepository,
    task_tag::TaskTagLocalSqliteRepository,
};

impl UnifiedManager {
    /// Tag用UnifiedRepositoryを構築
    pub async fn create_tag_unified_repository(
        &self,
    ) -> Result<TagUnifiedRepository, Box<dyn std::error::Error>> {
        let mut repo = TagUnifiedRepository::default();

        // SQLiteリポジトリの設定
        if self.config.sqlite_search_enabled || self.config.sqlite_storage_enabled {
            let db_manager = DatabaseManager::instance().await?;

            if self.config.sqlite_search_enabled {
                let sqlite_repo = TagLocalSqliteRepository::new(db_manager.clone());
                repo.add_sqlite_for_search(sqlite_repo);
                tracing::info!("SQLiteリポジトリを検索用に追加しました（Tag）");
            }

            if self.config.sqlite_storage_enabled {
                let sqlite_repo = TagLocalSqliteRepository::new(db_manager.clone());
                repo.add_sqlite_for_save(sqlite_repo);
                tracing::info!("SQLiteリポジトリを保存用に追加しました（Tag）");
            }
        }

        // Automergeリポジトリの設定
        if self.config.automerge_storage_enabled {
            let automerge_repo = if let Some(doc_manager) = &self.shared_document_manager {
                TagLocalAutomergeRepository::new_with_manager(doc_manager.clone()).await?
            } else {
                let base_path = get_default_automerge_path()
                    .ok_or("Failed to get default Automerge path")?;
                TagLocalAutomergeRepository::new(base_path).await?
            };

            repo.add_automerge_for_save(automerge_repo);
            tracing::info!("Automergeリポジトリを保存用に追加しました（Tag）");
        }

        tracing::info!(
            "TagUnifiedRepository構築完了 - 保存用: {} 検索用: {} リポジトリ",
            repo.save_repositories_count(),
            repo.search_repositories_count()
        );

        Ok(repo)
    }

    /// TaskTag用UnifiedRepositoryを構築
    pub async fn create_task_tag_unified_repository(
        &self,
    ) -> Result<TaskTagUnifiedRepository, Box<dyn std::error::Error>> {
        let mut repo = TaskTagUnifiedRepository::default();

        // SQLiteリポジトリの設定
        if self.config.sqlite_search_enabled || self.config.sqlite_storage_enabled {
            let db_manager = DatabaseManager::instance().await?;

            // 検索にSQLiteリポジトリを追加
            if self.config.sqlite_search_enabled {
                let sqlite_repo = TaskTagLocalSqliteRepository::new(db_manager.clone());
                repo.add_sqlite_for_search(sqlite_repo);
                tracing::info!("SQLiteリポジトリを検索用に追加しました（TaskTag）");
            }

            // 保存にもSQLiteリポジトリを追加
            if self.config.sqlite_storage_enabled {
                let sqlite_repo = TaskTagLocalSqliteRepository::new(db_manager.clone());
                repo.add_sqlite_for_save(sqlite_repo);
                tracing::info!("SQLiteリポジトリを保存用に追加しました（TaskTag）");
            }
        }

        // Automergeリポジトリの設定
        if self.config.automerge_storage_enabled {
            let automerge_repo = if let Some(doc_manager) = &self.shared_document_manager {
                TaskTagLocalAutomergeRepository::new_with_manager(doc_manager.clone()).await?
            } else {
                let base_path = get_default_automerge_path()
                    .ok_or("Failed to get default Automerge path")?;
                TaskTagLocalAutomergeRepository::new(base_path).await?
            };

            repo.add_automerge_for_save(automerge_repo);
            tracing::info!("Automergeリポジトリを保存用に追加しました（TaskTag）");
        }

        tracing::info!(
            "TaskTagUnifiedRepository構築完了 - 保存用: {} 検索用: 1 リポジトリ",
            repo.save_repositories_count()
        );

        Ok(repo)
    }

    /// SubTaskTag用UnifiedRepositoryを構築
    pub async fn create_sub_task_tag_unified_repository(
        &self,
    ) -> Result<SubTaskTagUnifiedRepository, Box<dyn std::error::Error>> {
        let mut repo = SubTaskTagUnifiedRepository::default();

        // SQLiteリポジトリの設定
        if self.config.sqlite_search_enabled || self.config.sqlite_storage_enabled {
            let db_manager = DatabaseManager::instance().await?;

            if self.config.sqlite_search_enabled {
                let sqlite_repo = SubtaskTagLocalSqliteRepository::new(db_manager.clone());
                repo.add_sqlite_for_search(sqlite_repo);
                tracing::info!("SQLiteリポジトリを検索用に追加しました（SubTaskTag）");
            }

            if self.config.sqlite_storage_enabled {
                let sqlite_repo = SubtaskTagLocalSqliteRepository::new(db_manager.clone());
                repo.add_sqlite_for_save(sqlite_repo);
                tracing::info!("SQLiteリポジトリを保存用に追加しました（SubTaskTag）");
            }
        }

        // Automergeリポジトリの設定
        if self.config.automerge_storage_enabled {
            let automerge_repo = if let Some(doc_manager) = &self.shared_document_manager {
                SubtaskTagLocalAutomergeRepository::new_with_manager(doc_manager.clone()).await?
            } else {
                let base_path = get_default_automerge_path()
                    .ok_or("Failed to get default Automerge path")?;
                SubtaskTagLocalAutomergeRepository::new(base_path).await?
            };

            repo.add_automerge_for_save(automerge_repo);
            tracing::info!("Automergeリポジトリを保存用に追加しました（SubTaskTag）");
        }

        tracing::info!(
            "SubTaskTagUnifiedRepository構築完了 - 保存用: {} 検索用: 1 リポジトリ",
            repo.save_repositories_count()
        );

        Ok(repo)
    }
}
