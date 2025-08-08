use serde::{Serialize, Deserialize};
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
) -> Result<ProjectResponse, String> {
    println!("bulk_commands called");
    println!("request: {:?}", request);
    let res = ProjectResponse {
        success: todo!(),
        data: todo!(),
        message: todo!()
    };
    Ok(res)
}

// プロジェクト取得
#[tauri::command]
pub async fn get_project(
    project_id: String,
) -> Result<ProjectResponse, String> {
    println!("bulk_commands called");
    println!("project_id: {:?}", project_id);
    let res = ProjectResponse {
        success: todo!(),
        data: todo!(),
        message: todo!()
    };
    Ok(res)
}

// プロジェクト一覧取得
#[tauri::command]
pub async fn list_projects(
) -> Result<Vec<Project>, String> {
    println!("bulk_commands called");
    Ok(vec![])
}

// プロジェクト更新
#[tauri::command]
pub async fn update_project(
    project_id: String,
    name: Option<String>,
    description: Option<String>,
    status: Option<ProjectStatus>,
) -> Result<ProjectResponse, String> {
    println!("bulk_commands called");
    println!("project_id: {:?}", project_id);
    let res = ProjectResponse {
        success: todo!(),
        data: todo!(),
        message: todo!()
    };
    Ok(res)
}

// プロジェクト削除
#[tauri::command]
pub async fn delete_project(
    project_id: String,
) -> Result<bool, String> {
    println!("bulk_commands called");
    println!("project_id: {:?}", project_id);
    Ok(true)
}
