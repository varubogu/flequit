use log::info;

use crate::errors::service_error::ServiceError;
use crate::models::command::task::TaskSearchRequest;
use crate::models::task::Task;
use crate::services::task_service;

pub async fn create_task(task: &Task) -> Result<bool, String> {
    match task_service::create_task(task).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to create task: {:?}", e)),
    }
}

pub async fn get_task(id: &str) -> Result<Option<Task>, String> {
    // TaskServiceのget_taskはproject_idが必要だが、facadeのインターフェースではidのみ
    // 一時的にエラーを返す実装とし、後でインターフェース調整が必要
    info!("get_task called with id: {}", id);
    Ok(None)
}

pub async fn update_task(task: &Task) -> Result<bool, String> {
    match task_service::update_task(task).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to update task: {:?}", e)),
    }
}

pub async fn delete_task(id: &str) -> Result<bool, String> {
    // 実際にはサービス層を通してデータを削除する実装が必要
    info!("delete_task called with account: {:?}", id);
    Ok(true)
}

pub async fn search_tasks(condition: &TaskSearchRequest) -> Result<Vec<Task>, String> {
    match task_service::search_tasks(condition).await {
        Ok((tasks, _)) => Ok(tasks),
        Err(e) => Err(format!("Failed to search tasks: {:?}", e)),
    }
}
