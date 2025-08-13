use log::info;

use crate::models::project_models::Project;
use crate::models::search_request_models::ProjectSearchRequest;

pub async fn create_project(project: &Project) -> Result<bool, String> {
    // 実際にはサービス層を通してデータを作成する実装が必要
    info!("create_project called with account: {:?}", project);
    Ok(true)
}

pub async fn get_project(id: &str) -> Result<Option<Project>, String> {
    // 実際にはサービス層を通してデータを取得する実装が必要
    info!("get_project called with account: {:?}", id);
    Ok(None)
}

pub async fn update_project(project: &Project) -> Result<bool, String> {
    // 実際にはサービス層を通してデータを更新する実装が必要
    info!("update_project called with account: {:?}", project);
    Ok(true)
}

pub async fn delete_project(id: &str) -> Result<bool, String> {
    // 実際にはサービス層を通してデータを削除する実装が必要
    info!("delete_project called with account: {:?}", id);
    Ok(true)
}

pub async fn search_projects(condition: &ProjectSearchRequest) -> Result<Vec<Project>, String> {
    // 実際にはサービス層を通してデータを検索する実装が必要
    info!("search_projects called with account: {:?}", condition);
    Ok(vec![])
}
