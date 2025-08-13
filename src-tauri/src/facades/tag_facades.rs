use crate::models::search_request_models::TagSearchRequest;
use crate::models::tag_models::Tag;

pub async fn create_tag(tag: &Tag) -> Result<bool, String> {
    // 実際にはサービス層を通してデータを作成する実装が必要
    Ok(true)
}

pub async fn get_tag(id: &str) -> Result<Option<Tag>, String> {
    // 実際にはサービス層を通してデータを取得する実装が必要
    Ok(None)
}

pub async fn update_tag(tag: &Tag) -> Result<bool, String> {
    // 実際にはサービス層を通してデータを更新する実装が必要
    Ok(true)
}

pub async fn delete_tag(id: &str) -> Result<bool, String> {
    // 実際にはサービス層を通してデータを削除する実装が必要
    Ok(true)
}

pub async fn search_tags(condition: &TagSearchRequest) -> Result<Vec<Tag>, String> {
    // 実際にはサービス層を通してデータを検索する実装が必要
    Ok(vec![])
}