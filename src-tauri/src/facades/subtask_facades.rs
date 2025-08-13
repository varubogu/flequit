use log::info;

use crate::models::search_request_models::SubtaskSearchRequest;
use crate::models::sub_task_models::Subtask;

pub async fn create_sub_task(subtask: &Subtask) -> Result<bool, String> {
    // 実際にはサービス層を通してデータを作成する実装が必要
    info!("create_sub_task called with account: {:?}", subtask);
    Ok(true)
}

pub async fn get_sub_task(id: &str) -> Result<Option<Subtask>, String> {
    // 実際にはサービス層を通してデータを取得する実装が必要
    info!("get_sub_task called with account: {:?}", id);
    Ok(None)
}

pub async fn update_sub_task(subtask: &Subtask) -> Result<bool, String> {
    // 実際にはサービス層を通してデータを更新する実装が必要
    info!("update_sub_task called with account: {:?}", subtask);
    Ok(true)
}

pub async fn delete_sub_task(id: &str) -> Result<bool, String> {
    // 実際にはサービス層を通してデータを削除する実装が必要
    info!("delete_sub_task called with account: {:?}", id);
    Ok(true)
}

pub async fn search_sub_tasks(condition: &SubtaskSearchRequest) -> Result<Vec<Subtask>, String> {
    // 実際にはサービス層を通してデータを検索する実装が必要
    info!("search_sub_tasks called with account: {:?}", condition);
    Ok(vec![])
}
