use crate::repositories::base_repository_trait::Repository;
use flequit_model::models::{project::Project, task::Task, subtask::SubTask, tag::Tag, user::User};
use flequit_model::types::id_types::{ProjectId, TaskId, SubTaskId, TagId, UserId};
use crate::errors::repository_error::RepositoryError;
use async_trait::async_trait;

// Web repository implementation modules would be added here when implemented

pub struct WebRepository {}

// Repository<T> 実装群
// WebRepositoryが複数エンティティのRepository<T>を実装
// Webサーバーストレージでの統一インターフェース提供

#[async_trait]
impl Repository<Project, ProjectId> for WebRepository {
    async fn save(&self, _entity: &Project) -> Result<(), RepositoryError> {
        // TODO: Web実装
        Err(RepositoryError::NotFound("Web storage not implemented yet".to_string()))
    }

    async fn find_by_id(&self, _id: &ProjectId) -> Result<Option<Project>, RepositoryError> {
        // TODO: Web実装
        Ok(None)
    }

    async fn find_all(&self) -> Result<Vec<Project>, RepositoryError> {
        // TODO: Web実装
        Ok(Vec::new())
    }

    async fn delete(&self, _id: &ProjectId) -> Result<(), RepositoryError> {
        // TODO: Web実装
        Err(RepositoryError::NotFound("Web storage not implemented yet".to_string()))
    }

    async fn exists(&self, _id: &ProjectId) -> Result<bool, RepositoryError> {
        // TODO: Web実装
        Ok(false)
    }

    async fn count(&self) -> Result<u64, RepositoryError> {
        // TODO: Web実装
        Ok(0)
    }
}

#[async_trait]
impl Repository<Task, TaskId> for WebRepository {
    async fn save(&self, _entity: &Task) -> Result<(), RepositoryError> {
        // TODO: Web実装
        Err(RepositoryError::NotFound("Web storage not implemented yet".to_string()))
    }

    async fn find_by_id(&self, _id: &TaskId) -> Result<Option<Task>, RepositoryError> {
        Ok(None)
    }

    async fn find_all(&self) -> Result<Vec<Task>, RepositoryError> {
        Ok(Vec::new())
    }

    async fn delete(&self, _id: &TaskId) -> Result<(), RepositoryError> {
        Err(RepositoryError::NotFound("Web storage not implemented yet".to_string()))
    }

    async fn exists(&self, _id: &TaskId) -> Result<bool, RepositoryError> {
        Ok(false)
    }

    async fn count(&self) -> Result<u64, RepositoryError> {
        Ok(0)
    }
}

#[async_trait]
impl Repository<SubTask, SubTaskId> for WebRepository {
    async fn save(&self, _entity: &SubTask) -> Result<(), RepositoryError> {
        Err(RepositoryError::NotFound("Web storage not implemented yet".to_string()))
    }

    async fn find_by_id(&self, _id: &SubTaskId) -> Result<Option<SubTask>, RepositoryError> {
        Ok(None)
    }

    async fn find_all(&self) -> Result<Vec<SubTask>, RepositoryError> {
        Ok(Vec::new())
    }

    async fn delete(&self, _id: &SubTaskId) -> Result<(), RepositoryError> {
        Err(RepositoryError::NotFound("Web storage not implemented yet".to_string()))
    }

    async fn exists(&self, _id: &SubTaskId) -> Result<bool, RepositoryError> {
        Ok(false)
    }

    async fn count(&self) -> Result<u64, RepositoryError> {
        Ok(0)
    }
}

#[async_trait]
impl Repository<Tag, TagId> for WebRepository {
    async fn save(&self, _entity: &Tag) -> Result<(), RepositoryError> {
        Err(RepositoryError::NotFound("Web storage not implemented yet".to_string()))
    }

    async fn find_by_id(&self, _id: &TagId) -> Result<Option<Tag>, RepositoryError> {
        Ok(None)
    }

    async fn find_all(&self) -> Result<Vec<Tag>, RepositoryError> {
        Ok(Vec::new())
    }

    async fn delete(&self, _id: &TagId) -> Result<(), RepositoryError> {
        Err(RepositoryError::NotFound("Web storage not implemented yet".to_string()))
    }

    async fn exists(&self, _id: &TagId) -> Result<bool, RepositoryError> {
        Ok(false)
    }

    async fn count(&self) -> Result<u64, RepositoryError> {
        Ok(0)
    }
}

#[async_trait]
impl Repository<User, UserId> for WebRepository {
    async fn save(&self, _entity: &User) -> Result<(), RepositoryError> {
        Err(RepositoryError::NotFound("Web storage not implemented yet".to_string()))
    }

    async fn find_by_id(&self, _id: &UserId) -> Result<Option<User>, RepositoryError> {
        Ok(None)
    }

    async fn find_all(&self) -> Result<Vec<User>, RepositoryError> {
        Ok(Vec::new())
    }

    async fn delete(&self, _id: &UserId) -> Result<(), RepositoryError> {
        Err(RepositoryError::NotFound("Web storage not implemented yet".to_string()))
    }

    async fn exists(&self, _id: &UserId) -> Result<bool, RepositoryError> {
        Ok(false)
    }

    async fn count(&self) -> Result<u64, RepositoryError> {
        Ok(0)
    }
}