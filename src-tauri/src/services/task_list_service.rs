use crate::errors::service_error::ServiceError;
use crate::models::command::task_list::TaskListSearchRequest;
use crate::models::task_list::TaskList;
use crate::repositories::base_repository_trait::Repository;
use crate::repositories::Repositories;
use crate::types::id_types::TaskListId;

pub async fn create_task_list(task_list: &TaskList) -> Result<(), ServiceError> {
    let repository: Repositories = Repositories::new().await?;
    repository.task_lists.save(task_list).await?;
    Ok(())
}

pub async fn get_task_list(list_id: &TaskListId) -> Result<Option<TaskList>, ServiceError> {
    let repository = Repositories::new().await?;
    Ok(repository.task_lists.find_by_id(list_id).await?)
}

pub async fn update_task_list(task_list: &TaskList) -> Result<(), ServiceError> {
    let repository = Repositories::new().await?;
    repository.task_lists.save(task_list).await?;
    Ok(())
}

pub async fn delete_task_list(id: &TaskListId) -> Result<(), ServiceError> {
    // 一時的に何もしない
    let _ = id;
    Ok(())
}

pub async fn search_task_lists(
    condition: &TaskListSearchRequest,
) -> Result<Vec<TaskList>, ServiceError> {
    // 一時的に空のVecを返す
    let _ = condition;
    Ok(Vec::new())
}

pub async fn list_task_lists(project_id: &str) -> Result<Vec<TaskList>, ServiceError> {
    // 一時的に空のVecを返す
    let _ = project_id;
    Ok(Vec::new())
}
