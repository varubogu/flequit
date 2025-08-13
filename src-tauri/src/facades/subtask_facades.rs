use log::info;

use crate::models::command::subtask::{SubtaskCommand, SubtaskSearchRequest};

pub async fn create_sub_task(subtask: &SubtaskCommand) -> Result<bool, String> {
    // SubtaskServiceのcreate_subtaskはproject_idが必要だが、facadeのインターフェースではサブタスクのみ
    info!("get_setting called with account: {:?}", subtask);
    Ok(true)
}

pub async fn get_sub_task(id: &str) -> Result<Option<SubtaskCommand>, String> {
    // SubtaskServiceのget_subtaskはproject_idとtask_idが必要だが、facadeのインターフェースではidのみ
    info!("get_setting called with account: {:?}", id);
    Ok(Option::from(None))
}

pub async fn update_sub_task(subtask: &SubtaskCommand) -> Result<bool, String> {
    // SubtaskServiceのupdate_subtaskはproject_idが必要だが、facadeのインターフェースではサブタスクのみ
    info!("get_setting called with account: {:?}", subtask);
    Ok(true)
}

pub async fn delete_sub_task(id: &str) -> Result<bool, String> {
    // SubtaskServiceのdelete_subtaskはproject_idとtask_idが必要だが、facadeのインターフェースではidのみ
    info!("get_setting called with account: {:?}", id);
    Ok(true)
}

pub async fn search_sub_tasks(condition: &SubtaskSearchRequest) -> Result<Vec<SubtaskCommand>, String> {
    // SubtaskServiceにはsearchメソッドがないため、一時的に空の結果を返す
    info!("get_setting called with account: {:?}", condition);
    Ok(vec![])
}
