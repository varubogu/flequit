use async_trait::async_trait;
use std::sync::Arc;
use crate::infrastructure::automerge_service::AutomergeRepoService;
use crate::types::Task;
use crate::errors::RepositoryError;

#[async_trait]
pub trait TaskRepositoryTrait {
    async fn create(&self, task: &Task) -> Result<(), RepositoryError>;
    async fn get(&self, project_id: &str, task_id: &str) -> Result<Option<Task>, RepositoryError>;
    async fn list(&self, project_id: &str) -> Result<Vec<Task>, RepositoryError>;
    async fn update(&self, task: &Task) -> Result<(), RepositoryError>;
    async fn delete(&self, project_id: &str, task_id: &str) -> Result<(), RepositoryError>;
}

pub struct TaskRepository {
    automerge_service: Arc<AutomergeRepoService>,
}

impl TaskRepository {
    pub fn new(automerge_service: Arc<AutomergeRepoService>) -> Self {
        Self { automerge_service }
    }
}

#[async_trait]
impl TaskRepositoryTrait for TaskRepository {
    async fn create(&self, task: &Task) -> Result<(), RepositoryError> {
        self.automerge_service.set_task(&task.project_id, task).await
            .map_err(|e| RepositoryError::AutomergeError(e))
    }
    
    async fn get(&self, project_id: &str, task_id: &str) -> Result<Option<Task>, RepositoryError> {
        self.automerge_service.get_task(project_id, task_id).await
            .map_err(|e| RepositoryError::AutomergeError(e))
    }
    
    async fn list(&self, project_id: &str) -> Result<Vec<Task>, RepositoryError> {
        self.automerge_service.list_tasks(project_id).await
            .map_err(|e| RepositoryError::AutomergeError(e))
    }
    
    async fn update(&self, task: &Task) -> Result<(), RepositoryError> {
        self.automerge_service.set_task(&task.project_id, task).await
            .map_err(|e| RepositoryError::AutomergeError(e))
    }
    
    async fn delete(&self, project_id: &str, task_id: &str) -> Result<(), RepositoryError> {
        self.automerge_service.delete_task(project_id, task_id).await
            .map_err(|e| RepositoryError::AutomergeError(e))
    }
}