use super::CoreRepositoryTrait;
use crate::repositories::base_repository_trait::Repository;
use crate::models::{project::Project, task::Task, subtask::SubTask, tag::Tag, user::User};
use crate::errors::repository_error::RepositoryError;
use async_trait::async_trait;

pub mod project_repository;
pub mod task_repository;
pub mod subtask_repository;
pub mod tag_repository;
pub mod user_repository;

pub struct WebRepository {}

impl CoreRepositoryTrait for WebRepository {
}

// Repository<T> 実装群
// WebRepositoryが複数エンティティのRepository<T>を実装
// Webサーバーストレージでの統一インターフェース提供

#[async_trait]
impl Repository<Project> for WebRepository {
    async fn save(&self, _entity: &Project) -> Result<(), RepositoryError> {
        // TODO: Web実装
        Err(RepositoryError::NotFound("Web storage not implemented yet".to_string()))
    }

    async fn find_by_id(&self, _id: &str) -> Result<Option<Project>, RepositoryError> {
        // TODO: Web実装
        Ok(None)
    }

    async fn find_all(&self) -> Result<Vec<Project>, RepositoryError> {
        // TODO: Web実装
        Ok(Vec::new())
    }

    async fn delete(&self, _id: &str) -> Result<(), RepositoryError> {
        // TODO: Web実装
        Err(RepositoryError::NotFound("Web storage not implemented yet".to_string()))
    }

    async fn exists(&self, _id: &str) -> Result<bool, RepositoryError> {
        // TODO: Web実装
        Ok(false)
    }

    async fn count(&self) -> Result<u64, RepositoryError> {
        // TODO: Web実装
        Ok(0)
    }
}

#[async_trait]
impl Repository<Task> for WebRepository {
    async fn save(&self, _entity: &Task) -> Result<(), RepositoryError> {
        // TODO: Web実装
        Err(RepositoryError::NotFound("Web storage not implemented yet".to_string()))
    }

    async fn find_by_id(&self, _id: &str) -> Result<Option<Task>, RepositoryError> {
        Ok(None)
    }

    async fn find_all(&self) -> Result<Vec<Task>, RepositoryError> {
        Ok(Vec::new())
    }

    async fn delete(&self, _id: &str) -> Result<(), RepositoryError> {
        Err(RepositoryError::NotFound("Web storage not implemented yet".to_string()))
    }

    async fn exists(&self, _id: &str) -> Result<bool, RepositoryError> {
        Ok(false)
    }

    async fn count(&self) -> Result<u64, RepositoryError> {
        Ok(0)
    }
}

#[async_trait]
impl Repository<SubTask> for WebRepository {
    async fn save(&self, _entity: &SubTask) -> Result<(), RepositoryError> {
        Err(RepositoryError::NotFound("Web storage not implemented yet".to_string()))
    }

    async fn find_by_id(&self, _id: &str) -> Result<Option<SubTask>, RepositoryError> {
        Ok(None)
    }

    async fn find_all(&self) -> Result<Vec<SubTask>, RepositoryError> {
        Ok(Vec::new())
    }

    async fn delete(&self, _id: &str) -> Result<(), RepositoryError> {
        Err(RepositoryError::NotFound("Web storage not implemented yet".to_string()))
    }

    async fn exists(&self, _id: &str) -> Result<bool, RepositoryError> {
        Ok(false)
    }

    async fn count(&self) -> Result<u64, RepositoryError> {
        Ok(0)
    }
}

#[async_trait]
impl Repository<Tag> for WebRepository {
    async fn save(&self, _entity: &Tag) -> Result<(), RepositoryError> {
        Err(RepositoryError::NotFound("Web storage not implemented yet".to_string()))
    }

    async fn find_by_id(&self, _id: &str) -> Result<Option<Tag>, RepositoryError> {
        Ok(None)
    }

    async fn find_all(&self) -> Result<Vec<Tag>, RepositoryError> {
        Ok(Vec::new())
    }

    async fn delete(&self, _id: &str) -> Result<(), RepositoryError> {
        Err(RepositoryError::NotFound("Web storage not implemented yet".to_string()))
    }

    async fn exists(&self, _id: &str) -> Result<bool, RepositoryError> {
        Ok(false)
    }

    async fn count(&self) -> Result<u64, RepositoryError> {
        Ok(0)
    }
}

#[async_trait]
impl Repository<User> for WebRepository {
    async fn save(&self, _entity: &User) -> Result<(), RepositoryError> {
        Err(RepositoryError::NotFound("Web storage not implemented yet".to_string()))
    }

    async fn find_by_id(&self, _id: &str) -> Result<Option<User>, RepositoryError> {
        Ok(None)
    }

    async fn find_all(&self) -> Result<Vec<User>, RepositoryError> {
        Ok(Vec::new())
    }

    async fn delete(&self, _id: &str) -> Result<(), RepositoryError> {
        Err(RepositoryError::NotFound("Web storage not implemented yet".to_string()))
    }

    async fn exists(&self, _id: &str) -> Result<bool, RepositoryError> {
        Ok(false)
    }

    async fn count(&self) -> Result<u64, RepositoryError> {
        Ok(0)
    }
}
