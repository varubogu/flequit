use async_trait::async_trait;
use std::sync::Arc;
use crate::infrastructure::automerge_service::AutomergeRepoService;
use crate::types::Subtask;
use crate::errors::RepositoryError;

#[async_trait]
pub trait SubtaskRepositoryTrait {
    async fn create(&self, project_id: &str, task_id: &str, subtask: &Subtask) -> Result<(), RepositoryError>;
    async fn get(&self, project_id: &str, task_id: &str, subtask_id: &str) -> Result<Option<Subtask>, RepositoryError>;
    async fn list(&self, project_id: &str, task_id: &str) -> Result<Vec<Subtask>, RepositoryError>;
    async fn update(&self, project_id: &str, task_id: &str, subtask: &Subtask) -> Result<(), RepositoryError>;
    async fn delete(&self, project_id: &str, task_id: &str, subtask_id: &str) -> Result<(), RepositoryError>;
}

pub struct SubtaskRepository {
    automerge_service: Arc<AutomergeRepoService>,
}

impl SubtaskRepository {
    pub fn new(automerge_service: Arc<AutomergeRepoService>) -> Self {
        Self { automerge_service }
    }
}

#[async_trait]
impl SubtaskRepositoryTrait for SubtaskRepository {
    async fn create(&self, project_id: &str, task_id: &str, subtask: &Subtask) -> Result<(), RepositoryError> {
        self.automerge_service.set_subtask(project_id, task_id, subtask).await
            .map_err(|e| RepositoryError::AutomergeError(e))
    }
    
    async fn get(&self, project_id: &str, task_id: &str, subtask_id: &str) -> Result<Option<Subtask>, RepositoryError> {
        self.automerge_service.get_subtask(project_id, task_id, subtask_id).await
            .map_err(|e| RepositoryError::AutomergeError(e))
    }
    
    async fn list(&self, project_id: &str, task_id: &str) -> Result<Vec<Subtask>, RepositoryError> {
        self.automerge_service.list_subtasks(project_id, task_id).await
            .map_err(|e| RepositoryError::AutomergeError(e))
    }
    
    async fn update(&self, project_id: &str, task_id: &str, subtask: &Subtask) -> Result<(), RepositoryError> {
        self.automerge_service.set_subtask(project_id, task_id, subtask).await
            .map_err(|e| RepositoryError::AutomergeError(e))
    }
    
    async fn delete(&self, project_id: &str, task_id: &str, subtask_id: &str) -> Result<(), RepositoryError> {
        self.automerge_service.delete_subtask(project_id, task_id, subtask_id).await
            .map_err(|e| RepositoryError::AutomergeError(e))
    }
}