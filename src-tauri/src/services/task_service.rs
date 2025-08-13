use crate::models::task::Task;
use crate::types::task_types::TaskStatus;
use crate::repositories::core::CoreRepositoryTrait;
use crate::errors::service_error::ServiceError;
use crate::models::command::task::TaskSearchRequest;

#[allow(dead_code)]
pub struct TaskService;

#[allow(dead_code)]
impl TaskService {
    pub async fn create_task(
        &self,
        repositories: &mut [Box<dyn CoreRepositoryTrait>],
        task: &Task,
    ) -> Result<(), ServiceError> {
        for repo in repositories {
            repo.set_task(&task.project_id, task).await?;
        }
        Ok(())
    }

    pub async fn get_task(
        &self,
        repository: &dyn CoreRepositoryTrait,
        project_id: &str,
        task_id: &str,
    ) -> Result<Option<Task>, ServiceError> {
        Ok(repository.get_task(project_id, task_id).await?)
    }

    pub async fn list_tasks(
        &self,
        repository: &dyn CoreRepositoryTrait,
        project_id: &str,
    ) -> Result<Vec<Task>, ServiceError> {
        Ok(repository.list_tasks(project_id).await?)
    }

    pub async fn update_task(
        &self,
        repositories: &mut [Box<dyn CoreRepositoryTrait>],
        task: &Task,
    ) -> Result<(), ServiceError> {
        for repo in repositories {
            repo.set_task(&task.project_id, task).await?;
        }
        Ok(())
    }

    pub async fn delete_task(
        &self,
        repositories: &mut [Box<dyn CoreRepositoryTrait>],
        project_id: &str,
        task_id: &str,
    ) -> Result<(), ServiceError> {
        for repo in repositories {
            repo.delete_task(project_id, task_id).await?;
        }
        Ok(())
    }

    pub async fn list_tasks_by_assignee(
        &self,
        repository: &dyn CoreRepositoryTrait,
        project_id: &str,
        user_id: &str,
    ) -> Result<Vec<Task>, ServiceError> {
        Ok(repository.find_tasks_by_assignee(project_id, user_id).await?)
    }

    pub async fn list_tasks_by_status(
        &self,
        repository: &dyn CoreRepositoryTrait,
        project_id: &str,
        status: &TaskStatus,
    ) -> Result<Vec<Task>, ServiceError> {
        Ok(repository.find_tasks_by_status(project_id, status.clone()).await?)
    }

    pub async fn assign_task(
        &self,
        repositories: &mut [Box<dyn CoreRepositoryTrait>],
        project_id: &str,
        task_id: &str,
        assignee_id: Option<String>,
    ) -> Result<(), ServiceError> {
        for repo in repositories {
            repo.assign_task(project_id, task_id, assignee_id.clone()).await?;
        }
        Ok(())
    }

    pub async fn update_task_status(
        &self,
        repositories: &mut [Box<dyn CoreRepositoryTrait>],
        project_id: &str,
        task_id: &str,
        status: &TaskStatus,
    ) -> Result<(), ServiceError> {
        for repo in repositories {
            repo.update_task_status(project_id, task_id, status.clone()).await?;
        }
        Ok(())
    }

    pub async fn update_task_priority(
        &self,
        repositories: &mut [Box<dyn CoreRepositoryTrait>],
        project_id: &str,
        task_id: &str,
        priority: i32,
    ) -> Result<(), ServiceError> {
        for repo in repositories {
            repo.update_task_priority(project_id, task_id, priority).await?;
        }
        Ok(())
    }

    pub async fn search_tasks(
        &self,
        repository: &dyn CoreRepositoryTrait,
        request: &TaskSearchRequest,
    ) -> Result<(Vec<Task>, usize), ServiceError> {
        let project_id = request.project_id.as_deref().unwrap_or("");
        // NOTE: Ideally, filtering should be done in the repository layer with a dedicated method.
        let mut tasks = repository.list_tasks(project_id).await?;

        if let Some(title) = &request.title {
            tasks.retain(|task| task.title.to_lowercase().contains(&title.to_lowercase()));
        }

        let total_count = tasks.len();
        let offset = request.offset.unwrap_or(0);
        let limit = request.limit.unwrap_or(50);

        let paginated_tasks = tasks.into_iter().skip(offset).take(limit).collect();

        Ok((paginated_tasks, total_count))
    }
}
