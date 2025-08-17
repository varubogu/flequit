//! タスクリスト用統合リポジトリ
//!
//! SQLite（高速検索）とAutomerge（永続化・同期）を統合し、
//! タスクリストエンティティに最適化されたアクセスパターンを提供する。

use async_trait::async_trait;
use log::info;

use crate::{
    errors::RepositoryError,
    models::task_list::TaskList,
    repositories::{
        base_repository_trait::Repository, task_list_repository_trait::TaskListRepositoryTrait,
    },
    types::id_types::TaskListId,
};


/// タスクリスト用統合リポジトリ
///
/// 検索系操作はSQLite、保存系操作はAutomerge→SQLiteの順で実行し、
/// タスクリストエンティティに最適化されたアクセスパターンを提供する。
pub struct TaskListUnifiedRepository {}

impl Default for TaskListUnifiedRepository {
    fn default() -> Self {
        Self::new()
    }
}

impl TaskListUnifiedRepository {
    pub fn new() -> Self {
        Self {}
    }
}

#[async_trait]
impl Repository<TaskList, TaskListId> for TaskListUnifiedRepository {
    async fn save(&self, entity: &TaskList) -> Result<(), RepositoryError> {
        info!("TaskListUnifiedRepository::save");
        info!("{:?}", entity);

        Ok(())
    }

    async fn find_by_id(&self, id: &TaskListId) -> Result<Option<TaskList>, RepositoryError> {
        info!("TaskListUnifiedRepository::find_by_id");
        info!("{:?}", id);
        Ok(None)
    }

    async fn find_all(&self) -> Result<Vec<TaskList>, RepositoryError> {
        info!("TaskListUnifiedRepository::find_all");
        Ok(vec![])
    }

    async fn delete(&self, id: &TaskListId) -> Result<(), RepositoryError> {
        info!("TaskListUnifiedRepository::delete");
        info!("{:?}", id);
        Ok(())
    }

    async fn exists(&self, id: &TaskListId) -> Result<bool, RepositoryError> {
        info!("TaskListUnifiedRepository::exists");
        info!("{:?}", id);
        Ok(true)
    }

    async fn count(&self) -> Result<u64, RepositoryError> {
        info!("TaskListUnifiedRepository::count");
        Ok(0)
    }
}

impl TaskListRepositoryTrait for TaskListUnifiedRepository {}
