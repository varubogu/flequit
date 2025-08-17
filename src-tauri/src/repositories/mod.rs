pub mod local_automerge;
pub mod local_sqlite;

pub mod account_repository_trait;
pub mod base_repository_trait;
pub mod project_repository_trait;
pub mod setting_repository_trait;
pub mod settings_repository_trait;
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
        Ok(Self {
            projects: ProjectUnifiedRepository::new(vec![], vec![]),
            task_lists: TaskListUnifiedRepository::new(vec![], vec![]),
            tasks: TaskUnifiedRepository::new(vec![], vec![]),
            sub_tasks: SubTaskUnifiedRepository::new(vec![], vec![]),
            tags: TagUnifiedRepository::new(vec![], vec![]),
            accounts: AccountUnifiedRepository::new(vec![], vec![]),
            users: UserUnifiedRepository::new(vec![], vec![]),
            settings: SettingsUnifiedRepository::new(vec![], crate::repositories::unified::settings::SettingsRepositoryVariant::Sqlite(
                crate::repositories::local_sqlite::settings::SettingsLocalSqliteRepository::new(
                    crate::repositories::local_sqlite::database_manager::DatabaseManager::instance().await.unwrap()
                )
            )),
        })
    }
}
