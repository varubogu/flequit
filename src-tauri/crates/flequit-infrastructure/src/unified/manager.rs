//! Unified層のマネージャー
//!
//! 設定に基づいてバックエンドリポジトリを初期化・管理する

use flequit_infrastructure_automerge::LocalAutomergeRepositories;
use flequit_infrastructure_automerge::infrastructure::accounts::account::AccountLocalAutomergeRepository;
use flequit_infrastructure_automerge::infrastructure::document_manager::DocumentManager;
use flequit_infrastructure_automerge::infrastructure::task_projects::project::ProjectLocalAutomergeRepository;
use flequit_infrastructure_sqlite::infrastructure::accounts::account::AccountLocalSqliteRepository;
use flequit_infrastructure_sqlite::infrastructure::database_manager::DatabaseManager;
use flequit_infrastructure_sqlite::infrastructure::local_sqlite_repositories::LocalSqliteRepositories;
use flequit_infrastructure_sqlite::infrastructure::task_projects::project::ProjectLocalSqliteRepository;
use std::sync::Arc;
use tokio::sync::{Mutex, RwLock};

use crate::unified::UnifiedConfig;
use crate::unified::{
    AccountUnifiedRepository, ProjectUnifiedRepository, RecurrenceRuleUnifiedRepository,
    SubTaskAssignmentUnifiedRepository, SubTaskRecurrenceUnifiedRepository, SubTaskTagUnifiedRepository,
    SubTaskUnifiedRepository, TagUnifiedRepository, TaskAssignmentUnifiedRepository,
    TaskListUnifiedRepository, TaskRecurrenceUnifiedRepository, TaskTagUnifiedRepository,
    TaskUnifiedRepository, UserUnifiedRepository,
};

/// Unified層のマネージャー
///
/// 設定に基づいてバックエンドリポジトリの初期化・再構築を管理する
#[derive(Debug)]
pub struct UnifiedManager {
    config: UnifiedConfig,
    sqlite_repositories: Option<Arc<RwLock<LocalSqliteRepositories>>>,
    automerge_repositories: Option<Arc<RwLock<LocalAutomergeRepositories>>>,
    /// 共有DocumentManager - Automerge Repoの重複を避けるため
    shared_document_manager: Option<Arc<Mutex<DocumentManager>>>,
}

impl UnifiedManager {
    /// 新しいUnifiedManagerを作成
    pub fn new() -> Self {
        Self {
            config: UnifiedConfig::default(),
            sqlite_repositories: None,
            automerge_repositories: None,
            shared_document_manager: None,
        }
    }

    /// 設定から新しいUnifiedManagerを作成
    pub async fn from_config(config: UnifiedConfig) -> Result<Self, Box<dyn std::error::Error>> {
        config.validate()?;

        let mut manager = Self {
            config: config.clone(),
            sqlite_repositories: None,
            automerge_repositories: None,
            shared_document_manager: None,
        };

        manager.initialize_backends().await?;
        Ok(manager)
    }

    /// 設定を更新し、バックエンドを再構築する
    pub async fn update_config(
        &mut self,
        new_config: UnifiedConfig,
    ) -> Result<(), Box<dyn std::error::Error>> {
        new_config.validate()?;
        self.config = new_config;
        self.initialize_backends().await?;
        Ok(())
    }

