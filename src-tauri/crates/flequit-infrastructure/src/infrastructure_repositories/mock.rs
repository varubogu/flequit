//! テスト用モックリポジトリ実装
//!
//! テストで使用するためのモック実装。各リポジトリのメソッド呼び出しを記録し、
//! 期待値を返すためのモックフレームワークと連携可能。

use crate::unified::*;
use async_trait::async_trait;
use flequit_core::ports::infrastructure_repositories::InfrastructureRepositoriesTrait;
use flequit_infrastructure_automerge::infrastructure::local_automerge_repositories::LocalAutomergeRepositories;
use flequit_infrastructure_automerge::infrastructure::user_preferences::tag_bookmark::TagBookmarkLocalAutomergeRepository;
use flequit_infrastructure_sqlite::infrastructure::database_manager::DatabaseManager;
use flequit_infrastructure_sqlite::infrastructure::local_sqlite_repositories::LocalSqliteRepositories;
use flequit_infrastructure_sqlite::infrastructure::user_preferences::tag_bookmark::TagBookmarkLocalSqliteRepository;
use std::sync::{Arc, Mutex};
use tokio::sync::RwLock;

#[derive(Debug)]
pub struct MockInfrastructureRepositories {
    pub call_log: Arc<Mutex<Vec<String>>>,
    // 各種モックリポジトリのインスタンス（必要に応じて追加）
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
    pub tag_bookmarks_sqlite: flequit_infrastructure_sqlite::infrastructure::user_preferences::tag_bookmark::TagBookmarkLocalSqliteRepository,
    pub tag_bookmarks_automerge: flequit_infrastructure_automerge::infrastructure::user_preferences::tag_bookmark::TagBookmarkLocalAutomergeRepository,
    pub unified_manager: UnifiedManager,
}

impl MockInfrastructureRepositories {
    pub fn new() -> Self {
        Self {
            call_log: Arc::new(Mutex::new(Vec::new())),
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
            tag_bookmarks_sqlite:
                flequit_infrastructure_sqlite::infrastructure::user_preferences::tag_bookmark::TagBookmarkLocalSqliteRepository::new(
                    Arc::new(RwLock::new(DatabaseManager::new_for_test(
                        "/tmp/flequit-placeholder.sqlite",
                    ))),
                ),
            tag_bookmarks_automerge: flequit_infrastructure_automerge::infrastructure::user_preferences::tag_bookmark::TagBookmarkLocalAutomergeRepository::default(),
            unified_manager: UnifiedManager::default(),
        }
    }

    /// 呼び出しログを記録するヘルパーメソッド
    fn log_call(&self, method_name: &str) {
        if let Ok(mut log) = self.call_log.lock() {
            log.push(method_name.to_string());
        }
    }

    /// 呼び出しログを取得
    pub fn get_call_log(&self) -> Vec<String> {
        self.call_log
            .lock()
            .map(|log| log.clone())
            .unwrap_or_default()
    }

    /// 呼び出しログをクリア
    pub fn clear_call_log(&self) {
        if let Ok(mut log) = self.call_log.lock() {
            log.clear();
        }
    }
}

#[async_trait]
impl InfrastructureRepositoriesTrait for MockInfrastructureRepositories {
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

    fn sqlite_repositories(&self) -> Option<&std::sync::Arc<RwLock<Self::SqliteRepositories>>> {
        None
    }

    fn automerge_repositories(
        &self,
    ) -> Option<&std::sync::Arc<RwLock<Self::AutomergeRepositories>>> {
        None
    }

    fn accounts(&self) -> &Self::AccountsRepository {
        self.log_call("accounts");
        &self.accounts
    }

    fn projects(&self) -> &Self::ProjectsRepository {
        self.log_call("projects");
        &self.projects
    }

    fn tags(&self) -> &Self::TagsRepository {
        self.log_call("tags");
        &self.tags
    }

    fn tasks(&self) -> &Self::TasksRepository {
        self.log_call("tasks");
        &self.tasks
    }

    fn task_lists(&self) -> &Self::TaskListsRepository {
        self.log_call("task_lists");
        &self.task_lists
    }

    fn sub_tasks(&self) -> &Self::SubTasksRepository {
        self.log_call("sub_tasks");
        &self.sub_tasks
    }

    fn users(&self) -> &Self::UsersRepository {
        self.log_call("users");
        &self.users
    }

    fn recurrence_rules(&self) -> &Self::RecurrenceRulesRepository {
        self.log_call("recurrence_rules");
        &self.recurrence_rules
    }

    fn task_assignments(&self) -> &Self::TaskAssignmentsRepository {
        self.log_call("task_assignments");
        &self.task_assignments
    }

    fn subtask_assignments(&self) -> &Self::SubtaskAssignmentsRepository {
        self.log_call("subtask_assignments");
        &self.subtask_assignments
    }

    fn task_tags(&self) -> &Self::TaskTagsRepository {
        self.log_call("task_tags");
        &self.task_tags
    }

    fn subtask_tags(&self) -> &Self::SubtaskTagsRepository {
        self.log_call("subtask_tags");
        &self.subtask_tags
    }

    fn task_recurrences(&self) -> &Self::TaskRecurrencesRepository {
        self.log_call("task_recurrences");
        &self.task_recurrences
    }

    fn subtask_recurrences(&self) -> &Self::SubtaskRecurrencesRepository {
        self.log_call("subtask_recurrences");
        &self.subtask_recurrences
    }

    fn tag_bookmarks_sqlite(&self) -> &Self::TagBookmarksSqliteRepository {
        self.log_call("tag_bookmarks_sqlite");
        &self.tag_bookmarks_sqlite
    }

    fn tag_bookmarks_automerge(&self) -> &Self::TagBookmarksAutomergeRepository {
        self.log_call("tag_bookmarks_automerge");
        &self.tag_bookmarks_automerge
    }

    async fn initialize(&mut self) -> Result<(), Box<dyn std::error::Error>> {
        self.log_call("initialize");
        // モック実装では何もしない
        Ok(())
    }

    async fn cleanup(&mut self) -> Result<(), Box<dyn std::error::Error>> {
        self.log_call("cleanup");
        // モック実装では何もしない
        Ok(())
    }
}
