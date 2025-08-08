use serde::{Serialize, Deserialize};
use tauri::State;
use crate::types::user_types::Tag;
use crate::services::automerge::TagService;
use crate::repositories::automerge::TagRepository;
use uuid::Uuid;
use std::time::{SystemTime, UNIX_EPOCH};

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateTagRequest {
    pub name: String,
    pub color: Option<String>,
    pub description: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TagResponse {
    pub success: bool,
    pub data: Option<Tag>,
    pub message: Option<String>,
}

// タグ作成
#[tauri::command]
pub async fn create_tag(
    request: CreateTagRequest,
    tag_service: State<'_, TagService>,
    tag_repository: State<'_, TagRepository>,
) -> Result<TagResponse, String> {
    println!("create_tag called");
    println!("request: {:?}", request);

    // コマンド引数をservice形式に変換
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs() as i64;

    let tag = Tag {
        id:Uuid::new_v4().to_string(),
        name: request.name,
        color: request.color,
        created_at: now,
        updated_at: now,
        order_index: todo!()
    };

    // サービス層を呼び出し
    match tag_service.create_tag(tag_repository, &tag).await {
        Ok(_) => {
            let res = TagResponse {
                success: true,
                data: Some(tag),
                message: Some("Tag created successfully".to_string()),
            };
            Ok(res)
        }
        Err(service_error) => {
            let res = TagResponse {
                success: false,
                data: None,
                message: Some(service_error.to_string()),
            };
            Ok(res)
        }
    }
}

// タグ取得
#[tauri::command]
pub async fn get_tag(
    tag_id: String,
    tag_service: State<'_, TagService>,
    tag_repository: State<'_, TagRepository>,
) -> Result<TagResponse, String> {
    println!("get_tag called");
    println!("tag_id: {:?}", tag_id);

    // サービス層を呼び出し
    match tag_service.get_tag(tag_repository, &tag_id).await {
        Ok(tag) => {
            let res = TagResponse {
                success: true,
                data: tag,
                message: Some("Tag retrieved successfully".to_string()),
            };
            Ok(res)
        }
        Err(service_error) => {
            let res = TagResponse {
                success: false,
                data: None,
                message: Some(service_error.to_string()),
            };
            Ok(res)
        }
    }
}

// タグ一覧取得
#[tauri::command]
pub async fn list_tags(
    tag_service: State<'_, TagService>,
    tag_repository: State<'_, TagRepository>,
) -> Result<Vec<Tag>, String> {
    println!("list_tags called");

    // サービス層を呼び出し
    match tag_service.list_tags(tag_repository).await {
        Ok(tags) => Ok(tags),
        Err(service_error) => Err(service_error.to_string()),
    }
}

// タグ更新
#[tauri::command]
pub async fn update_tag(
    tag_id: String,
    name: Option<String>,
    color: Option<String>,
    tag_service: State<'_, TagService>,
    tag_repository: State<'_, TagRepository>,
) -> Result<TagResponse, String> {
    println!("update_tag called");
    println!("tag_id: {:?}", tag_id);

    // 既存のタグを取得
    match tag_service.get_tag(tag_repository.clone(), &tag_id).await {
        Ok(Some(mut existing_tag)) => {
            // コマンド引数をservice形式に変換
            if let Some(name) = name {
                existing_tag.name = name;
            }
            if let Some(color) = color {
                existing_tag.color = Some(color);
            }

            let now = SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_secs() as i64;
            existing_tag.updated_at = now;

            // サービス層を呼び出し
            match tag_service.update_tag(tag_repository, &existing_tag).await {
                Ok(_) => {
                    let res = TagResponse {
                        success: true,
                        data: Some(existing_tag),
                        message: Some("Tag updated successfully".to_string()),
                    };
                    Ok(res)
                }
                Err(service_error) => {
                    let res = TagResponse {
                        success: false,
                        data: None,
                        message: Some(service_error.to_string()),
                    };
                    Ok(res)
                }
            }
        }
        Ok(None) => {
            let res = TagResponse {
                success: false,
                data: None,
                message: Some("Tag not found".to_string()),
            };
            Ok(res)
        }
        Err(service_error) => {
            let res = TagResponse {
                success: false,
                data: None,
                message: Some(service_error.to_string()),
            };
            Ok(res)
        }
    }
}

// タグ削除
#[tauri::command]
pub async fn delete_tag(
    tag_id: String,
    tag_service: State<'_, TagService>,
    tag_repository: State<'_, TagRepository>,
) -> Result<bool, String> {
    println!("delete_tag called");
    println!("tag_id: {:?}", tag_id);

    // サービス層を呼び出し
    match tag_service.delete_tag(tag_repository, &tag_id).await {
        Ok(_) => Ok(true),
        Err(service_error) => Err(service_error.to_string()),
    }
}

// タグ検索（名前による）
#[tauri::command]
pub async fn search_tags_by_name(
    name: String,
    limit: Option<usize>,
    tag_service: State<'_, TagService>,
    tag_repository: State<'_, TagRepository>,
) -> Result<Vec<Tag>, String> {
    println!("search_tags_by_name called");
    println!("name: {:?}, limit: {:?}", name, limit);

    // サービス層を呼び出し
    match tag_service.search_tags_by_name(tag_repository, &name, limit.unwrap_or(50)).await {
        Ok(tags) => Ok(tags),
        Err(service_error) => Err(service_error.to_string()),
    }
}

// タグの使用頻度取得
#[tauri::command]
pub async fn get_tag_usage_count(
    tag_id: String,
    tag_service: State<'_, TagService>,
    tag_repository: State<'_, TagRepository>,
) -> Result<usize, String> {
    println!("get_tag_usage_count called");
    println!("tag_id: {:?}", tag_id);

    // サービス層を呼び出し
    match tag_service.get_tag_usage_count(tag_repository, &tag_id).await {
        Ok(count) => Ok(count.try_into().unwrap()),
        Err(service_error) => Err(service_error.to_string()),
    }
}

// タグ名の重複チェック
#[tauri::command]
pub async fn check_tag_name_exists(
    name: String,
    exclude_id: Option<String>,
    tag_service: State<'_, TagService>,
    tag_repository: State<'_, TagRepository>,
) -> Result<bool, String> {
    println!("check_tag_name_exists called");
    println!("name: {:?}, exclude_id: {:?}", name, exclude_id);

    // サービス層を呼び出し
    match tag_service.is_tag_name_exists(tag_repository, &name, exclude_id.as_deref()).await {
        Ok(exists) => Ok(exists),
        Err(service_error) => Err(service_error.to_string()),
    }
}

// 人気タグ一覧取得（使用頻度順）
#[tauri::command]
pub async fn list_popular_tags(
    limit: Option<u32>,
    tag_service: State<'_, TagService>,
    tag_repository: State<'_, TagRepository>,
) -> Result<Vec<Tag>, String> {
    println!("list_popular_tags called");
    println!("limit: {:?}", limit);

    // サービス層を呼び出し
    match tag_service.list_popular_tags(tag_repository, limit.unwrap_or(20)).await {
        Ok(tags) => Ok(tags),
        Err(service_error) => Err(service_error.to_string()),
    }
}
