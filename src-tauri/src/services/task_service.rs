use crate::models::task::Task;
use crate::types::task_types::TaskStatus;
use crate::errors::service_error::ServiceError;
use crate::models::command::task::TaskSearchRequest;
use crate::repositories::local_automerge::projects_repository::ProjectsRepository;

#[allow(dead_code)]
pub struct TaskService;

#[allow(dead_code)]
impl TaskService {
    pub async fn create_task(
        &self,
        task: &Task,
    ) -> Result<(), ServiceError> {
        if task.project_id.trim().is_empty() || task.title.trim().is_empty() {
            return Err(ServiceError::ValidationError("Project ID and Task title cannot be empty".to_string()));
        }
        let repository = ProjectsRepository::with_default_path()?;
        repository.set_task(&task.project_id, task).await?;
        Ok(())
    }

    pub async fn get_task(
        &self,
        project_id: &str,
        task_id: &str,
    ) -> Result<Option<Task>, ServiceError> {
        if project_id.trim().is_empty() || task_id.trim().is_empty() {
            return Err(ServiceError::ValidationError("Project ID and Task ID cannot be empty".to_string()));
        }
        let repository = ProjectsRepository::with_default_path()?;
        Ok(repository.get_task(project_id, task_id).await?)
    }

    pub async fn list_tasks(
        &self,
        project_id: &str,
    ) -> Result<Vec<Task>, ServiceError> {
        // ProjectsRepositoryにはlist_tasksメソッドがないため、一時的に空のVecを返す
        let _ = project_id;
        Ok(Vec::new())
    }

    pub async fn update_task(
        &self,
        task: &Task,
    ) -> Result<(), ServiceError> {
        if task.project_id.trim().is_empty() || task.title.trim().is_empty() {
            return Err(ServiceError::ValidationError("Project ID and Task title cannot be empty".to_string()));
        }
        let repository = ProjectsRepository::with_default_path()?;
        repository.set_task(&task.project_id, task).await?;
        Ok(())
    }

    pub async fn delete_task(
        &self,
        project_id: &str,
        task_id: &str,
    ) -> Result<(), ServiceError> {
        // 一時的に何もしない
        let _ = (project_id, task_id);
        Ok(())
    }

    pub async fn list_tasks_by_assignee(
        &self,
        project_id: &str,
        user_id: &str,
    ) -> Result<Vec<Task>, ServiceError> {
        // 一時的に空のVecを返す
        let _ = (project_id, user_id);
        Ok(Vec::new())
    }

    pub async fn list_tasks_by_status(
        &self,
        project_id: &str,
        status: &TaskStatus,
    ) -> Result<Vec<Task>, ServiceError> {
        // 一時的に空のVecを返す
        let _ = (project_id, status);
        Ok(Vec::new())
    }

    pub async fn assign_task(
        &self,
        project_id: &str,
        task_id: &str,
        assignee_id: Option<String>,
    ) -> Result<(), ServiceError> {
        // 一時的に何もしない
        let _ = (project_id, task_id, assignee_id);
        Ok(())
    }

    pub async fn update_task_status(
        &self,
        project_id: &str,
        task_id: &str,
        status: &TaskStatus,
    ) -> Result<(), ServiceError> {
        // 一時的に何もしない
        let _ = (project_id, task_id, status);
        Ok(())
    }

    pub async fn update_task_priority(
        &self,
        project_id: &str,
        task_id: &str,
        priority: i32,
    ) -> Result<(), ServiceError> {
        // 一時的に何もしない
        let _ = (project_id, task_id, priority);
        Ok(())
    }

    pub async fn search_tasks(
        &self,
        request: &TaskSearchRequest,
    ) -> Result<(Vec<Task>, usize), ServiceError> {
        let _project_id = request.project_id.as_deref().unwrap_or("");
        // NOTE: Ideally, filtering should be done in the repository layer with a dedicated method.
        // ProjectsRepositoryにはlist_tasksメソッドがないため、一時的に空のVecを使用
        let tasks: Vec<Task> = Vec::new();

        // フィルタリングは空のVecには意味がないため、requestのパラメータを使用するだけ
        let _ = &request.title;

        let total_count = tasks.len();
        let offset = request.offset.unwrap_or(0);
        let limit = request.limit.unwrap_or(50);

        let paginated_tasks = tasks.into_iter().skip(offset).take(limit).collect();

        Ok((paginated_tasks, total_count))
    }
}
