use serde::{Serialize, Deserialize};
use tauri::State;
use crate::types::task_types::{Task, TaskStatus};
use crate::services::automerge::TaskService;
use crate::repositories::automerge::TaskRepository;
use uuid::Uuid;
use std::time::{SystemTime, UNIX_EPOCH};


#[derive(Debug, Serialize, Deserialize)]
pub struct TaskResponse {
    pub success: bool,
    pub data: Option<Task>,
    pub message: Option<String>,
}

// タスク作成
#[tauri::command]
pub async fn create_task(
    task: Task,
    task_service: State<'_, TaskService>,
    task_repository: State<'_, TaskRepository>,
) -> Result<TaskResponse, String> {
    println!("create_task called");
    println!("task: {:?}", task);

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
    task: Task,
    task_service: State<'_, TaskService>,
    task_repository: State<'_, TaskRepository>,
) -> Result<TaskResponse, String> {
    println!("update_task called");
    println!("task: {:?}", task);

    // サービス層を呼び出し
    match task_service.update_task(task_repository, &task).await {
        Ok(_) => {
            let res = TaskResponse {
                success: true,
                data: Some(task),
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
