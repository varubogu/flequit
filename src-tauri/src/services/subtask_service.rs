use crate::models::subtask::Subtask;
use crate::errors::service_error::ServiceError;
use crate::repositories::local_automerge::projects_repository::ProjectsRepository;

#[allow(dead_code)]
pub struct SubtaskService;

#[allow(dead_code)]
impl SubtaskService {
    pub async fn create_subtask(
        &self,
        project_id: &str,
        subtask: &Subtask,
    ) -> Result<(), ServiceError> {
        if project_id.trim().is_empty() || subtask.title.trim().is_empty() {
            return Err(ServiceError::ValidationError("Project ID and Subtask title cannot be empty".to_string()));
        }
        let repository = ProjectsRepository::with_default_path()?;
        repository.set_subtask(project_id, subtask).await?;
        Ok(())
    }

    pub async fn get_subtask(
        &self,
        project_id: &str,
        task_id: &str,
        subtask_id: &str,
    ) -> Result<Option<Subtask>, ServiceError> {
        if project_id.trim().is_empty() || task_id.trim().is_empty() || subtask_id.trim().is_empty() {
            return Err(ServiceError::ValidationError("Project ID, Task ID, and Subtask ID cannot be empty".to_string()));
        }
        let repository = ProjectsRepository::with_default_path()?;
        // ProjectsRepositoryのget_subtaskはproject_idとsubtask_idのみ必要（task_idは使用されない）
        Ok(repository.get_subtask(project_id, subtask_id).await?)
    }

    pub async fn list_subtasks(
        &self,
        project_id: &str,
        task_id: &str,
    ) -> Result<Vec<Subtask>, ServiceError> {
        // 一時的に空のVecを返す
        let _ = (project_id, task_id);
        Ok(Vec::new())
    }

    pub async fn update_subtask(
        &self,
        project_id: &str,
        subtask: &Subtask,
    ) -> Result<(), ServiceError> {
        if project_id.trim().is_empty() || subtask.title.trim().is_empty() {
            return Err(ServiceError::ValidationError("Project ID and Subtask title cannot be empty".to_string()));
        }
        let repository = ProjectsRepository::with_default_path()?;
        repository.set_subtask(project_id, subtask).await?;
        Ok(())
    }

    pub async fn delete_subtask(
        &self,
        project_id: &str,
        task_id: &str,
        subtask_id: &str,
    ) -> Result<(), ServiceError> {
        // 一時的に何もしない
        let _ = (project_id, task_id, subtask_id);
        Ok(())
    }

    pub async fn toggle_completion(
        &self,
        project_id: &str,
        task_id: &str,
        subtask_id: &str,
    ) -> Result<(), ServiceError> {
        // 一時的に何もしない
        let _ = (project_id, task_id, subtask_id);
        Ok(())
    }
}
