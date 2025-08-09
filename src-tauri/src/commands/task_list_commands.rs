use serde::{Serialize, Deserialize};
use crate::types::task_types::TaskList;

#[derive(Debug, Serialize, Deserialize)]
pub struct TaskListSearchRequest {
    pub project_id: Option<String>,
    pub name: Option<String>,
    pub created_from: Option<String>,
    pub created_to: Option<String>,
    pub limit: Option<usize>,
    pub offset: Option<usize>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TaskListDeleteRequest {
    pub task_list_id: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TaskListSearchResponse {
    pub success: bool,
    pub data: Vec<TaskList>,
    pub total_count: Option<usize>,
    pub message: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TaskListDeleteResponse {
    pub success: bool,
    pub message: Option<String>,
}

#[tauri::command]
pub fn create_task_list(
    task_list: TaskList,
) -> Result<TaskList, String> {
    println!("create_task_list called");
    println!("task_list: {:?}", task_list);

    Ok(task_list)
}

#[tauri::command]
pub fn update_task_list(
    task_list: TaskList,
) -> Result<TaskList, String> {
    println!("update_task_list called");
    println!("task_list: {:?}", task_list);

    Ok(task_list)
}

#[tauri::command]
pub fn delete_task_list(
    task_list_id: String,
) -> Result<bool, String> {
    println!("delete_task_list called");
    println!("task_list_id: {}", task_list_id);
    Ok(true)
}

// タスクリスト検索（構造体版）
#[tauri::command]
pub fn search_task_lists(
    request: TaskListSearchRequest,
) -> Result<TaskListSearchResponse, String> {
    println!("search_task_lists called");
    println!("request: {:?}", request);

    // 現在は実装なしのため、空のレスポンスを返す
    // 実際にはサービス層を通してデータを取得する実装が必要
    let task_lists: Vec<TaskList> = vec![];

    Ok(TaskListSearchResponse {
        success: true,
        data: task_lists,
        total_count: Some(0),
        message: Some("TaskLists retrieved successfully (not implemented yet)".to_string()),
    })
}

// タスクリスト削除（構造体版）
#[tauri::command]
pub fn delete_task_list_by_request(
    request: TaskListDeleteRequest,
) -> Result<TaskListDeleteResponse, String> {
    println!("delete_task_list_by_request called");
    println!("request: {:?}", request);

    // 現在は実装なしのため、成功レスポンスを返す
    // 実際にはサービス層を通してデータを削除する実装が必要
    Ok(TaskListDeleteResponse {
        success: true,
        message: Some("TaskList deleted successfully (not implemented yet)".to_string()),
    })
}
