//! Infrastructure統合リポジトリ管理
//!
//! Service層からアクセスするためのリポジトリ統合管理クラス

mod transaction;

use crate::unified::*;
use async_trait::async_trait;
use flequit_core::ports::infrastructure_repositories::{
    InfrastructureRepositoriesTrait, TagRepositoryExt,
};
use flequit_infrastructure_automerge::infrastructure::local_automerge_repositories::LocalAutomergeRepositories;
use flequit_infrastructure_automerge::infrastructure::user_preferences::tag_bookmark::TagBookmarkLocalAutomergeRepository;
use flequit_infrastructure_sqlite::infrastructure::local_sqlite_repositories::LocalSqliteRepositories;
use flequit_infrastructure_sqlite::infrastructure::user_preferences::tag_bookmark::TagBookmarkLocalSqliteRepository;
use flequit_model::types::id_types::{ProjectId, TagId};
use flequit_types::errors::repository_error::RepositoryError;
use std::sync::Arc;
use tokio::sync::RwLock;

#[async_trait]
impl TagRepositoryExt for TagUnifiedRepository {
    async fn delete_with_relations(
        &self,
        project_id: &ProjectId,
        tag_id: &TagId,
    ) -> Result<(), RepositoryError> {
        self.delete_with_relations(project_id, tag_id).await
    }
}

/// Infrastructure層統合リポジトリ管理
///
/// 各エンティティのUnifiedRepositoryを統合管理し、
/// Service層から一元的にアクセスできるインターフェースを提供する。
#[derive(Debug)]
pub struct InfrastructureRepositories {
    pub accounts: AccountUnifiedRepository,
    pub projects: ProjectUnifiedRepository,
    pub tags: TagUnifiedRepository,
    pub tasks: TaskUnifiedRepository,
    pub task_lists: TaskListUnifiedRepository,
    pub sub_tasks: SubTaskUnifiedRepository,
    pub users: UserUnifiedRepository,
    pub recurrence_rules: RecurrenceRuleUnifiedRepository,
    pub task_assignments: TaskAssignmentUnifiedRepository,
    pub subtask_assignments: SubTaskAssignmentUnifiedRepository,
    pub task_tags: TaskTagUnifiedRepository,
    pub subtask_tags: SubTaskTagUnifiedRepository,
    pub task_recurrences: TaskRecurrenceUnifiedRepository,
    pub subtask_recurrences: SubTaskRecurrenceUnifiedRepository,

    // User Preferences
    pub tag_bookmarks_sqlite: flequit_infrastructure_sqlite::infrastructure::user_preferences::tag_bookmark::TagBookmarkLocalSqliteRepository,
    pub tag_bookmarks_automerge: flequit_infrastructure_automerge::infrastructure::user_preferences::tag_bookmark::TagBookmarkLocalAutomergeRepository,

    // Unified層の設定・管理
    pub(crate) unified_manager: UnifiedManager,
}

impl InfrastructureRepositories {
    /// 新しいInfrastructureRepositoriesを作成
    ///
    /// 各UnifiedRepositoryのデフォルト実装を使用する
    pub fn new() -> Self {
        Self {
            accounts: AccountUnifiedRepository::default(),
            projects: ProjectUnifiedRepository::default(),
            tags: TagUnifiedRepository::default(),
            tasks: TaskUnifiedRepository::default(),
            task_lists: TaskListUnifiedRepository::default(),
            sub_tasks: SubTaskUnifiedRepository::default(),
            users: UserUnifiedRepository::default(),
            recurrence_rules: RecurrenceRuleUnifiedRepository::default(),
            task_assignments: TaskAssignmentUnifiedRepository::default(),
            subtask_assignments: SubTaskAssignmentUnifiedRepository::default(),
            task_tags: TaskTagUnifiedRepository::default(),
            subtask_tags: SubTaskTagUnifiedRepository::default(),
            task_recurrences: TaskRecurrenceUnifiedRepository::default(),
            subtask_recurrences: SubTaskRecurrenceUnifiedRepository::default(),
            // User Preferences - テスト用のダミーインスタンス
            // 実際の使用時はsetup_with_sqlite_and_automerge()を使用すること
            tag_bookmarks_sqlite: {
                use flequit_infrastructure_sqlite::infrastructure::database_manager::DatabaseManager;

                // 同期コンテキストでも安全に構築できるテスト用DatabaseManagerを使用
                let dummy_db = Arc::new(RwLock::new(DatabaseManager::new_for_test(
                    "/tmp/flequit-placeholder.sqlite",
                )));
                TagBookmarkLocalSqliteRepository::new(dummy_db)
            },
            tag_bookmarks_automerge: TagBookmarkLocalAutomergeRepository::default(),
            unified_manager: UnifiedManager::default(),
        }
    }