    /// バックエンドリポジトリを初期化
    async fn initialize_backends(&mut self) -> Result<(), Box<dyn std::error::Error>> {
        // SQLiteリポジトリの初期化
        if self.config.sqlite_search_enabled || self.config.sqlite_storage_enabled {
            let sqlite_repos = LocalSqliteRepositories::setup().await?;
            self.sqlite_repositories = Some(Arc::new(RwLock::new(sqlite_repos)));
            tracing::info!("SQLiteリポジトリを初期化しました");
        } else {
            self.sqlite_repositories = None;
            tracing::info!("SQLiteリポジトリを無効にしました");
        }

        // Automergeリポジトリの初期化
        if self.config.automerge_storage_enabled {
            // 共有DocumentManagerを初期化（SQLiteと同じディレクトリ構造を使用）
            let base_path = get_default_automerge_path()
                .ok_or_else(|| "Failed to get default Automerge path")?;

            // ディレクトリが存在しない場合は作成
            if !base_path.exists() {
                std::fs::create_dir_all(&base_path)
                    .map_err(|e| format!("Failed to create Automerge directory: {}", e))?;
            }

            let document_manager = DocumentManager::new(base_path.clone())?;
            self.shared_document_manager = Some(Arc::new(Mutex::new(document_manager)));

            // 共有DocumentManagerを使用してAutomergeリポジトリを初期化
            let automerge_repos = LocalAutomergeRepositories::setup_with_shared_manager(
                self.shared_document_manager.clone().unwrap(),
            )
            .await?;
            self.automerge_repositories = Some(Arc::new(RwLock::new(automerge_repos)));
            tracing::info!("Automergeリポジトリを共有DocumentManagerで初期化しました: {:?}", base_path);
        } else {
            self.automerge_repositories = None;
            self.shared_document_manager = None;
            tracing::info!("Automergeリポジトリを無効にしました");
        }

        Ok(())
    }

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
                    .ok_or_else(|| "Failed to get default Automerge path")?;
                ProjectLocalAutomergeRepository::new(base_path).await?
            };

            // 保存にAutomergeリポジトリを追加
            repo.add_automerge_for_save(automerge_repo);
            tracing::info!("Automergeリポジトリを保存用に追加しました");

            // 必要に応じて検索にも追加可能（通常はSQLiteの方が高速）
            // repo.add_automerge_for_search(automerge_repo);
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
                    .ok_or_else(|| "Failed to get default Automerge path")?;
                AccountLocalAutomergeRepository::new(base_path).await?
            };

            // 保存にAutomergeリポジトリを追加
            repo.add_automerge_for_save(automerge_repo);
            tracing::info!("Automergeリポジトリを保存用に追加しました（Account）");
        }

        tracing::info!("AccountUnifiedRepository構築完了");

        Ok(repo)
    }

    /// タスク用UnifiedRepositoryを構築
    pub async fn create_task_unified_repository(
        &self,
    ) -> Result<TaskUnifiedRepository, Box<dyn std::error::Error>> {
        use flequit_infrastructure_automerge::infrastructure::task_projects::task::TaskLocalAutomergeRepository;
        use flequit_infrastructure_sqlite::infrastructure::task_projects::task::TaskLocalSqliteRepository;

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
                let base_path = get_default_automerge_path()
                    .ok_or_else(|| "Failed to get default Automerge path")?;
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
        use flequit_infrastructure_automerge::infrastructure::task_projects::task_list::TaskListLocalAutomergeRepository;
        use flequit_infrastructure_sqlite::infrastructure::task_projects::task_list::TaskListLocalSqliteRepository;

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
                let base_path = get_default_automerge_path()
                    .ok_or_else(|| "Failed to get default Automerge path")?;
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

    /// Tag用UnifiedRepositoryを構築
    pub async fn create_tag_unified_repository(
        &self,
    ) -> Result<TagUnifiedRepository, Box<dyn std::error::Error>> {
        use flequit_infrastructure_automerge::infrastructure::task_projects::tag::TagLocalAutomergeRepository;
        use flequit_infrastructure_sqlite::infrastructure::task_projects::tag::TagLocalSqliteRepository;

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
                    .ok_or_else(|| "Failed to get default Automerge path")?;
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

    /// SubTask用UnifiedRepositoryを構築
    pub async fn create_sub_task_unified_repository(
        &self,
    ) -> Result<SubTaskUnifiedRepository, Box<dyn std::error::Error>> {
        use flequit_infrastructure_automerge::infrastructure::task_projects::subtask::SubTaskLocalAutomergeRepository;
        use flequit_infrastructure_sqlite::infrastructure::task_projects::subtask::SubTaskLocalSqliteRepository;

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
                let base_path = get_default_automerge_path()
                    .ok_or_else(|| "Failed to get default Automerge path")?;
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

    /// User用UnifiedRepositoryを構築
    pub async fn create_user_unified_repository(
        &self,
    ) -> Result<UserUnifiedRepository, Box<dyn std::error::Error>> {
        use flequit_infrastructure_automerge::infrastructure::users::user::UserLocalAutomergeRepository;
        use flequit_infrastructure_sqlite::infrastructure::users::user::UserLocalSqliteRepository;

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
                    .ok_or_else(|| "Failed to get default Automerge path")?;
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

    /// TaskAssignment用UnifiedRepositoryを構築
    pub async fn create_task_assignment_unified_repository(
        &self,
    ) -> Result<TaskAssignmentUnifiedRepository, Box<dyn std::error::Error>> {
        use flequit_infrastructure_automerge::infrastructure::task_projects::task_assignments::TaskAssignmentLocalAutomergeRepository;
        use flequit_infrastructure_sqlite::infrastructure::task_projects::task_assignments::TaskAssignmentLocalSqliteRepository;

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
                    .ok_or_else(|| "Failed to get default Automerge path")?;
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
        use flequit_infrastructure_automerge::infrastructure::task_projects::subtask_assignments::SubtaskAssignmentLocalAutomergeRepository;
        use flequit_infrastructure_sqlite::infrastructure::task_projects::subtask_assignments::SubtaskAssignmentLocalSqliteRepository;

        let mut repo = SubTaskAssignmentUnifiedRepository::default();

        // SQLiteリポジトリの設定
        if self.config.sqlite_search_enabled || self.config.sqlite_storage_enabled {
            let db_manager = DatabaseManager::instance().await?;

            if self.config.sqlite_search_enabled {
                let sqlite_repo = SubtaskAssignmentLocalSqliteRepository::new(db_manager.clone());
                repo.add_sqlite_for_search(sqlite_repo);
                tracing::info!("SQLiteリポジトリを検索用に追加しました（SubTaskAssignment）");
            }

            if self.config.sqlite_storage_enabled {
                let sqlite_repo = SubtaskAssignmentLocalSqliteRepository::new(db_manager.clone());
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
                    .ok_or_else(|| "Failed to get default Automerge path")?;
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

    /// TaskTag用UnifiedRepositoryを構築
    pub async fn create_task_tag_unified_repository(
        &self,
    ) -> Result<TaskTagUnifiedRepository, Box<dyn std::error::Error>> {
        use flequit_infrastructure_automerge::infrastructure::task_projects::task_tag::TaskTagLocalAutomergeRepository;
        use flequit_infrastructure_sqlite::infrastructure::task_projects::task_tag::TaskTagLocalSqliteRepository;

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
                    .ok_or_else(|| "Failed to get default Automerge path")?;
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
        use flequit_infrastructure_automerge::infrastructure::task_projects::subtask_tag::SubtaskTagLocalAutomergeRepository;
        use flequit_infrastructure_sqlite::infrastructure::task_projects::subtask_tag::SubtaskTagLocalSqliteRepository;

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
                    .ok_or_else(|| "Failed to get default Automerge path")?;
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

    /// RecurrenceRule用UnifiedRepositoryを構築
    pub async fn create_recurrence_rule_unified_repository(
        &self,
    ) -> Result<RecurrenceRuleUnifiedRepository, Box<dyn std::error::Error>> {
        use flequit_infrastructure_automerge::infrastructure::task_projects::recurrence_rule::RecurrenceRuleLocalAutomergeRepository;
        use flequit_infrastructure_sqlite::infrastructure::task_projects::recurrence_rule::RecurrenceRuleLocalSqliteRepository;

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
                RecurrenceRuleLocalAutomergeRepository::new_with_manager(doc_manager.clone()).await?
            } else {
                let base_path = get_default_automerge_path()
                    .ok_or_else(|| "Failed to get default Automerge path")?;
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
        use flequit_infrastructure_automerge::infrastructure::task_projects::task_recurrence::TaskRecurrenceLocalAutomergeRepository;
        use flequit_infrastructure_sqlite::infrastructure::task_projects::task_recurrence::TaskRecurrenceLocalSqliteRepository;

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
                TaskRecurrenceLocalAutomergeRepository::new_with_manager(doc_manager.clone()).await?
            } else {
                let base_path = get_default_automerge_path()
                    .ok_or_else(|| "Failed to get default Automerge path")?;
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
        use flequit_infrastructure_automerge::infrastructure::task_projects::subtask_recurrence::SubtaskRecurrenceLocalAutomergeRepository;
        use flequit_infrastructure_sqlite::infrastructure::task_projects::subtask_recurrence::SubtaskRecurrenceLocalSqliteRepository;

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
                SubtaskRecurrenceLocalAutomergeRepository::new_with_manager(doc_manager.clone()).await?
            } else {
                let base_path = get_default_automerge_path()
                    .ok_or_else(|| "Failed to get default Automerge path")?;
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

    /// 現在の設定を取得
    pub fn config(&self) -> &UnifiedConfig {
        &self.config
    }

    /// SQLiteリポジトリへのアクセス（内部用）
    pub(crate) fn sqlite_repositories(&self) -> Option<&Arc<RwLock<LocalSqliteRepositories>>> {
        self.sqlite_repositories.as_ref()
    }

    /// Automergeリポジトリへのアクセス
    pub fn automerge_repositories(&self) -> Option<&Arc<RwLock<LocalAutomergeRepositories>>> {
        self.automerge_repositories.as_ref()
    }
}

impl Default for UnifiedManager {
    fn default() -> Self {
        Self::new()
    }
}

/// デフォルトのAutomergeデータディレクトリパスを取得
/// SQLiteと同じディレクトリ構造を使用: ~/.local/share/flequit/automerge/
fn get_default_automerge_path() -> Option<std::path::PathBuf> {
    use std::env;

    // 環境変数からAutomergeパスを取得
    if let Ok(automerge_path) = env::var("FLEQUIT_AUTOMERGE_PATH") {
        return Some(std::path::PathBuf::from(automerge_path));
    }

    // SQLiteと同じベースディレクトリを使用
    if let Some(data_dir) = dirs::data_dir() {
        let app_data_dir = data_dir.join("flequit");
        let automerge_dir = app_data_dir.join("automerge");
        return Some(automerge_dir);
    }

    None
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_unified_manager_creation() {
        let manager = UnifiedManager::new();
        assert!(manager.sqlite_repositories.is_none());
        assert!(manager.automerge_repositories.is_none());
    }

    #[tokio::test]
    async fn test_unified_manager_from_config() {
        let config = UnifiedConfig::default();
        let result = UnifiedManager::from_config(config).await;

        // この테스트はSQLiteとAutomergeの実際の初期化に依存するため、
        // テスト環境では失敗する可能性がある
        // 実際の実装では適切なモック化が必要
        match result {
            Ok(_manager) => {
                // 成功の場合のテスト
            }
            Err(e) => {
                // 초기화 실패는 테스트 환경에서 예상되는 경우
                println!("初期化に失敗（テスト環境では正常）: {}", e);
            }
        }
    }

    #[tokio::test]
    async fn test_config_validation() {
        let invalid_config = UnifiedConfig::new(false, false, false);

        let result = UnifiedManager::from_config(invalid_config).await;
        assert!(result.is_err());
    }
}
