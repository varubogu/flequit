use serde::{Serialize, Deserialize};
use tauri::State;
use crate::types::task_types::{Task, TaskStatus};
use crate::services::automerge::TaskService;
use crate::repositories::automerge::TaskRepository;
use uuid::Uuid;
use std::time::{SystemTime, UNIX_EPOCH};

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateTaskRequest {
    pub project_id: String,
    pub title: String,
    pub description: Option<String>,
    pub assigned_to: Option<String>,
    pub due_date: Option<i64>,
    pub priority: Option<i32>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TaskResponse {
    pub success: bool,
    pub data: Option<Task>,
    pub message: Option<String>,
}

// タスク作成
#[tauri::command]
pub async fn create_task(
    request: CreateTaskRequest,
    task_service: State<'_, TaskService>,
    task_repository: State<'_, TaskRepository>,
) -> Result<TaskResponse, String> {
    println!("create_task called");
    println!("request: {:?}", request);

    // コマンド引数をservice形式に変換
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs() as i64;

    let task = Task {
        id:Uuid::new_v4().to_string(),
        title:request.title,
        description:request.description,
        status: TaskStatus::NotStarted,
        priority: request.priority.unwrap(),
        created_at:now,
        updated_at:now,
        sub_task_id: todo!(),
        list_id: todo!(),
        start_date: todo!(),
        end_date: todo!(),
        is_range_date: todo!(),
        recurrence_rule: todo!(),
        order_index: todo!(),
        is_archived: todo!()
    };

    // サービス層を呼び出し
    match task_service.create_task(task_repository, &task).await {
        Ok(_) => {
            let res = TaskResponse {
                success: true,
                data: Some(task),
                message: Some("Task created successfully".to_string()),
            };
            Ok(res)
        }
        Err(service_error) => {
            let res = TaskResponse {
                success: false,
                data: None,
                message: Some(service_error.to_string()),
            };
            Ok(res)
        }
    }
}

// タスク取得
#[tauri::command]
pub async fn get_task(
    project_id: String,
    task_id: String,
    task_service: State<'_, TaskService>,
    task_repository: State<'_, TaskRepository>,
) -> Result<TaskResponse, String> {
    println!("get_task called");
    println!("project_id: {:?}, task_id: {:?}", project_id, task_id);

    // サービス層を呼び出し
    match task_service.get_task(task_repository, &project_id, &task_id).await {
        Ok(task) => {
            let res = TaskResponse {
                success: true,
                data: task,
                message: Some("Task retrieved successfully".to_string()),
            };
            Ok(res)
        }
        Err(service_error) => {
            let res = TaskResponse {
                success: false,
                data: None,
                message: Some(service_error.to_string()),
            };
            Ok(res)
        }
    }
}

// プロジェクト内のタスク一覧取得
#[tauri::command]
pub async fn list_tasks(
    project_id: String,
    task_service: State<'_, TaskService>,
    task_repository: State<'_, TaskRepository>,
) -> Result<Vec<Task>, String> {
    println!("list_tasks called");
    println!("project_id: {:?}", project_id);

    // サービス層を呼び出し
    match task_service.list_tasks(task_repository, &project_id).await {
        Ok(tasks) => Ok(tasks),
        Err(service_error) => Err(service_error.to_string()),
    }
}

// タスク更新
#[tauri::command]
pub async fn update_task(
    project_id: String,
    task_id: String,
    title: Option<String>,
    description: Option<String>,
    status: Option<TaskStatus>,
    priority: Option<i32>,
    assigned_to: Option<String>,
    due_date: Option<i64>,
    task_service: State<'_, TaskService>,
    task_repository: State<'_, TaskRepository>,
) -> Result<TaskResponse, String> {
    println!("update_task called");
    println!("project_id: {:?}, task_id: {:?}", project_id, task_id);

    // 既存のタスクを取得
    match task_service.get_task(task_repository.clone(), &project_id, &task_id).await {
        Ok(Some(mut existing_task)) => {
            // コマンド引数をservice形式に変換
            if let Some(title) = title {
                existing_task.title = title;
            }
            if let Some(description) = description {
                existing_task.description = Some(description);
            }
            if let Some(status) = status {
                existing_task.status = status;
            }
            if let Some(priority) = priority {
                existing_task.priority = priority;
            }


            let now = SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_secs() as i64;
            existing_task.updated_at = now;

            // サービス層を呼び出し
            match task_service.update_task(task_repository, &existing_task).await {
                Ok(_) => {
                    let res = TaskResponse {
                        success: true,
                        data: Some(existing_task),
                        message: Some("Task updated successfully".to_string()),
                    };
                    Ok(res)
                }
                Err(service_error) => {
                    let res = TaskResponse {
                        success: false,
                        data: None,
                        message: Some(service_error.to_string()),
                    };
                    Ok(res)
                }
            }
        }
        Ok(None) => {
            let res = TaskResponse {
                success: false,
                data: None,
                message: Some("Task not found".to_string()),
            };
            Ok(res)
        }
        Err(service_error) => {
            let res = TaskResponse {
                success: false,
                data: None,
                message: Some(service_error.to_string()),
            };
            Ok(res)
        }
    }
}

// タスク削除
#[tauri::command]
pub async fn delete_task(
    project_id: String,
    task_id: String,
    task_service: State<'_, TaskService>,
    task_repository: State<'_, TaskRepository>,
) -> Result<bool, String> {
    println!("delete_task called");
    println!("project_id: {:?}, task_id: {:?}", project_id, task_id);

    // サービス層を呼び出し
    match task_service.delete_task(task_repository, &project_id, &task_id).await {
        Ok(_) => Ok(true),
        Err(service_error) => Err(service_error.to_string()),
    }
}

// ユーザーにアサインされたタスク一覧取得
#[tauri::command]
pub async fn list_tasks_by_assignee(
    project_id: String,
    user_id: String,
    task_service: State<'_, TaskService>,
    task_repository: State<'_, TaskRepository>,
) -> Result<Vec<Task>, String> {
    println!("list_tasks_by_assignee called");
    println!("project_id: {:?}, user_id: {:?}", project_id, user_id);

    // サービス層を呼び出し
    match task_service.list_tasks_by_assignee(task_repository, &project_id, &user_id).await {
        Ok(tasks) => Ok(tasks),
        Err(service_error) => Err(service_error.to_string()),
    }
}

// ステータス別タスク一覧取得
#[tauri::command]
pub async fn list_tasks_by_status(
    project_id: String,
    status: TaskStatus,
    task_service: State<'_, TaskService>,
    task_repository: State<'_, TaskRepository>,
) -> Result<Vec<Task>, String> {
    println!("list_tasks_by_status called");
    println!("project_id: {:?}, status: {:?}", project_id, status);

    // サービス層を呼び出し
    match task_service.list_tasks_by_status(task_repository, &project_id, status).await {
        Ok(tasks) => Ok(tasks),
        Err(service_error) => Err(service_error.to_string()),
    }
}

// タスクのアサイン
#[tauri::command]
pub async fn assign_task(
    project_id: String,
    task_id: String,
    assignee_id: String,
    task_service: State<'_, TaskService>,
    task_repository: State<'_, TaskRepository>,
) -> Result<bool, String> {
    println!("assign_task called");
    println!("project_id: {:?}, task_id: {:?}, assignee_id: {:?}", project_id, task_id, assignee_id);

    // サービス層を呼び出し
    match task_service.assign_task(task_repository, &project_id, &task_id, Option::from(assignee_id)).await {
        Ok(_) => Ok(true),
        Err(service_error) => Err(service_error.to_string()),
    }
}

// タスクのステータス変更
#[tauri::command]
pub async fn update_task_status(
    project_id: String,
    task_id: String,
    status: TaskStatus,
    task_service: State<'_, TaskService>,
    task_repository: State<'_, TaskRepository>,
) -> Result<bool, String> {
    println!("update_task_status called");
    println!("project_id: {:?}, task_id: {:?}, status: {:?}", project_id, task_id, status);

    // サービス層を呼び出し
    match task_service.update_task_status(task_repository, &project_id, &task_id, status).await {
        Ok(_) => Ok(true),
        Err(service_error) => Err(service_error.to_string()),
    }
}

// タスクの優先度変更
#[tauri::command]
pub async fn update_task_priority(
    project_id: String,
    task_id: String,
    priority: i32,
    task_service: State<'_, TaskService>,
    task_repository: State<'_, TaskRepository>,
) -> Result<bool, String> {
    println!("update_task_priority called");
    println!("project_id: {:?}, task_id: {:?}, priority: {:?}", project_id, task_id, priority);

    // サービス層を呼び出し
    match task_service.update_task_priority(task_repository, &project_id, &task_id, priority).await {
        Ok(_) => Ok(true),
        Err(service_error) => Err(service_error.to_string()),
    }
}
