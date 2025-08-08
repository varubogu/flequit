use tauri::State;
use serde::{Serialize, Deserialize};
use crate::services::automerge::project_service::ProjectService;
use crate::types::{Project, ProjectStatus};

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateProjectRequest {
    pub name: String,
    pub description: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ProjectResponse {
    pub success: bool,
    pub data: Option<Project>,
    pub message: Option<String>,
}

// プロジェクト作成
#[tauri::command]
pub async fn create_project(
    request: CreateProjectRequest,
    service: State<'_, ProjectService>
) -> Result<ProjectResponse, String> {
    match service.create_project(request.name, request.description).await {
        Ok(project) => Ok(ProjectResponse {
            success: true,
            data: Some(project),
            message: None,
        }),
        Err(e) => Ok(ProjectResponse {
            success: false,
            data: None,
            message: Some(e.to_string()),
        }),
    }
}

// プロジェクト取得
#[tauri::command]
pub async fn get_project(
    project_id: String,
    service: State<'_, ProjectService>
) -> Result<ProjectResponse, String> {
    match service.get_project(&project_id).await {
        Ok(Some(project)) => Ok(ProjectResponse {
            success: true,
            data: Some(project),
            message: None,
        }),
        Ok(None) => Ok(ProjectResponse {
            success: false,
            data: None,
            message: Some("Project not found".to_string()),
        }),
        Err(e) => Ok(ProjectResponse {
            success: false,
            data: None,
            message: Some(e.to_string()),
        }),
    }
}

// プロジェクト一覧取得
#[tauri::command]
pub async fn list_projects(
    service: State<'_, ProjectService>
) -> Result<Vec<Project>, String> {
    service.list_projects().await
        .map_err(|e| e.to_string())
}

// プロジェクト更新
#[tauri::command]
pub async fn update_project(
    project_id: String,
    name: Option<String>,
    description: Option<String>,
    status: Option<ProjectStatus>,
    service: State<'_, ProjectService>
) -> Result<ProjectResponse, String> {
    match service.update_project(&project_id, name, description, status).await {
        Ok(project) => Ok(ProjectResponse {
            success: true,
            data: Some(project),
            message: None,
        }),
        Err(e) => Ok(ProjectResponse {
            success: false,
            data: None,
            message: Some(e.to_string()),
        }),
    }
}

// プロジェクト削除
#[tauri::command]
pub async fn delete_project(
    project_id: String,
    service: State<'_, ProjectService>
) -> Result<bool, String> {
    match service.delete_project(&project_id).await {
        Ok(()) => Ok(true),
        Err(e) => Err(e.to_string()),
    }
}