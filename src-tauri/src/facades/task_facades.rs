use crate::models::search_request_models::TaskSearchRequest;
use crate::models::task_models::Task;

pub async fn create_task(task: &Task) -> Result<bool, String> {
    // 実際にはサービス層を通してデータを作成する実装が必要
    Ok(true)
}

pub async fn get_task(id: &str) -> Result<Option<Task>, String> {
    // 実際にはサービス層を通してデータを取得する実装が必要
    Ok(None)
}

pub async fn update_task(task: &Task) -> Result<bool, String> {
    // 実際にはサービス層を通してデータを更新する実装が必要
    Ok(true)
}

pub async fn delete_task(id: &str) -> Result<bool, String> {
    // 実際にはサービス層を通してデータを削除する実装が必要
    Ok(true)
}

pub async fn search_tasks(condition: &TaskSearchRequest) -> Result<Vec<Task>, String> {
    // 実際にはサービス層を通してデータを検索する実装が必要
    Ok(vec![])
}