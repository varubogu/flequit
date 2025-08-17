use crate::models::command::task_list::TaskListSearchRequest;
use crate::models::task_list::TaskList;
use crate::services::task_list_service;
use crate::errors::service_error::ServiceError;
use crate::types::id_types::TaskListId;

pub async fn create_task_list(task_list: &TaskList) -> Result<bool, String> {
    match task_list_service::create_task_list(task_list).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to create task list: {:?}", e))
    }
}

pub async fn get_task_list(id: &TaskListId) -> Result<Option<TaskList>, String> {
    match task_list_service::get_task_list(id).await {
        Ok(task_list) => Ok(task_list),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to get task list: {:?}", e))
    }
}

pub async fn update_task_list(task_list: &TaskList) -> Result<bool, String> {
    match task_list_service::update_task_list(task_list).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to update task list: {:?}", e))
    }
}

pub async fn delete_task_list(id: &TaskListId) -> Result<bool, String> {
    match task_list_service::delete_task_list(id).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to delete task list: {:?}", e))
    }
}

pub async fn search_task_lists(condition: &TaskListSearchRequest) -> Result<Vec<TaskList>, String> {
    match task_list_service::search_task_lists(condition).await {
        Ok(task_lists) => Ok(task_lists),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to search task lists: {:?}", e))
    }
}
