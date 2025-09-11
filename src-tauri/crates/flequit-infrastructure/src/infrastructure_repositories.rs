//! Infrastructure統合リポジトリ管理
//!
//! Service層からアクセスするためのリポジトリ統合管理クラス

use async_trait::async_trait;
use crate::unified::*;

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

    /// タスクアサインリポジトリへのアクセス
    fn task_assignments(&self) -> &TaskAssignmentUnifiedRepository;

    /// サブタスクアサインリポジトリへのアクセス
    fn subtask_assignments(&self) -> &SubTaskAssignmentUnifiedRepository;

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
    pub task_assignments: TaskAssignmentUnifiedRepository,
    pub subtask_assignments: SubTaskAssignmentUnifiedRepository,

    // Unified層の設定・管理
    unified_manager: UnifiedManager,
}

impl InfrastructureRepositories {
    /// 新しいInfrastructureRepositoriesを作成
    ///
    /// 各UnifiedRepositoryのデフォルト実装を使用する
    #[tracing::instrument(level = "trace")]
    pub fn new() -> Self {
        Self {
            accounts: AccountUnifiedRepository::default(),
            projects: ProjectUnifiedRepository::default(),
            tags: TagUnifiedRepository::default(),
            tasks: TaskUnifiedRepository::default(),
            task_lists: TaskListUnifiedRepository::default(),
            sub_tasks: SubTaskUnifiedRepository::default(),
            users: UserUnifiedRepository::default(),
            task_assignments: TaskAssignmentUnifiedRepository::default(),
            subtask_assignments: SubTaskAssignmentUnifiedRepository::default(),
            unified_manager: UnifiedManager::default(),
        }
    }

    /// SQLiteとAutomergeのリポジトリを設定した完全なInfrastructureRepositoriesを作成
    ///
    /// 実際のアプリケーションで使用するためのセットアップされたリポジトリ群を返す
    #[tracing::instrument(level = "trace")]
    pub async fn setup_with_sqlite_and_automerge(config: UnifiedConfig) -> Result<Self, Box<dyn std::error::Error>> {
        let unified_manager = UnifiedManager::from_config(config).await?;

        let projects = unified_manager.create_project_unified_repository().await?;
        let accounts = unified_manager.create_account_unified_repository().await?;

        // 他のリポジトリも同様に作成する必要があるが、
        // 現在はmanagerで実装されていない部分はデフォルトを使用
        Ok(Self {
            accounts,
            projects,
            tags: TagUnifiedRepository::default(),
            tasks: TaskUnifiedRepository::default(),
            task_lists: TaskListUnifiedRepository::default(),
            sub_tasks: SubTaskUnifiedRepository::default(),
            users: UserUnifiedRepository::default(),
            task_assignments: TaskAssignmentUnifiedRepository::default(),
            subtask_assignments: SubTaskAssignmentUnifiedRepository::default(),
            unified_manager,
        })
    }

    /// シングルトンインスタンスを取得
    ///
    /// アプリケーション全体で共有されるInfrastructureRepositoriesインスタンスを返す
    #[tracing::instrument(level = "trace")]
    pub async fn instance() -> Self {
        // TODO: 実際のシングルトン実装
        Self::new()
    }

    /// 設定を更新し、バックエンドを再構築
    ///
    /// 実行時に設定が変更された場合に呼び出す
    #[tracing::instrument(level = "trace")]
    pub async fn update_config(&mut self, new_config: UnifiedConfig) -> Result<(), Box<dyn std::error::Error>> {
        self.unified_manager.update_config(new_config).await?;

        // リポジトリを再構築
        self.projects = self.unified_manager.create_project_unified_repository().await?;
        self.accounts = self.unified_manager.create_account_unified_repository().await?;

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

    fn task_assignments(&self) -> &TaskAssignmentUnifiedRepository {
        &self.task_assignments
    }

    fn subtask_assignments(&self) -> &SubTaskAssignmentUnifiedRepository {
        &self.subtask_assignments
    }

    #[tracing::instrument(level = "trace")]
    async fn initialize(&mut self) -> Result<(), Box<dyn std::error::Error>> {
        // 各リポジトリの初期化処理
        // TODO: 実際のSQLiteとAutomergeの接続・初期化処理を実装
        tracing::info!("Infrastructure repositories initialized");
        Ok(())
    }

    #[tracing::instrument(level = "trace")]
    async fn cleanup(&mut self) -> Result<(), Box<dyn std::error::Error>> {
        // 各リポジトリのクリーンアップ処理
        // TODO: 実際のSQLiteとAutomergeの接続クローズ処理を実装
        tracing::info!("Infrastructure repositories cleaned up");
        Ok(())
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

    #[derive(Debug, Default)]
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
        pub task_assignments: TaskAssignmentUnifiedRepository,
        pub subtask_assignments: SubTaskAssignmentUnifiedRepository,
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
                task_assignments: TaskAssignmentUnifiedRepository::default(),
                subtask_assignments: SubTaskAssignmentUnifiedRepository::default(),
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
            self.call_log.lock().map(|log| log.clone()).unwrap_or_default()
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

        fn task_assignments(&self) -> &TaskAssignmentUnifiedRepository {
            self.log_call("task_assignments");
            &self.task_assignments
        }

        fn subtask_assignments(&self) -> &SubTaskAssignmentUnifiedRepository {
            self.log_call("subtask_assignments");
            &self.subtask_assignments
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
    use super::*;
    use super::mock::MockInfrastructureRepositories;

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
