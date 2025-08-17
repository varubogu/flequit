use std::vec;

use crate::errors::service_error::ServiceError;
use crate::models::command::subtask::{SubtaskCommand, SubtaskSearchRequest};
use crate::models::subtask::SubTask;
use crate::services::subtask_service;
use crate::types::id_types::SubTaskId;

pub async fn create_sub_task(subtask: &SubTask) -> Result<bool, String> {
    match subtask_service::create_subtask(&subtask).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to create subtask: {:?}", e)),
    }
}

pub async fn get_sub_task(id: &SubTaskId) -> Result<Option<SubtaskCommand>, String> {
    match subtask_service::get_subtask(id).await {
        Ok(Some(_subtask)) => {
            // SubtaskからSubtaskCommandへの変換は後で実装
            // 一時的にNoneを返す
            Ok(None)
        }
        Ok(None) => Ok(None),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to get subtask: {:?}", e)),
    }
}

pub async fn update_sub_task(subtask: &SubTask) -> Result<bool, String> {
    match subtask_service::update_subtask(&subtask).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to update subtask: {:?}", e)),
    }
}

pub async fn delete_sub_task(id: &SubTaskId) -> Result<bool, String> {
    match subtask_service::delete_subtask(id).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to delete subtask: {:?}", e)),
    }
}

pub async fn search_sub_tasks(
    condition: &SubtaskSearchRequest,
) -> Result<Vec<SubTask>, String> {
    // SubtaskServiceにはsearchメソッドがないため、一時的に空の結果を返す
    // 将来的にはlist_subtasksを使用してフィルタリングを行う
    let _ = condition;
    Ok(vec![])
}
