use serde::{Serialize, Deserialize};
use tauri::State;
use crate::types::task_types::{Subtask, TaskStatus};
use crate::services::automerge::SubtaskService;
use crate::repositories::automerge::SubtaskRepository;
use uuid::Uuid;
use std::time::{SystemTime, UNIX_EPOCH};

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateSubtaskRequest {
    pub project_id: String,
    pub task_id: String,
    pub title: String,
    pub description: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SubtaskResponse {
    pub success: bool,
    pub data: Option<Subtask>,
    pub message: Option<String>,
}

// サブタスク作成
#[tauri::command]
pub async fn create_subtask(
    request: CreateSubtaskRequest,
    subtask_service: State<'_, SubtaskService>,
    subtask_repository: State<'_, SubtaskRepository>,
) -> Result<SubtaskResponse, String> {
    println!("create_subtask called");
    println!("request: {:?}", request);

    // コマンド引数をservice形式に変換
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs() as i64;

    let subtask = Subtask {
        id:Uuid::new_v4().to_string(),
        task_id:request.task_id,
        title:request.title,
        created_at:now,
        updated_at:now,
        completed:todo!(),
        description: todo!(),
        status: todo!(),
        priority: todo!(),
        start_date: todo!(),
        end_date: todo!(),
        is_range_date: todo!(),
        recurrence_rule: todo!(),
        order_index: todo!()
    };

    // サービス層を呼び出し
    match subtask_service.create_subtask(subtask_repository, &subtask).await {
        Ok(_) => {
            let res = SubtaskResponse {
                success: true,
                data: Some(subtask),
                message: Some("Subtask created successfully".to_string()),
            };
            Ok(res)
        }
        Err(service_error) => {
            let res = SubtaskResponse {
                success: false,
                data: None,
                message: Some(service_error.to_string()),
            };
            Ok(res)
        }
    }
}

// サブタスク取得
#[tauri::command]
pub async fn get_subtask(
    project_id: String,
    task_id: String,
    subtask_id: String,
    subtask_service: State<'_, SubtaskService>,
    subtask_repository: State<'_, SubtaskRepository>,
) -> Result<SubtaskResponse, String> {
    println!("get_subtask called");
    println!("project_id: {:?}, task_id: {:?}, subtask_id: {:?}", project_id, task_id, subtask_id);

    // サービス層を呼び出し
    match subtask_service.get_subtask(subtask_repository, &project_id, &task_id, &subtask_id).await {
        Ok(subtask) => {
            let res = SubtaskResponse {
                success: true,
                data: subtask,
                message: Some("Subtask retrieved successfully".to_string()),
            };
            Ok(res)
        }
        Err(service_error) => {
            let res = SubtaskResponse {
                success: false,
                data: None,
                message: Some(service_error.to_string()),
            };
            Ok(res)
        }
    }
}

// タスク内のサブタスク一覧取得
#[tauri::command]
pub async fn list_subtasks(
    project_id: String,
    task_id: String,
    subtask_service: State<'_, SubtaskService>,
    subtask_repository: State<'_, SubtaskRepository>,
) -> Result<Vec<Subtask>, String> {
    println!("list_subtasks called");
    println!("project_id: {:?}, task_id: {:?}", project_id, task_id);

    // サービス層を呼び出し
    match subtask_service.list_subtasks(subtask_repository, &project_id, &task_id).await {
        Ok(subtasks) => Ok(subtasks),
        Err(service_error) => Err(service_error.to_string()),
    }
}

// サブタスク更新
#[tauri::command]
pub async fn update_subtask(
    project_id: String,
    task_id: String,
    subtask_id: String,
    title: Option<String>,
    description: Option<String>,
    status: Option<TaskStatus>,
    subtask_service: State<'_, SubtaskService>,
    subtask_repository: State<'_, SubtaskRepository>,
) -> Result<SubtaskResponse, String> {
    println!("update_subtask called");
    println!("project_id: {:?}, task_id: {:?}, subtask_id: {:?}", project_id, task_id, subtask_id);

    // 既存のサブタスクを取得
    match subtask_service.get_subtask(subtask_repository.clone(), &project_id, &task_id, &subtask_id).await {
        Ok(Some(mut existing_subtask)) => {
            // コマンド引数をservice形式に変換
            if let Some(title) = title {
                existing_subtask.title = title;
            }
            if let Some(description) = description {
                existing_subtask.description = Some(description);
            }
            if let Some(status) = status {
                existing_subtask.status = status;
            }

            let now = SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_secs() as i64;
            existing_subtask.updated_at = now;

            // サービス層を呼び出し
            match subtask_service.update_subtask(subtask_repository, &project_id, &existing_subtask).await {
                Ok(_) => {
                    let res = SubtaskResponse {
                        success: true,
                        data: Some(existing_subtask),
                        message: Some("Subtask updated successfully".to_string()),
                    };
                    Ok(res)
                }
                Err(service_error) => {
                    let res = SubtaskResponse {
                        success: false,
                        data: None,
                        message: Some(service_error.to_string()),
                    };
                    Ok(res)
                }
            }
        }
        Ok(None) => {
            let res = SubtaskResponse {
                success: false,
                data: None,
                message: Some("Subtask not found".to_string()),
            };
            Ok(res)
        }
        Err(service_error) => {
            let res = SubtaskResponse {
                success: false,
                data: None,
                message: Some(service_error.to_string()),
            };
            Ok(res)
        }
    }
}

// サブタスク削除
#[tauri::command]
pub async fn delete_subtask(
    project_id: String,
    task_id: String,
    subtask_id: String,
    subtask_service: State<'_, SubtaskService>,
    subtask_repository: State<'_, SubtaskRepository>,
) -> Result<bool, String> {
    println!("delete_subtask called");
    println!("project_id: {:?}, task_id: {:?}, subtask_id: {:?}", project_id, task_id, subtask_id);

    // サービス層を呼び出し
    match subtask_service.delete_subtask(subtask_repository, &project_id, &task_id, &subtask_id).await {
        Ok(_) => Ok(true),
        Err(service_error) => Err(service_error.to_string()),
    }
}

// サブタスクのステータス変更
#[tauri::command]
pub async fn update_subtask_status(
    project_id: String,
    task_id: String,
    subtask_id: String,
    status: TaskStatus,
    subtask_service: State<'_, SubtaskService>,
    subtask_repository: State<'_, SubtaskRepository>,
) -> Result<bool, String> {
    println!("update_subtask_status called");
    println!("project_id: {:?}, task_id: {:?}, subtask_id: {:?}, status: {:?}", project_id, task_id, subtask_id, status);

    Ok(true)
}

// サブタスクの完了/未完了切り替え
#[tauri::command]
pub async fn toggle_subtask_completion(
    project_id: String,
    task_id: String,
    subtask_id: String,
    subtask_service: State<'_, SubtaskService>,
    subtask_repository: State<'_, SubtaskRepository>,
) -> Result<bool, String> {
    println!("toggle_subtask_completion called");
    println!("project_id: {:?}, task_id: {:?}, subtask_id: {:?}", project_id, task_id, subtask_id);

    // サービス層を呼び出し
    match subtask_service.toggle_completion(subtask_repository, &project_id, &task_id, &subtask_id).await {
        Ok(_) => Ok(true),
        Err(service_error) => Err(service_error.to_string()),
    }
}
