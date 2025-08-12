use serde::{Serialize, Deserialize};
use crate::types::task_types::{Subtask, TaskStatus};

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

// Frontend compatibility aliases only
#[tauri::command]
pub async fn create_sub_task(sub_task: Subtask) -> Result<bool, String> {
    println!("create_sub_task called");
    println!("sub_task: {:?}", sub_task);
    
    // 現在は実装なしのため、trueを返す
    // 実際にはサービス層を通してデータを作成する実装が必要
    Ok(true)
}

#[tauri::command]
pub async fn get_sub_task(id: String) -> Result<Option<Subtask>, String> {
    println!("get_sub_task called");
    println!("id: {}", id);
    
    // 現在は実装なしのため、Noneを返す
    // 実際にはサービス層を通してデータを取得する実装が必要
    Ok(None)
}

#[tauri::command]
pub async fn update_sub_task(sub_task: Subtask) -> Result<bool, String> {
    println!("update_sub_task called");
    println!("sub_task: {:?}", sub_task);
    
    // 現在は実装なしのため、trueを返す
    // 実際にはサービス層を通してデータを更新する実装が必要
    Ok(true)
}

#[tauri::command]
pub async fn delete_sub_task(id: String) -> Result<bool, String> {
    println!("delete_sub_task called");
    println!("id: {}", id);
    
    // 現在は実装なしのため、trueを返す
    // 実際にはサービス層を通してデータを削除する実装が必要
    Ok(true)
}

#[tauri::command]
pub async fn search_sub_tasks(condition: SubtaskSearchRequest) -> Result<Vec<Subtask>, String> {
    println!("search_sub_tasks called");
    println!("condition: {:?}", condition);
    
    // 現在は実装なしのため、空のベクタを返す
    // 実際にはサービス層を通してデータを検索する実装が必要
    Ok(vec![])
}