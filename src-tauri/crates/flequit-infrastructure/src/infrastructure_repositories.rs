//! Infrastructure統合リポジトリ管理
//!
//! Service層からアクセスするためのリポジトリ統合管理クラス

use crate::unified::*;
use async_trait::async_trait;
use flequit_infrastructure_sqlite::infrastructure::local_sqlite_repositories::LocalSqliteRepositories;
use flequit_infrastructure_sqlite::infrastructure::user_preferences::tag_bookmark::TagBookmarkLocalSqliteRepository;
use flequit_infrastructure_automerge::infrastructure::user_preferences::tag_bookmark::TagBookmarkLocalAutomergeRepository;
use flequit_model::traits::TransactionManager;
use flequit_types::errors::repository_error::RepositoryError;
use sea_orm::DatabaseTransaction;
use std::sync::Arc;
use tokio::sync::RwLock;

/// Infrastructure層統合リポジトリのトレイト定義
///
/// Service層からアクセスするためのリポジトリインターフェース。
/// テストでのモック化やDIパターンに対応するため、トレイト化している。
#[async_trait]
pub trait InfrastructureRepositoriesTrait: Send + Sync + std::fmt::Debug {
    /// アカウントリポジトリへのアクセス
    fn accounts(&self) -> &AccountUnifiedRepository;

    /// プロジェクトリポジトリへのアクセス
    fn projects(&self) -> &ProjectUnifiedRepository;

    /// タグリポジトリへのアクセス
    fn tags(&self) -> &TagUnifiedRepository;

    /// タスクリポジトリへのアクセス
    fn tasks(&self) -> &TaskUnifiedRepository;

    /// タスクリストリポジトリへのアクセス
    fn task_lists(&self) -> &TaskListUnifiedRepository;

    /// サブタスクリポジトリへのアクセス
    fn sub_tasks(&self) -> &SubTaskUnifiedRepository;

    /// ユーザーリポジトリへのアクセス
    fn users(&self) -> &UserUnifiedRepository;

    /// 繰り返しルールリポジトリへのアクセス
    fn recurrence_rules(&self) -> &RecurrenceRuleUnifiedRepository;

    /// タスクアサインリポジトリへのアクセス
    fn task_assignments(&self) -> &TaskAssignmentUnifiedRepository;

    /// サブタスクアサインリポジトリへのアクセス
    fn subtask_assignments(&self) -> &SubTaskAssignmentUnifiedRepository;

    /// タスクタグリポジトリへのアクセス
    fn task_tags(&self) -> &TaskTagUnifiedRepository;

    /// サブタスクタグリポジトリへのアクセス
    fn subtask_tags(&self) -> &SubTaskTagUnifiedRepository;

    /// タスク繰り返しルール関連付けリポジトリへのアクセス
    fn task_recurrences(&self) -> &TaskRecurrenceUnifiedRepository;

    /// サブタスク繰り返しルール関連付けリポジトリへのアクセス
    fn subtask_recurrences(&self) -> &SubTaskRecurrenceUnifiedRepository;

    /// TagBookmark SQLiteリポジトリへのアクセス
    fn tag_bookmarks_sqlite(&self) -> &flequit_infrastructure_sqlite::infrastructure::user_preferences::tag_bookmark::TagBookmarkLocalSqliteRepository;

    /// TagBookmark Automergeリポジトリへのアクセス
    fn tag_bookmarks_automerge(&self) -> &flequit_infrastructure_automerge::infrastructure::user_preferences::tag_bookmark::TagBookmarkLocalAutomergeRepository;

    /// SQLiteリポジトリ群へのアクセス
    ///
    /// トランザクション制御のために直接SQLiteリポジトリにアクセスする必要がある場合に使用します。
    fn sqlite_repositories(&self) -> Option<&Arc<RwLock<LocalSqliteRepositories>>>;

    /// リポジトリの初期化処理
    async fn initialize(&mut self) -> Result<(), Box<dyn std::error::Error>>;

    /// リソースのクリーンアップ処理
    async fn cleanup(&mut self) -> Result<(), Box<dyn std::error::Error>>;
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
    unified_manager: UnifiedManager,
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
                use std::sync::Arc;
                use tokio::sync::RwLock;

