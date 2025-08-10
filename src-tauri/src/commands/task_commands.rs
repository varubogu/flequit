use serde::{Serialize, Deserialize};
use crate::types::task_types::{Task, TaskStatus};
use crate::services::task_service::TaskService;
use crate::services::repository_service::{get_repositories, get_repository_searcher};

#[derive(Debug, Serialize, Deserialize)]
pub struct TaskResponse {
    pub success: bool,
    pub data: Option<Task>,
    pub message: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TaskSearchRequest {
    pub project_id: Option<String>,
    pub title: Option<String>,
    pub description: Option<String>,
    pub status: Option<TaskStatus>,
    pub assignee_id: Option<String>,
    pub priority_min: Option<i32>,
    pub priority_max: Option<i32>,
    pub tag_ids: Option<Vec<String>>,
    pub due_date_from: Option<String>,
    pub due_date_to: Option<String>,
    pub created_from: Option<String>,
    pub created_to: Option<String>,
    pub limit: Option<usize>,
    pub offset: Option<usize>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TaskDeleteRequest {
    pub project_id: String,
    pub task_id: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TaskSearchResponse {
    pub success: bool,
    pub data: Vec<Task>,
    pub total_count: Option<usize>,
    pub message: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TaskDeleteResponse {
    pub success: bool,
    pub message: Option<String>,
}

#[tauri::command]
pub async fn create_task(task: Task) -> Result<TaskResponse, String> {
    let task_service = TaskService;
    let mut repos = get_repositories();
    match task_service.create_task(&mut repos, &task).await {
        Ok(_) => Ok(TaskResponse { success: true, data: Some(task), message: Some("Task created".to_string()) }),
        Err(e) => Ok(TaskResponse { success: false, data: None, message: Some(e.to_string()) }),
    }
}

#[tauri::command]
pub async fn get_task(project_id: String, task_id: String) -> Result<TaskResponse, String> {
    let task_service = TaskService;
    let repo = get_repository_searcher();
    match task_service.get_task(&*repo, &project_id, &task_id).await {
        Ok(task) => Ok(TaskResponse { success: true, data: task, message: Some("Task found".to_string()) }),
        Err(e) => Ok(TaskResponse { success: false, data: None, message: Some(e.to_string()) }),
    }
}

#[tauri::command]
pub async fn list_tasks(project_id: String) -> Result<Vec<Task>, String> {
    let task_service = TaskService;
    let repo = get_repository_searcher();
    task_service.list_tasks(&*repo, &project_id).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_task(task: Task) -> Result<TaskResponse, String> {
    let task_service = TaskService;
    let mut repos = get_repositories();
    match task_service.update_task(&mut repos, &task).await {
        Ok(_) => Ok(TaskResponse { success: true, data: Some(task), message: Some("Task updated".to_string()) }),
        Err(e) => Ok(TaskResponse { success: false, data: None, message: Some(e.to_string()) }),
    }
}

#[tauri::command]
pub async fn delete_task(project_id: String, task_id: String) -> Result<bool, String> {
    let task_service = TaskService;
    let mut repos = get_repositories();
    task_service.delete_task(&mut repos, &project_id, &task_id).await.map(|_| true).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn list_tasks_by_assignee(project_id: String, user_id: String) -> Result<Vec<Task>, String> {
    let task_service = TaskService;
    let repo = get_repository_searcher();
    task_service.list_tasks_by_assignee(&*repo, &project_id, &user_id).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn list_tasks_by_status(project_id: String, status: TaskStatus) -> Result<Vec<Task>, String> {
    let task_service = TaskService;
    let repo = get_repository_searcher();
    task_service.list_tasks_by_status(&*repo, &project_id, &status).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn assign_task(project_id: String, task_id: String, assignee_id: String) -> Result<bool, String> {
    let task_service = TaskService;
    let mut repos = get_repositories();
    task_service.assign_task(&mut repos, &project_id, &task_id, Some(assignee_id)).await.map(|_| true).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_task_status(project_id: String, task_id: String, status: TaskStatus) -> Result<bool, String> {
    let task_service = TaskService;
    let mut repos = get_repositories();
    task_service.update_task_status(&mut repos, &project_id, &task_id, &status).await.map(|_| true).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_task_priority(project_id: String, task_id: String, priority: i32) -> Result<bool, String> {
    let task_service = TaskService;
    let mut repos = get_repositories();
    task_service.update_task_priority(&mut repos, &project_id, &task_id, priority).await.map(|_| true).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn search_tasks(request: TaskSearchRequest) -> Result<TaskSearchResponse, String> {
    let task_service = TaskService;
    let repo = get_repository_searcher();
    match task_service.search_tasks(&*repo, &request).await {
        Ok((tasks, total_count)) => Ok(TaskSearchResponse { success: true, data: tasks, total_count: Some(total_count), message: Some("Tasks found".to_string()) }),
        Err(e) => Ok(TaskSearchResponse { success: false, data: vec![], total_count: Some(0), message: Some(e.to_string()) }),
    }
}

#[tauri::command]
pub async fn delete_task_by_request(request: TaskDeleteRequest) -> Result<TaskDeleteResponse, String> {
    match delete_task(request.project_id, request.task_id).await {
        Ok(_) => Ok(TaskDeleteResponse { success: true, message: Some("Task deleted".to_string()) }),
        Err(e) => Ok(TaskDeleteResponse { success: false, message: Some(e) }),
    }
}