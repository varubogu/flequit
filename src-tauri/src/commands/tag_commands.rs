use crate::types::task_types::Tag;
use crate::types::command_types::TagSearchRequest;

#[tauri::command]
pub async fn create_tag(tag: Tag) -> Result<bool, String> {
    println!("create_tag called");
    println!("tag: {:?}", tag);
    
    // 現在は実装なしのため、trueを返す
    // 実際にはサービス層を通してデータを作成する実装が必要
    Ok(true)
}

#[tauri::command]
pub async fn get_tag(id: String) -> Result<Option<Tag>, String> {
    println!("get_tag called");
    println!("id: {}", id);
    
    // 現在は実装なしのため、Noneを返す
    // 実際にはサービス層を通してデータを取得する実装が必要
    Ok(None)
}

#[tauri::command]
pub async fn update_tag(tag: Tag) -> Result<bool, String> {
    println!("update_tag called");
    println!("tag: {:?}", tag);
    
    // 現在は実装なしのため、trueを返す
    // 実際にはサービス層を通してデータを更新する実装が必要
    Ok(true)
}

#[tauri::command]
pub async fn delete_tag(id: String) -> Result<bool, String> {
    println!("delete_tag called");
    println!("id: {}", id);
    
    // 現在は実装なしのため、trueを返す
    // 実際にはサービス層を通してデータを削除する実装が必要
    Ok(true)
}

#[tauri::command]
pub async fn search_tags(condition: TagSearchRequest) -> Result<Vec<Tag>, String> {
    println!("search_tags called");
    println!("condition: {:?}", condition);
    
    // 現在は実装なしのため、空のベクタを返す
    // 実際にはサービス層を通してデータを検索する実装が必要
    Ok(vec![])
}