                // 非同期コンテキストがないため、とりあえずダミーマネージャーを作成
                // これは主にテスト用で、本番ではsetup_with_sqlite_and_automerge()を使用
                let dummy_db = Arc::new(RwLock::new(unsafe {
                    std::mem::zeroed::<DatabaseManager>()
                }));
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
    fn accounts(&self) -> &AccountUnifiedRepository {
        &self.accounts
    }

    fn projects(&self) -> &ProjectUnifiedRepository {
        &self.projects
    }

    fn tags(&self) -> &TagUnifiedRepository {
        &self.tags
    }

    fn tasks(&self) -> &TaskUnifiedRepository {
        &self.tasks
    }

    fn task_lists(&self) -> &TaskListUnifiedRepository {
        &self.task_lists
    }

    fn sub_tasks(&self) -> &SubTaskUnifiedRepository {
        &self.sub_tasks
    }

    fn users(&self) -> &UserUnifiedRepository {
        &self.users
    }

    fn recurrence_rules(&self) -> &RecurrenceRuleUnifiedRepository {
        &self.recurrence_rules
    }

    fn task_assignments(&self) -> &TaskAssignmentUnifiedRepository {
        &self.task_assignments
    }

    fn subtask_assignments(&self) -> &SubTaskAssignmentUnifiedRepository {
        &self.subtask_assignments
    }

    fn task_tags(&self) -> &TaskTagUnifiedRepository {
        &self.task_tags
    }

    fn subtask_tags(&self) -> &SubTaskTagUnifiedRepository {
        &self.subtask_tags
    }

    fn task_recurrences(&self) -> &TaskRecurrenceUnifiedRepository {
        &self.task_recurrences
    }

    fn subtask_recurrences(&self) -> &SubTaskRecurrenceUnifiedRepository {
        &self.subtask_recurrences
    }

    fn tag_bookmarks_sqlite(&self) -> &flequit_infrastructure_sqlite::infrastructure::user_preferences::tag_bookmark::TagBookmarkLocalSqliteRepository {
        &self.tag_bookmarks_sqlite
    }

    fn tag_bookmarks_automerge(&self) -> &flequit_infrastructure_automerge::infrastructure::user_preferences::tag_bookmark::TagBookmarkLocalAutomergeRepository {
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

    fn sqlite_repositories(&self) -> Option<&Arc<RwLock<LocalSqliteRepositories>>> {
        self.unified_manager.sqlite_repositories()
    }
}

/// TransactionManagerトレイトの実装
///
/// InfrastructureRepositoriesがトランザクション管理機能を提供します。
/// 内部的にはSQLiteのDatabaseManagerのTransactionManager実装を使用します。
#[async_trait]
impl TransactionManager for InfrastructureRepositories {
    type Transaction = DatabaseTransaction;

    async fn begin(&self) -> Result<Self::Transaction, RepositoryError> {
        // unified_manager経由でSQLite Database Managerにアクセスしてトランザクションを開始
        if let Some(sqlite_repos) = self.unified_manager.sqlite_repositories() {
            let sqlite_repos_guard = sqlite_repos.read().await;
            let db_manager = sqlite_repos_guard.database_manager();
            let db_manager_guard = db_manager.read().await;
            db_manager_guard.begin().await
        } else {
            Err(RepositoryError::DatabaseError(
                "SQLite repositories not initialized".to_string(),
            ))
        }
    }

    async fn commit(&self, txn: Self::Transaction) -> Result<(), RepositoryError> {
        // unified_manager経由でSQLite Database Managerにアクセスしてコミット
        if let Some(sqlite_repos) = self.unified_manager.sqlite_repositories() {
            let sqlite_repos_guard = sqlite_repos.read().await;
            let db_manager = sqlite_repos_guard.database_manager();
            let db_manager_guard = db_manager.read().await;
            db_manager_guard.commit(txn).await
        } else {
            Err(RepositoryError::DatabaseError(
                "SQLite repositories not initialized".to_string(),
            ))
        }
    }

