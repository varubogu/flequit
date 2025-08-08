use serde::{Serialize, Deserialize};
use tauri::State;
use crate::types::{Project, ProjectStatus};
use crate::services::automerge::ProjectService;
use crate::repositories::automerge::ProjectRepository;

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
    project_service: State<'_, ProjectService>,
) -> Result<ProjectResponse, String> {
    println!("create_project called");
    println!("request: {:?}", request);

    // let result = project_service.create_project(project_repository, &project).await;

    // TODO: サービスを使用してプロジェクト作成処理を実装
    let res = ProjectResponse {
        success: true,
        data: None,
        message: Some("Tauri State with Repository DI - implementation pending".to_string())
    };
    Ok(res)
}

// プロジェクト取得
#[tauri::command]
pub async fn get_project(
    project_id: String,
    project_service: State<'_, ProjectService>,
) -> Result<ProjectResponse, String> {
    println!("get_project called");
    println!("project_id: {:?}", project_id);

    // let result = project_service.get_project(project_repository, &project_id).await;

    let res = ProjectResponse {
        success: true,
        data: None,
        message: Some("Tauri State with Repository DI - implementation pending".to_string())
    };
    Ok(res)
}

// プロジェクト一覧取得
#[tauri::command]
pub async fn list_projects(
    project_service: State<'_, ProjectService>,
) -> Result<Vec<Project>, String> {
    println!("list_projects called");

    // let result = project_service.list_projects(project_repository).await;

    // TODO: サービスを使用してプロジェクト一覧取得処理を実装
    Ok(vec![])
}

// プロジェクト更新
#[tauri::command]
pub async fn update_project(
    project_id: String,
    _name: Option<String>,
    _description: Option<String>,
    _status: Option<ProjectStatus>,
    project_service: State<'_, ProjectService>,
) -> Result<ProjectResponse, String> {
    println!("update_project called");
    println!("project_id: {:?}", project_id);

    // let result = project_service.update_project(project_repository, &updated_project).await;

    let res = ProjectResponse {
        success: true,
        data: None,
        message: Some("Tauri State with Repository DI - implementation pending".to_string())
    };
    Ok(res)
}

// プロジェクト削除
#[tauri::command]
pub async fn delete_project(
    project_id: String,
    project_service: State<'_, ProjectService>,
) -> Result<bool, String> {
    println!("delete_project called");
    println!("project_id: {:?}", project_id);

    // let result = project_service.delete_project(project_repository, &project_id).await;

    // TODO: サービスを使用してプロジェクト削除処理を実装
    Ok(true)
}