    /// SQLiteとAutomergeのリポジトリを設定した完全なInfrastructureRepositoriesを作成
    ///
    /// 実際のアプリケーションで使用するためのセットアップされたリポジトリ群を返す
    pub async fn setup_with_sqlite_and_automerge(
        config: UnifiedConfig,
    ) -> Result<Self, Box<dyn std::error::Error>> {
        let unified_manager = UnifiedManager::from_config(config).await?;

        let projects = unified_manager.create_project_unified_repository().await?;
        let accounts = unified_manager.create_account_unified_repository().await?;
        let tasks = unified_manager.create_task_unified_repository().await?;
        let task_lists = unified_manager
            .create_task_list_unified_repository()
            .await?;
        let tags = unified_manager.create_tag_unified_repository().await?;
        let sub_tasks = unified_manager.create_sub_task_unified_repository().await?;
        let users = unified_manager.create_user_unified_repository().await?;
        let recurrence_rules = unified_manager
            .create_recurrence_rule_unified_repository()
            .await?;
        let task_assignments = unified_manager
            .create_task_assignment_unified_repository()
            .await?;
        let subtask_assignments = unified_manager
            .create_sub_task_assignment_unified_repository()
            .await?;
        let task_tags = unified_manager.create_task_tag_unified_repository().await?;
        let subtask_tags = unified_manager
            .create_sub_task_tag_unified_repository()
            .await?;
        let task_recurrences = unified_manager
            .create_task_recurrence_unified_repository()
            .await?;
        let subtask_recurrences = unified_manager
            .create_subtask_recurrence_unified_repository()
            .await?;

        // User Preferences - LocalRepositoriesから取得
        // SQLiteまたはAutomergeが無効な場合、TagBookmarkリポジトリは使用不可
        let tag_bookmarks_sqlite = unified_manager
            .sqlite_repositories()
            .ok_or("SQLite repositories not initialized")?
            .read()
            .await
            .tag_bookmarks()
            .clone();

        let tag_bookmarks_automerge = unified_manager
            .automerge_repositories()
            .ok_or("Automerge repositories not initialized")?
            .read()
            .await
            .tag_bookmarks()
            .clone();

        tracing::info!("全UnifiedRepositoryの構築完了");

        Ok(Self {
            accounts,
            projects,
            tasks,
            task_lists,
            tags,
            sub_tasks,
            users,
            recurrence_rules,
            task_assignments,
            subtask_assignments,
            task_tags,
            subtask_tags,
            task_recurrences,
            subtask_recurrences,
            tag_bookmarks_sqlite,
            tag_bookmarks_automerge,
            unified_manager,
        })
    }

    /// 設定を更新し、バックエンドを再構築
    ///
    /// 実行時に設定が変更された場合に呼び出す
    pub async fn update_config(
        &mut self,
        new_config: UnifiedConfig,
    ) -> Result<(), Box<dyn std::error::Error>> {
        self.unified_manager.update_config(new_config).await?;

        // リポジトリを再構築
        self.projects = self
            .unified_manager
            .create_project_unified_repository()
            .await?;
        self.accounts = self
            .unified_manager
            .create_account_unified_repository()
            .await?;

        tracing::info!("Infrastructure repositories updated with new config");
        Ok(())
    }

    /// 現在の設定を取得
    pub fn config(&self) -> &UnifiedConfig {
        self.unified_manager.config()
    }
}

impl Default for InfrastructureRepositories {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait]
impl InfrastructureRepositoriesTrait for InfrastructureRepositories {
    type AccountsRepository = AccountUnifiedRepository;
    type ProjectsRepository = ProjectUnifiedRepository;
    type TagsRepository = TagUnifiedRepository;
    type TasksRepository = TaskUnifiedRepository;
    type TaskListsRepository = TaskListUnifiedRepository;
    type SubTasksRepository = SubTaskUnifiedRepository;
    type UsersRepository = UserUnifiedRepository;
    type RecurrenceRulesRepository = RecurrenceRuleUnifiedRepository;
    type TaskAssignmentsRepository = TaskAssignmentUnifiedRepository;
    type SubtaskAssignmentsRepository = SubTaskAssignmentUnifiedRepository;
    type TaskTagsRepository = TaskTagUnifiedRepository;
    type SubtaskTagsRepository = SubTaskTagUnifiedRepository;
    type TaskRecurrencesRepository = TaskRecurrenceUnifiedRepository;
    type SubtaskRecurrencesRepository = SubTaskRecurrenceUnifiedRepository;
    type TagBookmarksSqliteRepository = TagBookmarkLocalSqliteRepository;
    type TagBookmarksAutomergeRepository = TagBookmarkLocalAutomergeRepository;
    type SqliteRepositories = LocalSqliteRepositories;
    type AutomergeRepositories = LocalAutomergeRepositories;

    fn accounts(&self) -> &Self::AccountsRepository {
        &self.accounts
    }

    fn projects(&self) -> &Self::ProjectsRepository {
        &self.projects
    }

