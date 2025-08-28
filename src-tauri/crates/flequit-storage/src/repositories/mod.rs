
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
use std::sync::Arc;
use tokio::sync::OnceCell;

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

// シングルトンインスタンスを保持
static REPOSITORIES_INSTANCE: OnceCell<Arc<Repositories>> = OnceCell::const_new();

impl Repositories {
    /// シングルトンインスタンスを取得
    /// 
    /// アプリケーション全体で唯一のRepositoriesインスタンスを返します。
    /// 初回呼び出し時に初期化が行われ、以降は同一インスタンスが返されます。
    pub async fn instance() -> Arc<Self> {
        REPOSITORIES_INSTANCE
            .get_or_init(|| async {
                let repositories = Self::create_instance().await
                    .expect("Failed to initialize Repositories singleton");
                Arc::new(repositories)
            })
            .await
            .clone()
    }

    /// 新しい統合リポジトリインスタンスを作成（従来のメソッド - 非推奨）
    /// 
    /// # Deprecated
    /// 
    /// このメソッドは非推奨です。代わりに `Repositories::instance()` を使用してください。
    /// シングルトンパターンによりリソース効率が大幅に改善されます。
    #[deprecated(since = "0.1.0", note = "Use Repositories::instance() instead for better resource management")]
    #[tracing::instrument(level = "trace")]
    pub async fn new() -> Result<Self, RepositoryError> {
        Self::create_instance().await
    }

    /// 内部的なRepositoriesインスタンス作成メソッド
    #[tracing::instrument(level = "trace")]
    async fn create_instance() -> Result<Self, RepositoryError> {
        // 保存用SQLiteリポジトリ群を作成
        let save_sqlite_repos = crate::infrastructure::local_sqlite::local_sqlite_repositories::LocalSqliteRepositories::new().await?;

        // 検索用SQLiteリポジトリ群を作成
        let search_sqlite_repos = crate::infrastructure::local_sqlite::local_sqlite_repositories::LocalSqliteRepositories::new().await?;

        // Automergeリポジトリ群を作成
        let automerge_repos = crate::infrastructure::local_automerge::local_automerge_repositories::LocalAutomergeRepositories::new().await?;

        // 各UnifiedRepositoryを作成し、SQLiteとAutomergeリポジトリを追加
        let mut projects = ProjectUnifiedRepository::new(vec![], vec![]);
        projects.add_sqlite_for_save(save_sqlite_repos.projects);
        projects.add_sqlite_for_search(search_sqlite_repos.projects);
        projects.add_automerge_for_save(automerge_repos.projects);

        let mut task_lists = TaskListUnifiedRepository::new(vec![], vec![]);
        task_lists.add_sqlite_for_save(save_sqlite_repos.task_lists);
        task_lists.add_sqlite_for_search(search_sqlite_repos.task_lists);
        task_lists.add_automerge_for_save(automerge_repos.task_lists);

        let mut tasks = TaskUnifiedRepository::new(vec![], vec![]);
        tasks.add_sqlite_for_save(save_sqlite_repos.tasks);
        tasks.add_sqlite_for_search(search_sqlite_repos.tasks);
        tasks.add_automerge_for_save(automerge_repos.tasks);

        let mut sub_tasks = SubTaskUnifiedRepository::new(vec![], vec![]);
        sub_tasks.add_sqlite_for_save(save_sqlite_repos.sub_tasks);
        sub_tasks.add_sqlite_for_search(search_sqlite_repos.sub_tasks);
        sub_tasks.add_automerge_for_save(automerge_repos.sub_tasks);

        let mut tags = TagUnifiedRepository::new(vec![], vec![]);
        tags.add_sqlite_for_save(save_sqlite_repos.tags);
        tags.add_sqlite_for_search(search_sqlite_repos.tags);
        tags.add_automerge_for_save(automerge_repos.tags);

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

    /// テスト用のリセット機能（テスト環境でのみ使用）
    #[cfg(test)]
    pub fn reset_for_test() {
        // OnceLockはリセットできないため、この機能は将来のテスト改善で検討
        tracing::warn!("Repositories singleton reset requested, but not supported in current implementation");
    }
}
