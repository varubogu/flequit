use serde::{Serialize, Deserialize};
use tauri::State;
use crate::types::task_types::{Subtask, TaskStatus};
use crate::services::automerge::SubtaskService;
use crate::repositories::automerge::SubtaskRepository;
use chrono::Utc;


#[derive(Debug, Serialize, Deserialize)]
pub struct SubtaskResponse {
    pub success: bool,
    pub data: Option<Subtask>,
    pub message: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SubtaskSearchRequest {
    pub project_id: String,
    pub task_id: Option<String>,
    pub title: Option<String>,
    pub description: Option<String>,
    pub status: Option<TaskStatus>,
    pub completed: Option<bool>,
    pub created_from: Option<String>,
    pub created_to: Option<String>,
    pub limit: Option<usize>,
    pub offset: Option<usize>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SubtaskDeleteRequest {
    pub project_id: String,
    pub task_id: String,
    pub subtask_id: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SubtaskSearchResponse {
    pub success: bool,
    pub data: Vec<Subtask>,
    pub total_count: Option<usize>,
    pub message: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SubtaskDeleteResponse {
    pub success: bool,
    pub message: Option<String>,
}

// サブタスク作成
#[tauri::command]
pub async fn create_subtask(
    subtask: Subtask,
    subtask_service: State<'_, SubtaskService>,
    subtask_repository: State<'_, SubtaskRepository>,
) -> Result<SubtaskResponse, String> {
    println!("create_subtask called");
    println!("subtask: {:?}", subtask);

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

            existing_subtask.updated_at = Utc::now();

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

    // 既存のサブタスクを取得
    match subtask_service.get_subtask(subtask_repository.clone(), &project_id, &task_id, &subtask_id).await {
        Ok(Some(mut existing_subtask)) => {
            // ステータスを更新
            existing_subtask.status = status;
            existing_subtask.updated_at = Utc::now();

            // サービス層を呼び出してステータスを更新
            match subtask_service.update_subtask(subtask_repository, &project_id, &existing_subtask).await {
                Ok(_) => Ok(true),
                Err(service_error) => Err(service_error.to_string()),
            }
        }
        Ok(None) => Err("Subtask not found".to_string()),
        Err(service_error) => Err(service_error.to_string()),
    }
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

// サブタスク検索（構造体版）
#[tauri::command]
pub async fn search_subtasks(
    request: SubtaskSearchRequest,
    subtask_service: State<'_, SubtaskService>,
    subtask_repository: State<'_, SubtaskRepository>,
) -> Result<SubtaskSearchResponse, String> {
    println!("search_subtasks called");
    println!("request: {:?}", request);

    // 特定のタスクのサブタスクを検索するか、プロジェクト全体を検索するかで分岐
    if let Some(task_id) = request.task_id {
        // 特定のタスクのサブタスク検索
        match subtask_service.list_subtasks(subtask_repository, &request.project_id, &task_id).await {
            Ok(mut subtasks) => {
                // フィルタリング処理
                if let Some(ref title) = request.title {
                    subtasks.retain(|subtask| subtask.title.to_lowercase().contains(&title.to_lowercase()));
                }
                if let Some(ref description) = request.description {
                    subtasks.retain(|subtask| {
                        if let Some(ref desc) = subtask.description {
                            desc.to_lowercase().contains(&description.to_lowercase())
                        } else {
                            false
                        }
                    });
                }
                if let Some(status) = request.status {
                    subtasks.retain(|subtask| subtask.status == status);
                }
                if let Some(completed) = request.completed {
                    subtasks.retain(|subtask| subtask.completed == completed);
                }

                // ページネーション
                let total_count = subtasks.len();
                let offset = request.offset.unwrap_or(0);
                let limit = request.limit.unwrap_or(50);

                if offset < subtasks.len() {
                    subtasks = subtasks.into_iter().skip(offset).take(limit).collect();
                } else {
                    subtasks = vec![];
                }

                Ok(SubtaskSearchResponse {
                    success: true,
                    data: subtasks,
                    total_count: Some(total_count),
                    message: Some("Subtasks retrieved successfully".to_string()),
                })
            }
            Err(service_error) => Ok(SubtaskSearchResponse {
                success: false,
                data: vec![],
                total_count: Some(0),
                message: Some(service_error.to_string()),
            })
        }
    } else {
        // プロジェクト全体のサブタスク検索は現在未実装
        Ok(SubtaskSearchResponse {
            success: false,
            data: vec![],
            total_count: Some(0),
            message: Some("Task ID is required for subtask search".to_string()),
        })
    }
}

// サブタスク削除（構造体版）
#[tauri::command]
pub async fn delete_subtask_by_request(
    request: SubtaskDeleteRequest,
    subtask_service: State<'_, SubtaskService>,
    subtask_repository: State<'_, SubtaskRepository>,
) -> Result<SubtaskDeleteResponse, String> {
    println!("delete_subtask_by_request called");
    println!("request: {:?}", request);

    // サービス層を呼び出し
    match subtask_service.delete_subtask(subtask_repository, &request.project_id, &request.task_id, &request.subtask_id).await {
        Ok(_) => Ok(SubtaskDeleteResponse {
            success: true,
            message: Some("Subtask deleted successfully".to_string()),
        }),
        Err(service_error) => Ok(SubtaskDeleteResponse {
            success: false,
            message: Some(service_error.to_string()),
        })
    }
}
