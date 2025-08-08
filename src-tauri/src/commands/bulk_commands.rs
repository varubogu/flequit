use serde::{Serialize, Deserialize};
use tauri::State;
use crate::types::task_types::{TaskStatus};
use crate::services::automerge::{TaskService, SubtaskService};
use crate::repositories::automerge::{TaskRepository, SubtaskRepository};

#[derive(Debug, Serialize, Deserialize)]
pub struct BulkUpdateTasksRequest {
    pub project_id: String,
    pub task_ids: Vec<String>,
    pub status: Option<TaskStatus>,
    pub priority: Option<i32>,
    pub assigned_to: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BulkDeleteRequest {
    pub project_id: String,
    pub task_ids: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BulkResponse {
    pub success: bool,
    pub processed_count: usize,
    pub failed_count: usize,
    pub message: Option<String>,
}

// タスクの一括更新
#[tauri::command]
pub async fn bulk_update_tasks(
    request: BulkUpdateTasksRequest,
    task_service: State<'_, TaskService>,
    task_repository: State<'_, TaskRepository>,
) -> Result<BulkResponse, String> {
    println!("bulk_update_tasks called");
    println!("request: {:?}", request);

    let mut processed_count = 0;
    let mut failed_count = 0;

    // 各タスクに対して更新処理を実行
    for task_id in &request.task_ids {
        // 既存のタスクを取得
        match task_service.get_task(task_repository.clone(), &request.project_id, task_id).await {
            Ok(Some(mut existing_task)) => {
                // コマンド引数をservice形式に変換
                let mut updated = false;

                if let Some(status) = &request.status {
                    existing_task.status = status.clone();
                    updated = true;
                }

                if let Some(priority) = &request.priority {
                    existing_task.priority = priority.clone();
                    updated = true;
                }

                if updated {
                    let now = std::time::SystemTime::now()
                        .duration_since(std::time::UNIX_EPOCH)
                        .unwrap()
                        .as_secs() as i64;
                    existing_task.updated_at = now;

                    // サービス層を呼び出し
                    match task_service.update_task(task_repository.clone(), &existing_task).await {
                        Ok(_) => processed_count += 1,
                        Err(_) => failed_count += 1,
                    }
                } else {
                    processed_count += 1; // 更新する内容がない場合も成功とみなす
                }
            }
            _ => failed_count += 1,
        }
    }

    let res = BulkResponse {
        success: failed_count == 0,
        processed_count,
        failed_count,
        message: Some(format!("Processed {} tasks, {} failed", processed_count, failed_count)),
    };
    Ok(res)
}

// タスクの一括削除
#[tauri::command]
pub async fn bulk_delete_tasks(
    request: BulkDeleteRequest,
    task_service: State<'_, TaskService>,
    task_repository: State<'_, TaskRepository>,
) -> Result<BulkResponse, String> {
    println!("bulk_delete_tasks called");
    println!("request: {:?}", request);

    let mut processed_count = 0;
    let mut failed_count = 0;

    // 各タスクに対して削除処理を実行
    for task_id in &request.task_ids {
        match task_service.delete_task(task_repository.clone(), &request.project_id, task_id).await {
            Ok(_) => processed_count += 1,
            Err(_) => failed_count += 1,
        }
    }

    let res = BulkResponse {
        success: failed_count == 0,
        processed_count,
        failed_count,
        message: Some(format!("Deleted {} tasks, {} failed", processed_count, failed_count)),
    };
    Ok(res)
}

// タスクの一括ステータス変更
#[tauri::command]
pub async fn bulk_update_task_status(
    project_id: String,
    task_ids: Vec<String>,
    status: TaskStatus,
    task_service: State<'_, TaskService>,
    task_repository: State<'_, TaskRepository>,
) -> Result<BulkResponse, String> {
    println!("bulk_update_task_status called");
    println!("project_id: {:?}, task_ids: {:?}, status: {:?}", project_id, task_ids, status);

    let mut processed_count = 0;
    let mut failed_count = 0;

    // 各タスクに対してステータス更新処理を実行
    for task_id in &task_ids {
        match task_service.update_task_status(task_repository.clone(), &project_id, task_id, status.clone()).await {
            Ok(_) => processed_count += 1,
            Err(_) => failed_count += 1,
        }
    }

    let res = BulkResponse {
        success: failed_count == 0,
        processed_count,
        failed_count,
        message: Some(format!("Updated status for {} tasks, {} failed", processed_count, failed_count)),
    };
    Ok(res)
}

// タスクの一括アサイン
#[tauri::command]
pub async fn bulk_assign_tasks(
    project_id: String,
    task_ids: Vec<String>,
    assignee_id: String,
    task_service: State<'_, TaskService>,
    task_repository: State<'_, TaskRepository>,
) -> Result<BulkResponse, String> {
    println!("bulk_assign_tasks called");
    println!("project_id: {:?}, task_ids: {:?}, assignee_id: {:?}", project_id, task_ids, assignee_id);

    let mut processed_count = 0;
    let mut failed_count = 0;

    // 各タスクに対してアサイン処理を実行
    for task_id in &task_ids {
        match task_service.assign_task(task_repository.clone(), &project_id, task_id, Option::from(assignee_id.clone())).await {
            Ok(_) => processed_count += 1,
            Err(_) => failed_count += 1,
        }
    }

    let res = BulkResponse {
        success: failed_count == 0,
        processed_count,
        failed_count,
        message: Some(format!("Assigned {} tasks, {} failed", processed_count, failed_count)),
    };
    Ok(res)
}

// サブタスクの一括削除
#[tauri::command]
pub async fn bulk_delete_subtasks(
    project_id: String,
    task_id: String,
    subtask_ids: Vec<String>,
    subtask_service: State<'_, SubtaskService>,
    subtask_repository: State<'_, SubtaskRepository>,
) -> Result<BulkResponse, String> {
    println!("bulk_delete_subtasks called");
    println!("project_id: {:?}, task_id: {:?}, subtask_ids: {:?}", project_id, task_id, subtask_ids);

    let mut processed_count = 0;
    let mut failed_count = 0;

    // 各サブタスクに対して削除処理を実行
    for subtask_id in &subtask_ids {
        match subtask_service.delete_subtask(subtask_repository.clone(), &project_id, &task_id, subtask_id).await {
            Ok(_) => processed_count += 1,
            Err(_) => failed_count += 1,
        }
    }

    let res = BulkResponse {
        success: failed_count == 0,
        processed_count,
        failed_count,
        message: Some(format!("Deleted {} subtasks, {} failed", processed_count, failed_count)),
    };
    Ok(res)
}

// サブタスクの一括完了/未完了切り替え
#[tauri::command]
pub async fn bulk_toggle_subtasks_completion(
    project_id: String,
    task_id: String,
    subtask_ids: Vec<String>,
    subtask_service: State<'_, SubtaskService>,
    subtask_repository: State<'_, SubtaskRepository>,
) -> Result<BulkResponse, String> {
    println!("bulk_toggle_subtasks_completion called");
    println!("project_id: {:?}, task_id: {:?}, subtask_ids: {:?}", project_id, task_id, subtask_ids);

    let mut processed_count = 0;
    let mut failed_count = 0;

    // 各サブタスクに対して完了状態切り替え処理を実行
    for subtask_id in &subtask_ids {
        match subtask_service.toggle_completion(subtask_repository.clone(), &project_id, &task_id, subtask_id).await {
            Ok(_) => processed_count += 1,
            Err(_) => failed_count += 1,
        }
    }

    let res = BulkResponse {
        success: failed_count == 0,
        processed_count,
        failed_count,
        message: Some(format!("Toggled completion for {} subtasks, {} failed", processed_count, failed_count)),
    };
    Ok(res)
}
