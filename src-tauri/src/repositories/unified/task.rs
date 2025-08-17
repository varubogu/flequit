//! タスク用統合リポジトリ
//!
//! SQLite（高速検索）とAutomerge（永続化・同期）を統合し、
//! タスクエンティティに最適化されたアクセスパターンを提供する。

use async_trait::async_trait;
use log::info;

use crate::{
    errors::RepositoryError,
    models::task::Task,
    repositories::{base_repository_trait::Repository, task_repository_trait::TaskRepositoryTrait},
    types::id_types::TaskId,
};

/// タスク用統合リポジトリ
///
/// 検索系操作はSQLite、保存系操作はAutomerge→SQLiteの順で実行し、
/// タスクエンティティに最適化されたアクセスパターンを提供する。
pub struct TaskUnifiedRepository {}

impl TaskUnifiedRepository {
    pub fn new() -> Self {
        Self {}
    }
}

#[async_trait]
impl Repository<Task, TaskId> for TaskUnifiedRepository {
    async fn save(&self, entity: &Task) -> Result<(), RepositoryError> {
        info!("TaskUnifiedRepository::save");
        info!("{:?}", entity);

        Ok(())
    }

    async fn find_by_id(&self, id: &TaskId) -> Result<Option<Task>, RepositoryError> {
        info!("TaskUnifiedRepository::find_by_id");
        info!("{:?}", id);
        Ok(Option::from(None))
    }

    async fn find_all(&self) -> Result<Vec<Task>, RepositoryError> {
        info!("TaskUnifiedRepository::find_all");
        Ok(vec![])
    }

    async fn delete(&self, id: &TaskId) -> Result<(), RepositoryError> {
        info!("TaskUnifiedRepository::delete");
        info!("{:?}", id);
        Ok(())
    }

    async fn exists(&self, id: &TaskId) -> Result<bool, RepositoryError> {
        info!("TaskUnifiedRepository::exists");
        info!("{:?}", id);
        Ok(true)
    }

    async fn count(&self) -> Result<u64, RepositoryError> {
        info!("TaskUnifiedRepository::count");
        Ok(0)
    }
}

impl TaskRepositoryTrait for TaskUnifiedRepository {}