    fn tags(&self) -> &Self::TagsRepository {
        &self.tags
    }

    fn tasks(&self) -> &Self::TasksRepository {
        &self.tasks
    }

    fn task_lists(&self) -> &Self::TaskListsRepository {
        &self.task_lists
    }

    fn sub_tasks(&self) -> &Self::SubTasksRepository {
        &self.sub_tasks
    }

    fn users(&self) -> &Self::UsersRepository {
        &self.users
    }

    fn recurrence_rules(&self) -> &Self::RecurrenceRulesRepository {
        &self.recurrence_rules
    }

    fn task_assignments(&self) -> &Self::TaskAssignmentsRepository {
        &self.task_assignments
    }

    fn subtask_assignments(&self) -> &Self::SubtaskAssignmentsRepository {
        &self.subtask_assignments
    }

    fn task_tags(&self) -> &Self::TaskTagsRepository {
        &self.task_tags
    }

    fn subtask_tags(&self) -> &Self::SubtaskTagsRepository {
        &self.subtask_tags
    }

    fn task_recurrences(&self) -> &Self::TaskRecurrencesRepository {
        &self.task_recurrences
    }

    fn subtask_recurrences(&self) -> &Self::SubtaskRecurrencesRepository {
        &self.subtask_recurrences
    }

    fn tag_bookmarks_sqlite(&self) -> &Self::TagBookmarksSqliteRepository {
        &self.tag_bookmarks_sqlite
    }

    fn tag_bookmarks_automerge(&self) -> &Self::TagBookmarksAutomergeRepository {
        &self.tag_bookmarks_automerge
    }

    async fn initialize(&mut self) -> Result<(), Box<dyn std::error::Error>> {
        // 各リポジトリの初期化処理
        // TODO: 実際のSQLiteとAutomergeの接続・初期化処理を実装
        tracing::info!("Infrastructure repositories initialized");
        Ok(())
    }

    async fn cleanup(&mut self) -> Result<(), Box<dyn std::error::Error>> {
        // 各リポジトリのクリーンアップ処理
        // TODO: 実際のSQLiteとAutomergeの接続クローズ処理を実装
        tracing::info!("Infrastructure repositories cleaned up");
        Ok(())
    }

    fn sqlite_repositories(&self) -> Option<&Arc<RwLock<Self::SqliteRepositories>>> {
        self.unified_manager.sqlite_repositories()
    }

    fn automerge_repositories(&self) -> Option<&Arc<RwLock<Self::AutomergeRepositories>>> {
        self.unified_manager.automerge_repositories()
    }
}

#[cfg(test)]
pub mod mock;

#[cfg(test)]
mod tests {
    use super::mock::MockInfrastructureRepositories;
    use super::*;

    #[test]
    fn test_infrastructure_repositories_trait_implementation() {
        let repos = InfrastructureRepositories::new();

        // トレイトメソッドが正常に呼び出せることをテスト
        let _accounts = repos.accounts();
        let _projects = repos.projects();
        let _tags = repos.tags();
        let _tasks = repos.tasks();
        let _task_lists = repos.task_lists();
        let _sub_tasks = repos.sub_tasks();
        let _users = repos.users();
        let _task_assignments = repos.task_assignments();
        let _subtask_assignments = repos.subtask_assignments();

        // 非同期メソッドのテストはここでは省略
        // （実際のテストでは適切なテスト用ランタイムを使用する）
    }

    #[test]
    fn test_mock_infrastructure_repositories() {
        let mock_repos = MockInfrastructureRepositories::new();

        // モックメソッドの呼び出しテスト
        let _accounts = mock_repos.accounts();
        let _projects = mock_repos.projects();
        let _tasks = mock_repos.tasks();

        // 呼び出しログの確認
        let call_log = mock_repos.get_call_log();
        assert_eq!(call_log.len(), 3, "3回のメソッド呼び出しが記録されること");
        assert_eq!(call_log[0], "accounts", "accounts メソッドが記録されること");
        assert_eq!(call_log[1], "projects", "projects メソッドが記録されること");
        assert_eq!(call_log[2], "tasks", "tasks メソッドが記録されること");

        // ログクリアのテスト
        mock_repos.clear_call_log();
        let call_log_after_clear = mock_repos.get_call_log();
        assert_eq!(call_log_after_clear.len(), 0, "ログがクリアされること");

        // 非同期メソッドのテストは省略
        // （実際のプロダクションテストでは適切なランタイムを使用）
    }

    #[test]
    fn test_infrastructure_repositories_trait_object() {
        fn assert_infra_trait_impl<T: InfrastructureRepositoriesTrait>(_repos: &T) {}

        let repos = InfrastructureRepositories::new();
        assert_infra_trait_impl(&repos);

        let mock_repos = MockInfrastructureRepositories::new();
        assert_infra_trait_impl(&mock_repos);
    }
}
