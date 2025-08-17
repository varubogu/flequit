//! サブタスク用統合リポジトリ
//!
//! SQLite（高速検索）とAutomerge（永続化・同期）を統合し、
//! サブタスクエンティティに最適化されたアクセスパターンを提供する。

use async_trait::async_trait;
use log::info;

use crate::{
    errors::RepositoryError,
    models::subtask::SubTask,
    repositories::{
        base_repository_trait::Repository, sub_task_repository_trait::SubTaskRepositoryTrait,
    },
    types::id_types::SubTaskId,
};

/// サブタスク用統合リポジトリ
///
/// 検索系操作はSQLite、保存系操作はAutomerge→SQLiteの順で実行し、
/// サブタスクエンティティに最適化されたアクセスパターンを提供する。
pub struct SubTaskUnifiedRepository {}

impl Default for SubTaskUnifiedRepository {
    fn default() -> Self {
        Self::new()
    }
}

impl SubTaskUnifiedRepository {
    pub fn new() -> Self {
        Self {}
    }
}

#[async_trait]
impl Repository<SubTask, SubTaskId> for SubTaskUnifiedRepository {
    async fn save(&self, entity: &SubTask) -> Result<(), RepositoryError> {
        info!("SubTaskUnifiedRepository::save");
        info!("{:?}", entity);

        Ok(())
    }

    async fn find_by_id(&self, id: &SubTaskId) -> Result<Option<SubTask>, RepositoryError> {
        info!("SubTaskUnifiedRepository::find_by_id");
        info!("{:?}", id);
        Ok(None)
    }

    async fn find_all(&self) -> Result<Vec<SubTask>, RepositoryError> {
        info!("SubTaskUnifiedRepository::find_all");
        Ok(vec![])
    }

    async fn delete(&self, id: &SubTaskId) -> Result<(), RepositoryError> {
        info!("SubTaskUnifiedRepository::delete");
        info!("{:?}", id);
        Ok(())
    }

    async fn exists(&self, id: &SubTaskId) -> Result<bool, RepositoryError> {
        info!("SubTaskUnifiedRepository::exists");
        info!("{:?}", id);
        Ok(true)
    }

    async fn count(&self) -> Result<u64, RepositoryError> {
        info!("ProjectUnifiedRepository::count");
        Ok(0)
    }
}

impl SubTaskRepositoryTrait for SubTaskUnifiedRepository {}
