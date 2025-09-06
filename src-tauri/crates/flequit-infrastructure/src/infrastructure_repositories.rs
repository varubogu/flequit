//! Infrastructure統合リポジトリ管理
//!
//! Service層からアクセスするためのリポジトリ統合管理クラス

use crate::unified::*;

/// Infrastructure層統合リポジトリ管理
///
/// 各エンティティのUnifiedRepositoryを統合管理し、
/// Service層から一元的にアクセスできるインターフェースを提供する。
#[derive(Debug)]
pub struct InfrastructureRepositories {
    pub accounts: AccountUnifiedRepository,
    pub projects: ProjectUnifiedRepository,
    pub settings: SettingsUnifiedRepository,
    pub tags: TagUnifiedRepository,
    pub tasks: TaskUnifiedRepository,
    pub task_lists: TaskListUnifiedRepository,
    pub sub_tasks: SubTaskUnifiedRepository,
    pub users: UserUnifiedRepository,
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
            settings: SettingsUnifiedRepository::default(),
            tags: TagUnifiedRepository::default(),
            tasks: TaskUnifiedRepository::default(),
            task_lists: TaskListUnifiedRepository::default(),
            sub_tasks: SubTaskUnifiedRepository::default(),
            users: UserUnifiedRepository::default(),
        }
    }

    /// SQLiteとAutomergeのリポジトリを設定した完全なInfrastructureRepositoriesを作成
    ///
    /// 実際のアプリケーションで使用するためのセットアップされたリポジトリ群を返す
    #[tracing::instrument(level = "trace")]
    pub async fn setup_with_sqlite_and_automerge() -> Result<Self, Box<dyn std::error::Error>> {
        // TODO: 実際のSQLiteとAutomergeのリポジトリ設定を行う
        // 現在は最小限の実装でプレースホルダを返す
        Ok(Self::new())
    }

    /// シングルトンインスタンスを取得
    ///
    /// アプリケーション全体で共有されるInfrastructureRepositoriesインスタンスを返す
    #[tracing::instrument(level = "trace")]
    pub async fn instance() -> Self {
        // TODO: 実際のシングルトン実装
        Self::new()
    }
}

impl Default for InfrastructureRepositories {
    fn default() -> Self {
        Self::new()
    }
}