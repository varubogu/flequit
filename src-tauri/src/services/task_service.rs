use crate::errors::service_error::ServiceError;
use crate::models::command::task::TaskSearchRequest;
use crate::models::task::Task;
use crate::repositories::base_repository_trait::Repository;
use crate::repositories::Repositories;
use crate::types::id_types::{ProjectId, TaskId};
use crate::types::task_types::TaskStatus;

pub async fn create_task(task: &Task) -> Result<(), ServiceError> {
    let repository = Repositories::new().await?;
    repository.tasks.save(task).await?;
    Ok(())
}

pub async fn get_task(task_id: &TaskId) -> Result<Option<Task>, ServiceError> {
    let repository = Repositories::new().await?;
    Ok(repository.tasks.find_by_id(task_id).await?)
}

pub async fn list_tasks(project_id: &ProjectId) -> Result<Vec<Task>, ServiceError> {
    let _ = project_id;
    let repository = Repositories::new().await?;
    Ok(repository.tasks.find_all().await?)
}

pub async fn update_task(task: &Task) -> Result<(), ServiceError> {
    let repository = Repositories::new().await?;
    repository.tasks.save(task).await?;
    Ok(())
}

pub async fn delete_task(task_id: &TaskId) -> Result<(), ServiceError> {
    let repository = Repositories::new().await?;
    repository.tasks.delete(task_id).await?;
    Ok(())
}

pub async fn list_tasks_by_assignee(
    project_id: &str,
    user_id: &str,
) -> Result<Vec<Task>, ServiceError> {
    // 一時的に空のVecを返す
    let _ = (project_id, user_id);
    Ok(Vec::new())
}

pub async fn list_tasks_by_status(
    project_id: &str,
    status: &TaskStatus,
) -> Result<Vec<Task>, ServiceError> {
    // 一時的に空のVecを返す
    let _ = (project_id, status);
    Ok(Vec::new())
}

pub async fn assign_task(
    project_id: &str,
    task_id: &str,
    assignee_id: Option<String>,
) -> Result<(), ServiceError> {
    // 一時的に何もしない
    let _ = (project_id, task_id, assignee_id);
    Ok(())
}

pub async fn update_task_status(
    project_id: &str,
    task_id: &str,
    status: &TaskStatus,
) -> Result<(), ServiceError> {
    // 一時的に何もしない
    let _ = (project_id, task_id, status);
    Ok(())
}

pub async fn update_task_priority(
    project_id: &str,
    task_id: &str,
    priority: i32,
) -> Result<(), ServiceError> {
    // 一時的に何もしない
    let _ = (project_id, task_id, priority);
    Ok(())
}

pub async fn search_tasks(request: &TaskSearchRequest) -> Result<(Vec<Task>, usize), ServiceError> {
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
