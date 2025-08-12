use crate::models::sub_task_models::Subtask;
use crate::types::task_types::TaskStatus;

#[derive(Debug)]
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

pub async fn create_subtask(subtask: &Subtask) -> Result<bool, String> {
    // 実際にはサービス層を通してデータを作成する実装が必要
    Ok(true)
}

pub async fn get_subtask(id: &str) -> Result<Option<Subtask>, String> {
    // 実際にはサービス層を通してデータを取得する実装が必要
    Ok(None)
}

pub async fn update_subtask(subtask: &Subtask) -> Result<bool, String> {
    // 実際にはサービス層を通してデータを更新する実装が必要
    Ok(true)
}

pub async fn delete_subtask(id: &str) -> Result<bool, String> {
    // 実際にはサービス層を通してデータを削除する実装が必要
    Ok(true)
}

pub async fn search_subtasks(condition: &SubtaskSearchRequest) -> Result<Vec<Subtask>, String> {
    // 実際にはサービス層を通してデータを検索する実装が必要
    Ok(vec![])
}