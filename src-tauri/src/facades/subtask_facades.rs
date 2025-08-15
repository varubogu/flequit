use crate::models::command::subtask::{SubtaskCommand, SubtaskSearchRequest};
use crate::services::subtask_service::SubtaskService;
use crate::errors::service_error::ServiceError;
use crate::types::id_types::{SubTaskId, TaskId, UserId, TagId};
use uuid::Uuid;

pub async fn create_sub_task(subtask: &SubtaskCommand) -> Result<bool, String> {
    let service = SubtaskService;
    
    // SubtaskCommandからproject_idを取得し、Subtaskモデルに変換する必要がある
    // 一時的にダミーのproject_idと簡素化した呼び出し
    let project_id = "dummy_project";
    
    // SubtaskCommandからSubtaskへの変換（ID型変換を含む）
    let dummy_subtask = crate::models::subtask::Subtask {
        id: SubTaskId::from(Uuid::parse_str(&subtask.id).map_err(|e| format!("Invalid subtask ID: {}", e))?),
        task_id: TaskId::from(Uuid::parse_str(&subtask.task_id).map_err(|e| format!("Invalid task ID: {}", e))?),
        title: subtask.title.clone(),
        description: subtask.description.clone(),
        status: subtask.status.clone(),
        priority: subtask.priority,
        start_date: None, // 日時変換は省略
        end_date: None,
        is_range_date: subtask.is_range_date,
        recurrence_rule: subtask.recurrence_rule.clone(),
        assigned_user_ids: subtask.assigned_user_ids.iter()
            .filter_map(|id| Uuid::parse_str(id).ok().map(UserId::from))
            .collect(),
        tag_ids: subtask.tag_ids.iter()
            .filter_map(|id| Uuid::parse_str(id).ok().map(TagId::from))
            .collect(),
        order_index: subtask.order_index,
        completed: subtask.completed,
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
    };
    
    match service.create_subtask(project_id, &dummy_subtask).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to create subtask: {:?}", e))
    }
}

pub async fn get_sub_task(id: &str) -> Result<Option<SubtaskCommand>, String> {
    let service = SubtaskService;
    
    // 一時的にダミーのproject_idとtask_idを使用
    let project_id = "dummy_project";
    let task_id = "dummy_task";
    
    match service.get_subtask(project_id, task_id, id).await {
        Ok(Some(_subtask)) => {
            // SubtaskからSubtaskCommandへの変換は後で実装
            // 一時的にNoneを返す
            Ok(None)
        },
        Ok(None) => Ok(None),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to get subtask: {:?}", e))
    }
}

pub async fn update_sub_task(subtask: &SubtaskCommand) -> Result<bool, String> {
    let service = SubtaskService;
    
    let project_id = "dummy_project";
    
    // SubtaskCommandからSubtaskへの変換（ID型変換を含む）
    let dummy_subtask = crate::models::subtask::Subtask {
        id: SubTaskId::from(Uuid::parse_str(&subtask.id).map_err(|e| format!("Invalid subtask ID: {}", e))?),
        task_id: TaskId::from(Uuid::parse_str(&subtask.task_id).map_err(|e| format!("Invalid task ID: {}", e))?),
        title: subtask.title.clone(),
        description: subtask.description.clone(),
        status: subtask.status.clone(),
        priority: subtask.priority,
        start_date: None, // 日時変換は省略
        end_date: None,
        is_range_date: subtask.is_range_date,
        recurrence_rule: subtask.recurrence_rule.clone(),
        assigned_user_ids: subtask.assigned_user_ids.iter()
            .filter_map(|id| Uuid::parse_str(id).ok().map(UserId::from))
            .collect(),
        tag_ids: subtask.tag_ids.iter()
            .filter_map(|id| Uuid::parse_str(id).ok().map(TagId::from))
            .collect(),
        order_index: subtask.order_index,
        completed: subtask.completed,
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
    };
    
    match service.update_subtask(project_id, &dummy_subtask).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to update subtask: {:?}", e))
    }
}

pub async fn delete_sub_task(id: &str) -> Result<bool, String> {
    let service = SubtaskService;
    
    let project_id = "dummy_project";
    let task_id = "dummy_task";
    
    match service.delete_subtask(project_id, task_id, id).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to delete subtask: {:?}", e))
    }
}

pub async fn search_sub_tasks(condition: &SubtaskSearchRequest) -> Result<Vec<SubtaskCommand>, String> {
    // SubtaskServiceにはsearchメソッドがないため、一時的に空の結果を返す
    // 将来的にはlist_subtasksを使用してフィルタリングを行う
    let _ = condition;
    Ok(vec![])
}
