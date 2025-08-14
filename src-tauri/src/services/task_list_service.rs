use crate::models::task_list::TaskList;
use crate::models::command::task_list::TaskListSearchRequest;
use crate::errors::service_error::ServiceError;
use crate::repositories::local_automerge::projects_repository::ProjectsRepository;

#[allow(dead_code)]
pub struct TaskListService;

#[allow(dead_code)]
impl TaskListService {
    pub async fn create_task_list(
        &self,
        project_id: &str,
        task_list: &TaskList,
    ) -> Result<(), ServiceError> {
        if project_id.trim().is_empty() || task_list.name.trim().is_empty() {
            return Err(ServiceError::ValidationError("Project ID and Task list name cannot be empty".to_string()));
        }
        let mut repository = ProjectsRepository::with_default_path()?;
        repository.save_task_list(project_id, task_list).await?;
        Ok(())
    }

    pub async fn get_task_list(
        &self,
        project_id: &str,
        list_id: &str,
    ) -> Result<Option<TaskList>, ServiceError> {
        if project_id.trim().is_empty() || list_id.trim().is_empty() {
            return Err(ServiceError::ValidationError("Project ID and List ID cannot be empty".to_string()));
        }
        let mut repository = ProjectsRepository::with_default_path()?;
        Ok(repository.get_task_list(project_id, list_id).await?)
    }

    pub async fn update_task_list(
        &self,
        project_id: &str,
        task_list: &TaskList,
    ) -> Result<(), ServiceError> {
        if project_id.trim().is_empty() || task_list.name.trim().is_empty() {
            return Err(ServiceError::ValidationError("Project ID and Task list name cannot be empty".to_string()));
        }
        let mut repository = ProjectsRepository::with_default_path()?;
        repository.save_task_list(project_id, task_list).await?;
        Ok(())
    }

    pub async fn delete_task_list(
        &self,
        id: &str,
    ) -> Result<(), ServiceError> {
        // 一時的に何もしない
        let _ = id;
        Ok(())
    }

    pub async fn search_task_lists(
        &self,
        condition: &TaskListSearchRequest,
    ) -> Result<Vec<TaskList>, ServiceError> {
        // 一時的に空のVecを返す
        let _ = condition;
        Ok(Vec::new())
    }

    pub async fn list_task_lists(
        &self,
        project_id: &str,
    ) -> Result<Vec<TaskList>, ServiceError> {
        // 一時的に空のVecを返す
        let _ = project_id;
        Ok(Vec::new())
    }
}