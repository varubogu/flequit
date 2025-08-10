use serde::{Serialize, Deserialize};
use crate::types::project_types::{Project, ProjectStatus};
use crate::services::project_service::ProjectService;
use crate::services::repository_service::{get_repositories, get_repository_searcher};

// HACK: コマンドとレスポンスの構造体は一旦コマンドファイル内に残す
// TODO: 将来的には types に移動する

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
) -> Result<ProjectResponse, String> {
    println!("create_project called");
    println!("project: {:?}", project);

    let project_service = ProjectService;
    let mut repositories = get_repositories();

    match project_service.create_project(&mut repositories, &project).await {
        Ok(created_project) => {
            Ok(ProjectResponse {
                success: true,
                data: Some(created_project),
                message: Some("Project created successfully".to_string()),
            })
        }
        Err(service_error) => {
            Ok(ProjectResponse {
                success: false,
                data: None,
                message: Some(service_error.to_string()),
            })
        }
    }
}

// プロジェクト取得
#[tauri::command]
pub async fn get_project(
    project_id: String,
) -> Result<ProjectResponse, String> {
    println!("get_project called");
    println!("project_id: {:?}", project_id);

    let project_service = ProjectService;
    let repository = get_repository_searcher();

    match project_service.get_project(&*repository, &project_id).await {
        Ok(project) => {
            Ok(ProjectResponse {
                success: true,
                data: project,
                message: Some("Project retrieved successfully".to_string()),
            })
        }
        Err(service_error) => {
            Ok(ProjectResponse {
                success: false,
                data: None,
                message: Some(service_error.to_string()),
            })
        }
    }
}

// プロジェクト一覧取得
#[tauri::command]
pub async fn list_projects() -> Result<ProjectSearchResponse, String> {
    println!("list_projects called");

    let project_service = ProjectService;
    let repository = get_repository_searcher();

    match project_service.list_projects(&*repository).await {
        Ok(projects) => {
            let total_count = projects.len();
            Ok(ProjectSearchResponse {
                success: true,
                data: projects,
                total_count: Some(total_count),
                message: Some("Projects retrieved successfully".to_string()),
            })
        }
        Err(service_error) => {
            Ok(ProjectSearchResponse {
                success: false,
                data: vec![],
                total_count: Some(0),
                message: Some(service_error.to_string()),
            })
        },
    }
}

// プロジェクト更新
#[tauri::command]
pub async fn update_project(
    project: Project,
) -> Result<ProjectResponse, String> {
    println!("update_project called");
    println!("project: {:?}", project);

    let project_service = ProjectService;
    let mut repositories = get_repositories();

    match project_service.update_project(&mut repositories, &project).await {
        Ok(updated_project) => {
            Ok(ProjectResponse {
                success: true,
                data: Some(updated_project),
                message: Some("Project updated successfully".to_string()),
            })
        }
        Err(service_error) => {
            Ok(ProjectResponse {
                success: false,
                data: None,
                message: Some(service_error.to_string()),
            })
        }
    }
}

// プロジェクト削除
#[tauri::command]
pub async fn delete_project(
    project_id: String,
) -> Result<ProjectDeleteResponse, String> {
    println!("delete_project called");
    println!("project_id: {:?}", project_id);

    let project_service = ProjectService;
    let mut repositories = get_repositories();

    match project_service.delete_project(&mut repositories, &project_id).await {
        Ok(_) => Ok(ProjectDeleteResponse {
            success: true,
            message: Some("Project deleted successfully".to_string()),
        }),
        Err(service_error) => Ok(ProjectDeleteResponse {
            success: false,
            message: Some(service_error.to_string()),
        }),
    }
}

// プロジェクト検索（構造体版）
#[tauri::command]
pub async fn search_projects(
    request: ProjectSearchRequest,
) -> Result<ProjectSearchResponse, String> {
    println!("search_projects called");
    println!("request: {:?}", request);

    let project_service = ProjectService;
    let repository = get_repository_searcher();

    match project_service.search_projects(&*repository, &request).await {
        Ok((projects, total_count)) => {
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
) -> Result<ProjectDeleteResponse, String> {
    println!("delete_project_by_request called");
    println!("request: {:?}", request);
    
    delete_project(request.project_id).await
}