    async fn rollback(&self, txn: Self::Transaction) -> Result<(), RepositoryError> {
        // unified_manager経由でSQLite Database Managerにアクセスしてロールバック
        if let Some(sqlite_repos) = self.unified_manager.sqlite_repositories() {
            let sqlite_repos_guard = sqlite_repos.read().await;
            let db_manager = sqlite_repos_guard.database_manager();
            let db_manager_guard = db_manager.read().await;
            db_manager_guard.rollback(txn).await
        } else {
            Err(RepositoryError::DatabaseError(
                "SQLite repositories not initialized".to_string(),
            ))
        }
    }
}

/// テスト用のモック実装
///
/// テストで使用するためのモック実装。各リポジトリのメソッド呼び出しを記録し、
/// 期待値を返すためのモックフレームワークと連携可能。
#[cfg(test)]
pub mod mock {
    use super::*;
    use std::sync::{Arc, Mutex};

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
                tag_bookmarks_sqlite: flequit_infrastructure_sqlite::infrastructure::user_preferences::tag_bookmark::TagBookmarkLocalSqliteRepository::default(),
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
        fn sqlite_repositories(&self) -> Option<&Arc<RwLock<LocalSqliteRepositories>>> {
            None
        }

        fn accounts(&self) -> &AccountUnifiedRepository {
            self.log_call("accounts");
            &self.accounts
        }

        fn projects(&self) -> &ProjectUnifiedRepository {
            self.log_call("projects");
            &self.projects
        }

        fn tags(&self) -> &TagUnifiedRepository {
            self.log_call("tags");
            &self.tags
        }

        fn tasks(&self) -> &TaskUnifiedRepository {
            self.log_call("tasks");
            &self.tasks
        }

        fn task_lists(&self) -> &TaskListUnifiedRepository {
            self.log_call("task_lists");
            &self.task_lists
        }

        fn sub_tasks(&self) -> &SubTaskUnifiedRepository {
            self.log_call("sub_tasks");
            &self.sub_tasks
        }

        fn users(&self) -> &UserUnifiedRepository {
            self.log_call("users");
            &self.users
        }

        fn recurrence_rules(&self) -> &RecurrenceRuleUnifiedRepository {
            self.log_call("recurrence_rules");
            &self.recurrence_rules
        }

        fn task_assignments(&self) -> &TaskAssignmentUnifiedRepository {
            self.log_call("task_assignments");
            &self.task_assignments
        }

        fn subtask_assignments(&self) -> &SubTaskAssignmentUnifiedRepository {
            self.log_call("subtask_assignments");
            &self.subtask_assignments
        }

        fn task_tags(&self) -> &TaskTagUnifiedRepository {
            self.log_call("task_tags");
            &self.task_tags
        }

        fn subtask_tags(&self) -> &SubTaskTagUnifiedRepository {
            self.log_call("subtask_tags");
            &self.subtask_tags
        }

        fn task_recurrences(&self) -> &TaskRecurrenceUnifiedRepository {
            self.log_call("task_recurrences");
            &self.task_recurrences
        }

        fn subtask_recurrences(&self) -> &SubTaskRecurrenceUnifiedRepository {
            self.log_call("subtask_recurrences");
            &self.subtask_recurrences
        }

        fn tag_bookmarks_sqlite(&self) -> &flequit_infrastructure_sqlite::infrastructure::user_preferences::tag_bookmark::TagBookmarkLocalSqliteRepository {
            self.log_call("tag_bookmarks_sqlite");
            &self.tag_bookmarks_sqlite
        }

        fn tag_bookmarks_automerge(&self) -> &flequit_infrastructure_automerge::infrastructure::user_preferences::tag_bookmark::TagBookmarkLocalAutomergeRepository {
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
}

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
        // トレイトオブジェクトとして使用可能かテスト
        let repos = InfrastructureRepositories::new();
        let _trait_obj: &dyn InfrastructureRepositoriesTrait = &repos;

        let mock_repos = MockInfrastructureRepositories::new();
        let _mock_trait_obj: &dyn InfrastructureRepositoriesTrait = &mock_repos;

        // どちらも同じトレイトとして扱えることを確認
        // これにより依存性の注入やテストでの置き換えが可能になる
    }
}
