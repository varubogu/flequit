//! プロジェクト・アカウント・ユーザー用UnifiedRepositoryビルダー
//!
//! Project、Account、User エンティティのUnifiedRepositoryを構築するメソッドを提供する

use super::{get_default_automerge_path, UnifiedManager};
use crate::unified::{AccountUnifiedRepository, ProjectUnifiedRepository, UserUnifiedRepository};
use flequit_infrastructure_automerge::infrastructure::accounts::account::AccountLocalAutomergeRepository;
use flequit_infrastructure_automerge::infrastructure::task_projects::project::ProjectLocalAutomergeRepository;
use flequit_infrastructure_automerge::infrastructure::users::user::UserLocalAutomergeRepository;
use flequit_infrastructure_sqlite::infrastructure::accounts::account::AccountLocalSqliteRepository;
use flequit_infrastructure_sqlite::infrastructure::database_manager::DatabaseManager;
use flequit_infrastructure_sqlite::infrastructure::task_projects::project::ProjectLocalSqliteRepository;
use flequit_infrastructure_sqlite::infrastructure::users::user::UserLocalSqliteRepository;

impl UnifiedManager {
    /// プロジェクト用UnifiedRepositoryを構築
    pub async fn create_project_unified_repository(
        &self,
    ) -> Result<ProjectUnifiedRepository, Box<dyn std::error::Error>> {
        let mut repo = ProjectUnifiedRepository::default();

        // SQLiteリポジトリの設定
        if self.config.sqlite_search_enabled || self.config.sqlite_storage_enabled {
            // DatabaseManagerを取得して新しいProjectLocalSqliteRepositoryを作成
            let db_manager = DatabaseManager::instance().await?;

            // 検索にSQLiteリポジトリを追加
            if self.config.sqlite_search_enabled {
                let sqlite_repo = ProjectLocalSqliteRepository::new(db_manager.clone());
                repo.add_sqlite_for_search(sqlite_repo);
                tracing::info!("SQLiteリポジトリを検索用に追加しました");
            }

            // 保存にもSQLiteリポジトリを追加（設定により）
            if self.config.sqlite_storage_enabled {
                let sqlite_repo = ProjectLocalSqliteRepository::new(db_manager.clone());
                repo.add_sqlite_for_save(sqlite_repo);
                tracing::info!("SQLiteリポジトリを保存用に追加しました");
            }
        }

        // Automergeリポジトリの設定
        if self.config.automerge_storage_enabled {
            // 新しいProjectLocalAutomergeRepositoryを作成
            let automerge_repo = if let Some(doc_manager) = &self.shared_document_manager {
                ProjectLocalAutomergeRepository::new_with_manager(doc_manager.clone()).await?
            } else {
                let base_path = get_default_automerge_path()
                    .ok_or("Failed to get default Automerge path")?;
                ProjectLocalAutomergeRepository::new(base_path).await?
            };

            // 保存にAutomergeリポジトリを追加
            repo.add_automerge_for_save(automerge_repo);
            tracing::info!("Automergeリポジトリを保存用に追加しました");
        }

        tracing::info!(
            "ProjectUnifiedRepository構築完了 - 保存用: {} 検索用: {} リポジトリ",
            repo.save_repositories_count(),
            repo.search_repositories_count()
        );

        Ok(repo)
    }

    /// アカウント用UnifiedRepositoryを構築
    pub async fn create_account_unified_repository(
        &self,
    ) -> Result<AccountUnifiedRepository, Box<dyn std::error::Error>> {
        let mut repo = AccountUnifiedRepository::default();

        // SQLiteリポジトリの設定
        if self.config.sqlite_search_enabled || self.config.sqlite_storage_enabled {
            // DatabaseManagerを取得して新しいAccountLocalSqliteRepositoryを作成
            let db_manager = DatabaseManager::instance().await?;

            // 検索にSQLiteリポジトリを追加
            if self.config.sqlite_search_enabled {
                let sqlite_repo = AccountLocalSqliteRepository::new(db_manager.clone());
                repo.add_sqlite_for_search(sqlite_repo);
                tracing::info!("SQLiteリポジトリを検索用に追加しました（Account）");
            }

            // 保存にもSQLiteリポジトリを追加（設定により）
            if self.config.sqlite_storage_enabled {
                let sqlite_repo = AccountLocalSqliteRepository::new(db_manager.clone());
                repo.add_sqlite_for_save(sqlite_repo);
                tracing::info!("SQLiteリポジトリを保存用に追加しました（Account）");
            }
        }

        // Automergeリポジトリの設定
        if self.config.automerge_storage_enabled {
            // 新しいAccountLocalAutomergeRepositoryを作成
            let automerge_repo = if let Some(doc_manager) = &self.shared_document_manager {
                AccountLocalAutomergeRepository::new_with_manager(doc_manager.clone()).await?
            } else {
                let base_path = get_default_automerge_path()
                    .ok_or("Failed to get default Automerge path")?;
                AccountLocalAutomergeRepository::new(base_path).await?
            };

            // 保存にAutomergeリポジトリを追加
            repo.add_automerge_for_save(automerge_repo);
            tracing::info!("Automergeリポジトリを保存用に追加しました（Account）");
        }

        tracing::info!("AccountUnifiedRepository構築完了");

        Ok(repo)
    }

    /// User用UnifiedRepositoryを構築
    pub async fn create_user_unified_repository(
        &self,
    ) -> Result<UserUnifiedRepository, Box<dyn std::error::Error>> {
        let mut repo = UserUnifiedRepository::default();

        // SQLiteリポジトリの設定
        if self.config.sqlite_search_enabled || self.config.sqlite_storage_enabled {
            let db_manager = DatabaseManager::instance().await?;

            // 検索にSQLiteリポジトリを追加
            if self.config.sqlite_search_enabled {
                let sqlite_repo = UserLocalSqliteRepository::new(db_manager.clone());
                repo.add_sqlite_for_search(sqlite_repo);
                tracing::info!("SQLiteリポジトリを検索用に追加しました（User）");
            }

            // 保存にもSQLiteリポジトリを追加（設定により）
            if self.config.sqlite_storage_enabled {
                let sqlite_repo = UserLocalSqliteRepository::new(db_manager.clone());
                repo.add_sqlite_for_save(sqlite_repo);
                tracing::info!("SQLiteリポジトリを保存用に追加しました（User）");
            }
        }

        // Automergeリポジトリの設定
        if self.config.automerge_storage_enabled {
            let automerge_repo = if let Some(doc_manager) = &self.shared_document_manager {
                UserLocalAutomergeRepository::new_with_manager(doc_manager.clone()).await?
            } else {
                let base_path = get_default_automerge_path()
                    .ok_or("Failed to get default Automerge path")?;
                UserLocalAutomergeRepository::new(base_path).await?
            };

            repo.add_automerge_for_save(automerge_repo);
            tracing::info!("Automergeリポジトリを保存用に追加しました（User）");
        }

        tracing::info!(
            "UserUnifiedRepository構築完了 - 保存用: {} 検索用: {} リポジトリ",
            repo.save_repositories().len(),
            repo.search_repositories().len()
        );

        Ok(repo)
    }
}
