use log::info;

use crate::models::search_request_models::TaskListSearchRequest;
use crate::models::task_list_models::TaskList;

pub fn create_task_list(task_list: &TaskList) -> Result<bool, String> {
    // 実際にはサービス層を通してデータを作成する実装が必要
    info!("create_task_list called with account: {:?}", task_list);
    Ok(true)
}

pub fn get_task_list(id: &str) -> Result<Option<TaskList>, String> {
    // 実際にはサービス層を通してデータを取得する実装が必要
    info!("get_task_list called with account: {:?}", id);
    Ok(None)
}

pub fn update_task_list(task_list: &TaskList) -> Result<bool, String> {
    // 実際にはサービス層を通してデータを更新する実装が必要
    info!("update_task_list called with account: {:?}", task_list);
    Ok(true)
}

pub fn delete_task_list(id: &str) -> Result<bool, String> {
    // 実際にはサービス層を通してデータを削除する実装が必要
    info!("delete_task_list called with account: {:?}", id);
    Ok(true)
}

pub fn search_task_lists(condition: &TaskListSearchRequest) -> Result<Vec<TaskList>, String> {
    // 実際にはサービス層を通してデータを検索する実装が必要
    info!("search_task_lists called with account: {:?}", condition);
    Ok(vec![])
}
