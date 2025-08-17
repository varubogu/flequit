pub mod local_automerge;
pub mod local_sqlite;

pub mod account_repository_trait;
pub mod base_repository_trait;
pub mod project_repository_trait;
pub mod setting_repository_trait;
pub mod repositry_manager;
pub mod sub_task_repository_trait;
pub mod tag_repository_trait;
pub mod task_list_repository_trait;
pub mod task_repository_trait;
pub mod unified;
pub mod user_repository_trait;

use crate::errors::RepositoryError;
use crate::repositories::{
    repositry_manager::RepositoryManager,
    unified::{
        AccountUnifiedRepository,
        ProjectUnifiedRepository,
        SettingsUnifiedRepository,
        TagUnifiedRepository,
        SubTaskUnifiedRepository,
        TaskListUnifiedRepository,
        TaskUnifiedRepository
    }
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
    pub settings: SettingsUnifiedRepository,

    // 内部ストレージリポジトリ（各エンティティから参照される）
    all_repositories: RepositoryManager,
}

impl Repositories {
    /// 新しい統合リポジトリインスタンスを作成
    pub async fn new() -> Result<Self, RepositoryError> {
        let all_repositories = RepositoryManager::new().await?;

        Ok(Self {
            projects: ProjectUnifiedRepository::new(),
            task_lists: TaskListUnifiedRepository::new(),
            tasks: TaskUnifiedRepository::new(),
            sub_tasks: SubTaskUnifiedRepository::new(),
            tags: TagUnifiedRepository::new(),
            accounts: AccountUnifiedRepository::new(),
            settings: SettingsUnifiedRepository::new(),
            all_repositories,
        })
    }
}
