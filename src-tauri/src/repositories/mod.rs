pub mod local_automerge;
pub mod local_sqlite;

pub mod account_repository_trait;
pub mod base_repository_trait;
pub mod project_repository_trait;
pub mod setting_repository_trait;
pub mod sub_task_repository_trait;
pub mod tag_repository_trait;
pub mod task_list_repository_trait;
pub mod task_repository_trait;
pub mod unified;
pub mod user_repository_trait;

use crate::errors::RepositoryError;
use crate::repositories::unified::{
    AccountUnifiedRepository, ProjectUnifiedRepository, SettingsUnifiedRepository,
    SubTaskUnifiedRepository, TagUnifiedRepository, TaskListUnifiedRepository,
    TaskUnifiedRepository, UserUnifiedRepository,
};

/// 統合リポジトリのメインエントリーポイント
///
/// 全エンティティへの統一アクセスポイントを提供し、
/// 内部で最適なストレージを自動選択する。
pub struct Repositories {
    pub projects: ProjectUnifiedRepository,
    pub task_lists: TaskListUnifiedRepository,
    pub tasks: TaskUnifiedRepository,
    pub sub_tasks: SubTaskUnifiedRepository,
    pub tags: TagUnifiedRepository,
    pub accounts: AccountUnifiedRepository,
    pub users: UserUnifiedRepository,
    pub settings: SettingsUnifiedRepository,
}

impl Repositories {
    /// 新しい統合リポジトリインスタンスを作成
    pub async fn new() -> Result<Self, RepositoryError> {
        // 保存用SQLiteリポジトリ群を作成
        let save_sqlite_repos = crate::repositories::local_sqlite::local_sqlite_repositories::LocalSqliteRepositories::new().await?;

        // 検索用SQLiteリポジトリ群を作成
        let search_sqlite_repos = crate::repositories::local_sqlite::local_sqlite_repositories::LocalSqliteRepositories::new().await?;

        // Automergeリポジトリ群を作成
        let automerge_repos = crate::repositories::local_automerge::local_automerge_repositories::LocalAutomergeRepositories::new().await?;

        // 各UnifiedRepositoryを作成し、SQLiteとAutomergeリポジトリを追加
        let mut projects = ProjectUnifiedRepository::new(vec![], vec![]);
        projects.add_sqlite_for_save(save_sqlite_repos.projects);
        projects.add_sqlite_for_search(search_sqlite_repos.projects);
        projects.add_automerge_for_save(automerge_repos.projects);

        let mut task_lists = TaskListUnifiedRepository::new(vec![], vec![]);
        task_lists.add_sqlite_for_save(save_sqlite_repos.task_lists);
        task_lists.add_sqlite_for_search(search_sqlite_repos.task_lists);
        task_lists.add_project_tree_for_save(automerge_repos.project_trees.clone());

        let mut tasks = TaskUnifiedRepository::new(vec![], vec![]);
        tasks.add_sqlite_for_save(save_sqlite_repos.tasks);
        tasks.add_sqlite_for_search(search_sqlite_repos.tasks);
        tasks.add_project_tree_for_save(automerge_repos.project_trees.clone());

        let mut sub_tasks = SubTaskUnifiedRepository::new(vec![], vec![]);
        sub_tasks.add_sqlite_for_save(save_sqlite_repos.sub_tasks);
        sub_tasks.add_sqlite_for_search(search_sqlite_repos.sub_tasks);
        sub_tasks.add_project_tree_for_save(automerge_repos.project_trees.clone());

        let mut tags = TagUnifiedRepository::new(vec![], vec![]);
        tags.add_sqlite_for_save(save_sqlite_repos.tags);
        tags.add_sqlite_for_search(search_sqlite_repos.tags);
        tags.add_project_tree_for_save(automerge_repos.project_trees.clone());

        let mut accounts = AccountUnifiedRepository::new(vec![], vec![]);
        accounts.add_sqlite_for_save(save_sqlite_repos.accounts);
        accounts.add_sqlite_for_search(search_sqlite_repos.accounts);
        accounts.add_automerge_for_save(automerge_repos.accounts);

        let users = UserUnifiedRepository::new(vec![], vec![]);

        let mut settings = SettingsUnifiedRepository::new(vec![], vec![]);
        settings.add_sqlite_for_save(save_sqlite_repos.settings);
        settings.add_sqlite_for_search(search_sqlite_repos.settings);
        settings.add_automerge_for_save(automerge_repos.settings);

        Ok(Self {
            projects,
            task_lists,
            tasks,
            sub_tasks,
            tags,
            accounts,
            users,
            settings,
        })
    }
}
