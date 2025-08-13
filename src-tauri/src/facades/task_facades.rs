use log::info;

use crate::models::task::Task;
use crate::models::command::task::TaskSearchRequest;
use crate::services::task_service::TaskService;
use crate::services::repository_service::{get_repository_searcher, get_repositories};
use crate::errors::service_error::ServiceError;

pub async fn create_task(task: &Task) -> Result<bool, String> {
    let service = TaskService;
    let mut repositories = get_repositories();

    match service.create_task(&mut repositories, task).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to create task: {:?}", e))
    }
}

pub async fn get_task(id: &str) -> Result<Option<Task>, String> {
    // TaskServiceのget_taskはproject_idが必要だが、facadeのインターフェースではidのみ
    // 一時的にエラーを返す実装とし、後でインターフェース調整が必要
    info!("get_task called with id: {}", id);
    Ok(None)
}

pub async fn update_task(task: &Task) -> Result<bool, String> {
    let service = TaskService;
    let mut repositories = get_repositories();

    match service.update_task(&mut repositories, task).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to update task: {:?}", e))
    }
}

pub async fn delete_task(id: &str) -> Result<bool, String> {
    // 実際にはサービス層を通してデータを削除する実装が必要
    info!("delete_task called with account: {:?}", id);
    Ok(true)
}

pub async fn search_tasks(condition: &TaskSearchRequest) -> Result<Vec<Task>, String> {
    let service = TaskService;
    let repository = get_repository_searcher();

    match service.search_tasks(repository.as_ref(), condition).await {
        Ok((tasks, _)) => Ok(tasks),
        Err(e) => Err(format!("Failed to search tasks: {:?}", e))
    }
}
