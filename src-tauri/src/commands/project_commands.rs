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

#[derive(Debug, Serialize, Deserialize)]
pub struct ProjectSearchRequest {
    pub name: Option<String>,
    pub description: Option<String>,
    pub status: Option<ProjectStatus>,
    pub owner_id: Option<String>,
    pub created_from: Option<String>,
    pub created_to: Option<String>,
    pub limit: Option<usize>,
    pub offset: Option<usize>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ProjectDeleteRequest {
    pub project_id: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ProjectSearchResponse {
    pub success: bool,
    pub data: Vec<Project>,
    pub total_count: Option<usize>,
    pub message: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ProjectDeleteResponse {
    pub success: bool,
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

// プロジェクト検索（構造体版）
#[tauri::command]
pub async fn search_projects(
    request: ProjectSearchRequest,
    project_service: State<'_, ProjectService>,
    project_repository: State<'_, ProjectRepository>,
) -> Result<ProjectSearchResponse, String> {
    println!("search_projects called");
    println!("request: {:?}", request);

    // 既存のlist_projectsベースで実装
    match project_service.list_projects(project_repository).await {
        Ok(mut projects) => {
            // フィルタリング処理
            if let Some(ref name) = request.name {
                projects.retain(|project| project.name.to_lowercase().contains(&name.to_lowercase()));
            }
            if let Some(ref description) = request.description {
                projects.retain(|project| {
                    if let Some(ref desc) = project.description {
                        desc.to_lowercase().contains(&description.to_lowercase())
                    } else {
                        false
                    }
                });
            }
            if let Some(status) = request.status {
                projects.retain(|project| project.status == status);
            }
            if let Some(ref owner_id) = request.owner_id {
                projects.retain(|project| project.owner_id.as_ref() == Some(owner_id));
            }

            // ページネーション
            let total_count = projects.len();
            let offset = request.offset.unwrap_or(0);
            let limit = request.limit.unwrap_or(50);
            
            if offset < projects.len() {
                projects = projects.into_iter().skip(offset).take(limit).collect();
            } else {
                projects = vec![];
            }

            Ok(ProjectSearchResponse {
                success: true,
                data: projects,
                total_count: Some(total_count),
                message: Some("Projects retrieved successfully".to_string()),
            })
        }
        Err(service_error) => Ok(ProjectSearchResponse {
            success: false,
            data: vec![],
            total_count: Some(0),
            message: Some(service_error.to_string()),
        })
    }
}

// プロジェクト削除（構造体版）
#[tauri::command]
pub async fn delete_project_by_request(
    request: ProjectDeleteRequest,
    project_service: State<'_, ProjectService>,
    project_repository: State<'_, ProjectRepository>,
) -> Result<ProjectDeleteResponse, String> {
    println!("delete_project_by_request called");
    println!("request: {:?}", request);

    // サービス層を呼び出し
    match project_service.delete_project(project_repository, &request.project_id).await {
        Ok(_) => Ok(ProjectDeleteResponse {
            success: true,
            message: Some("Project deleted successfully".to_string()),
        }),
        Err(service_error) => Ok(ProjectDeleteResponse {
            success: false,
            message: Some(service_error.to_string()),
        })
    }
}
