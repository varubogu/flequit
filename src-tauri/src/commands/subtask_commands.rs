use serde::{Serialize, Deserialize};
use crate::types::task_types::{Subtask, TaskStatus};
use crate::services::subtask_service::SubtaskService;
use crate::services::repository_service::{get_repositories, get_repository_searcher};

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

#[tauri::command]
pub async fn create_subtask(project_id: String, subtask: Subtask) -> Result<SubtaskResponse, String> {
    let subtask_service = SubtaskService;
    let mut repos = get_repositories();
    match subtask_service.create_subtask(&mut repos, &project_id, &subtask).await {
        Ok(_) => Ok(SubtaskResponse { success: true, data: Some(subtask), message: Some("Subtask created".to_string()) }),
        Err(e) => Ok(SubtaskResponse { success: false, data: None, message: Some(e.to_string()) }),
    }
}

#[tauri::command]
pub async fn get_subtask(project_id: String, task_id: String, subtask_id: String) -> Result<SubtaskResponse, String> {
    let subtask_service = SubtaskService;
    let repo = get_repository_searcher();
    match subtask_service.get_subtask(&*repo, &project_id, &task_id, &subtask_id).await {
        Ok(subtask) => Ok(SubtaskResponse { success: true, data: subtask, message: Some("Subtask found".to_string()) }),
        Err(e) => Ok(SubtaskResponse { success: false, data: None, message: Some(e.to_string()) }),
    }
}

#[tauri::command]
pub async fn list_subtasks(project_id: String, task_id: String) -> Result<Vec<Subtask>, String> {
    let subtask_service = SubtaskService;
    let repo = get_repository_searcher();
    subtask_service.list_subtasks(&*repo, &project_id, &task_id).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_subtask(project_id: String, subtask: Subtask) -> Result<SubtaskResponse, String> {
    let subtask_service = SubtaskService;
    let mut repos = get_repositories();
    match subtask_service.update_subtask(&mut repos, &project_id, &subtask).await {
        Ok(_) => Ok(SubtaskResponse { success: true, data: Some(subtask), message: Some("Subtask updated".to_string()) }),
        Err(e) => Ok(SubtaskResponse { success: false, data: None, message: Some(e.to_string()) }),
    }
}

#[tauri::command]
pub async fn delete_subtask(project_id: String, task_id: String, subtask_id: String) -> Result<bool, String> {
    let subtask_service = SubtaskService;
    let mut repos = get_repositories();
    subtask_service.delete_subtask(&mut repos, &project_id, &task_id, &subtask_id).await.map(|_| true).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn toggle_subtask_completion(project_id: String, task_id: String, subtask_id: String) -> Result<bool, String> {
    let subtask_service = SubtaskService;
    let mut repos = get_repositories();
    subtask_service.toggle_completion(&mut repos, &project_id, &task_id, &subtask_id).await.map(|_| true).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn search_subtasks(request: SubtaskSearchRequest) -> Result<SubtaskSearchResponse, String> {
    if request.task_id.is_none() {
        return Ok(SubtaskSearchResponse { success: false, data: vec![], total_count: Some(0), message: Some("task_id is required".to_string()) });
    }
    let task_id = request.task_id.unwrap();
    let subtasks = list_subtasks(request.project_id, task_id).await.map_err(|e| e.to_string())?;
    // Manual filtering
    let filtered: Vec<Subtask> = subtasks.into_iter().filter(|s|{
        request.title.as_ref().map_or(true, |t| s.title.contains(t))
    }).collect();
    Ok(SubtaskSearchResponse { success: true, data: filtered, total_count: None, message: Some("Subtasks found".to_string()) })
}

#[tauri::command]
pub async fn delete_subtask_by_request(request: SubtaskDeleteRequest) -> Result<SubtaskDeleteResponse, String> {
    match delete_subtask(request.project_id, request.task_id, request.subtask_id).await {
        Ok(_) => Ok(SubtaskDeleteResponse { success: true, message: Some("Subtask deleted".to_string()) }),
        Err(e) => Ok(SubtaskDeleteResponse { success: false, message: Some(e) }),
    }
}