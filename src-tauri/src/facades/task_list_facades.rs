use crate::models::search_request_models::TaskListSearchRequest;
use crate::models::task_list_models::TaskList;

pub fn create_task_list(task_list: &TaskList) -> Result<bool, String> {
    // 実際にはサービス層を通してデータを作成する実装が必要
    Ok(true)
}

pub fn get_task_list(id: &str) -> Result<Option<TaskList>, String> {
    // 実際にはサービス層を通してデータを取得する実装が必要
    Ok(None)
}

pub fn update_task_list(task_list: &TaskList) -> Result<bool, String> {
    // 実際にはサービス層を通してデータを更新する実装が必要
    Ok(true)
}

pub fn delete_task_list(id: &str) -> Result<bool, String> {
    // 実際にはサービス層を通してデータを削除する実装が必要
    Ok(true)
}

pub fn search_task_lists(condition: &TaskListSearchRequest) -> Result<Vec<TaskList>, String> {
    // 実際にはサービス層を通してデータを検索する実装が必要
    Ok(vec![])
}