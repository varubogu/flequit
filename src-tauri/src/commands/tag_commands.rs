use serde::{Serialize, Deserialize};
use tauri::State;
use crate::types::task_types::Tag;
use crate::services::automerge::TagService;
use crate::repositories::automerge::TagRepository;
use uuid::Uuid;
use std::time::{SystemTime, UNIX_EPOCH};


#[derive(Debug, Serialize, Deserialize)]
pub struct TagResponse {
    pub success: bool,
    pub data: Option<Tag>,
    pub message: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TagSearchRequest {
    pub name: Option<String>,
    pub color: Option<String>,
    pub created_from: Option<String>,
    pub created_to: Option<String>,
    pub usage_count_min: Option<u32>,
    pub limit: Option<usize>,
    pub offset: Option<usize>,
    pub order_by_popularity: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TagDeleteRequest {
    pub tag_id: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TagSearchResponse {
    pub success: bool,
    pub data: Vec<Tag>,
    pub total_count: Option<usize>,
    pub message: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TagDeleteResponse {
    pub success: bool,
    pub message: Option<String>,
}

// タグ作成
#[tauri::command]
pub async fn create_tag(
    tag: Tag,
    tag_service: State<'_, TagService>,
    tag_repository: State<'_, TagRepository>,
) -> Result<TagResponse, String> {
    println!("create_tag called");
    println!("tag: {:?}", tag);

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
    tag: Tag,
    tag_service: State<'_, TagService>,
    tag_repository: State<'_, TagRepository>,
) -> Result<TagResponse, String> {
    println!("update_tag called");
    println!("tag: {:?}", tag);

    // サービス層を呼び出し
    match tag_service.update_tag(tag_repository, &tag).await {
        Ok(_) => {
            let res = TagResponse {
                success: true,
                data: Some(tag),
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

// タグ検索（構造体版）
#[tauri::command]
pub async fn search_tags(
    request: TagSearchRequest,
    tag_service: State<'_, TagService>,
    tag_repository: State<'_, TagRepository>,
) -> Result<TagSearchResponse, String> {
    println!("search_tags called");
    println!("request: {:?}", request);

    // 人気順検索か通常検索かで分岐
    let mut tags = if request.order_by_popularity.unwrap_or(false) {
        match tag_service.list_popular_tags(tag_repository, request.limit.unwrap_or(50) as u32).await {
            Ok(tags) => tags,
            Err(service_error) => return Ok(TagSearchResponse {
                success: false,
                data: vec![],
                total_count: Some(0),
                message: Some(service_error.to_string()),
            })
        }
    } else {
        match tag_service.list_tags(tag_repository).await {
            Ok(tags) => tags,
            Err(service_error) => return Ok(TagSearchResponse {
                success: false,
                data: vec![],
                total_count: Some(0),
                message: Some(service_error.to_string()),
            })
        }
    };

    // フィルタリング処理
    if let Some(ref name) = request.name {
        tags.retain(|tag| tag.name.to_lowercase().contains(&name.to_lowercase()));
    }
    if let Some(ref color) = request.color {
        tags.retain(|tag| tag.color.to_lowercase().contains(&color.to_lowercase()));
    }

    // ページネーション（人気順検索でない場合のみ適用）
    let total_count = tags.len();
    if !request.order_by_popularity.unwrap_or(false) {
        let offset = request.offset.unwrap_or(0);
        let limit = request.limit.unwrap_or(50);
        
        if offset < tags.len() {
            tags = tags.into_iter().skip(offset).take(limit).collect();
        } else {
            tags = vec![];
        }
    }

    Ok(TagSearchResponse {
        success: true,
        data: tags,
        total_count: Some(total_count),
        message: Some("Tags retrieved successfully".to_string()),
    })
}

// タグ削除（構造体版）
#[tauri::command]
pub async fn delete_tag_by_request(
    request: TagDeleteRequest,
    tag_service: State<'_, TagService>,
    tag_repository: State<'_, TagRepository>,
) -> Result<TagDeleteResponse, String> {
    println!("delete_tag_by_request called");
    println!("request: {:?}", request);

    // サービス層を呼び出し
    match tag_service.delete_tag(tag_repository, &request.tag_id).await {
        Ok(_) => Ok(TagDeleteResponse {
            success: true,
            message: Some("Tag deleted successfully".to_string()),
        }),
        Err(service_error) => Ok(TagDeleteResponse {
            success: false,
            message: Some(service_error.to_string()),
        })
    }
}
