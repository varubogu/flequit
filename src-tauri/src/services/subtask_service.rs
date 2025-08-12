use crate::types::sub_task_types::Subtask;
use crate::repositories::core::CoreRepositoryTrait;
use crate::errors::service_error::ServiceError;

pub struct SubtaskService;

impl SubtaskService {
    pub async fn create_subtask(
        &self,
        repositories: &mut [Box<dyn CoreRepositoryTrait>],
        project_id: &str,
        subtask: &Subtask,
    ) -> Result<(), ServiceError> {
        for repo in repositories {
            repo.set_subtask(project_id, &subtask.task_id, subtask).await?;
        }
        Ok(())
    }

    pub async fn get_subtask(
        &self,
        repository: &dyn CoreRepositoryTrait,
        project_id: &str,
        task_id: &str,
        subtask_id: &str,
    ) -> Result<Option<Subtask>, ServiceError> {
        Ok(repository.get_subtask(project_id, task_id, subtask_id).await?)
    }

    pub async fn list_subtasks(
        &self,
        repository: &dyn CoreRepositoryTrait,
        project_id: &str,
        task_id: &str,
    ) -> Result<Vec<Subtask>, ServiceError> {
        Ok(repository.list_subtasks(project_id, task_id).await?)
    }

    pub async fn update_subtask(
        &self,
        repositories: &mut [Box<dyn CoreRepositoryTrait>],
        project_id: &str,
        subtask: &Subtask,
    ) -> Result<(), ServiceError> {
        for repo in repositories {
            repo.set_subtask(project_id, &subtask.task_id, subtask).await?;
        }
        Ok(())
    }

    pub async fn delete_subtask(
        &self,
        repositories: &mut [Box<dyn CoreRepositoryTrait>],
        project_id: &str,
        task_id: &str,
        subtask_id: &str,
    ) -> Result<(), ServiceError> {
        for repo in repositories {
            repo.delete_subtask(project_id, task_id, subtask_id).await?;
        }
        Ok(())
    }

    pub async fn toggle_completion(
        &self,
        repositories: &mut [Box<dyn CoreRepositoryTrait>],
        project_id: &str,
        task_id: &str,
        subtask_id: &str,
    ) -> Result<(), ServiceError> {
        for repo in repositories {
            repo.toggle_completion(project_id, task_id, subtask_id).await?;
        }
        Ok(())
    }
}