use serde::{Serialize, Deserialize};
use tauri::State;
use crate::types::project_types::{Project, ProjectStatus};
use crate::services::automerge::ProjectService;
use crate::repositories::automerge::ProjectRepository;
use uuid::Uuid;
use std::time::{SystemTime, UNIX_EPOCH};


#[derive(Debug, Serialize, Deserialize)]
pub struct ProjectResponse {
    pub success: bool,
    pub data: Option<Project>,
    pub message: Option<String>,
}

// プロジェクト作成
#[tauri::command]
pub async fn create_project(
    project: Project,
    project_service: State<'_, ProjectService>,
    project_repository: State<'_, ProjectRepository>,
) -> Result<ProjectResponse, String> {
    println!("create_project called");
    println!("project: {:?}", project);

    // サービス層を呼び出し
    match project_service.create_project(project_repository, &project).await {
        Ok(_) => {
            let res = ProjectResponse {
                success: true,
                data: Some(project),
                message: Some("Project created successfully".to_string()),
            };
            Ok(res)
        }
        Err(service_error) => {
            let res = ProjectResponse {
                success: false,
                data: None,
                message: Some(service_error.to_string()),
            };
            Ok(res)
        }
    }
}

// プロジェクト取得
#[tauri::command]
pub async fn get_project(
    project_id: String,
    project_service: State<'_, ProjectService>,
    project_repository: State<'_, ProjectRepository>,
) -> Result<ProjectResponse, String> {
    println!("get_project called");
    println!("project_id: {:?}", project_id);

    // サービス層を呼び出し
    match project_service.get_project(project_repository, &project_id).await {
        Ok(project) => {
            let res = ProjectResponse {
                success: true,
                data: project,
                message: Some("Project retrieved successfully".to_string()),
            };
            Ok(res)
        }
        Err(service_error) => {
            let res = ProjectResponse {
                success: false,
                data: None,
                message: Some(service_error.to_string()),
            };
            Ok(res)
        }
    }
}

// プロジェクト一覧取得
#[tauri::command]
pub async fn list_projects(
    project_service: State<'_, ProjectService>,
    project_repository: State<'_, ProjectRepository>,
) -> Result<Vec<Project>, String> {
    println!("list_projects called");

    // サービス層を呼び出し
    match project_service.list_projects(project_repository).await {
        Ok(projects) => Ok(projects),
        Err(service_error) => Err(service_error.to_string()),
    }
}

// プロジェクト更新
#[tauri::command]
pub async fn update_project(
    project: Project,
    project_service: State<'_, ProjectService>,
    project_repository: State<'_, ProjectRepository>,
) -> Result<ProjectResponse, String> {
    println!("update_project called");
    println!("project: {:?}", project);

    // サービス層を呼び出し
    match project_service.update_project(project_repository, &project).await {
        Ok(_) => {
            let res = ProjectResponse {
                success: true,
                data: Some(project),
                message: Some("Project updated successfully".to_string()),
            };
            Ok(res)
        }
        Err(service_error) => {
            let res = ProjectResponse {
                success: false,
                data: None,
                message: Some(service_error.to_string()),
            };
            Ok(res)
        }
    }
}

// プロジェクト削除
#[tauri::command]
pub async fn delete_project(
    project_id: String,
    project_service: State<'_, ProjectService>,
    project_repository: State<'_, ProjectRepository>,
) -> Result<bool, String> {
    println!("delete_project called");
    println!("project_id: {:?}", project_id);

    // サービス層を呼び出し
    match project_service.delete_project(project_repository, &project_id).await {
        Ok(_) => Ok(true),
        Err(service_error) => Err(service_error.to_string()),
    }
}
