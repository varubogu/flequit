use crate::models::user_preferences::TagBookmarkCommandModel;
use crate::state::AppState;
use flequit_core::services::tag_bookmark_service;
use flequit_infrastructure::InfrastructureRepositoriesTrait;
use flequit_model::models::user_preferences::tag_bookmark::TagBookmark;
use flequit_model::types::id_types::{ProjectId, TagBookmarkId, TagId, UserId};
use tauri::State;

/// TagBookmarkをコマンドモデルに変換
fn to_command_model(bookmark: TagBookmark) -> TagBookmarkCommandModel {
    TagBookmarkCommandModel {
        id: bookmark.id.to_string(),
        user_id: bookmark.user_id.to_string(),
        project_id: bookmark.project_id.to_string(),
        tag_id: bookmark.tag_id.to_string(),
        order_index: bookmark.order_index,
        created_at: bookmark.created_at,
        updated_at: bookmark.updated_at,
    }
}

/// ブックマークを作成
#[tauri::command]
pub async fn create_tag_bookmark(
    user_id: String,
    project_id: String,
    tag_id: String,
    state: State<'_, AppState>,
) -> Result<TagBookmarkCommandModel, String> {
    println!("[Tauri] create_tag_bookmark called - user_id: {}, project_id: {}, tag_id: {}", user_id, project_id, tag_id);

    let repos_lock = state.repositories.read().await;
    let repos = &*repos_lock;
    let user_id = UserId::from(user_id);
    let project_id = ProjectId::from(project_id);
    let tag_id = TagId::from(tag_id);

    // 新しいブックマークを作成
    let bookmark_id = TagBookmarkId::new();
    let now = chrono::Utc::now();

    println!("[Tauri] Getting max order index...");
    // order_indexを取得
    let max_order = repos
        .tag_bookmarks_sqlite()
        .get_max_order_index(&user_id, &project_id)
        .await
        .map_err(|e| {
            println!("[Tauri] Error getting max order index: {}", e);
            e.to_string()
        })?;

    println!("[Tauri] Max order: {}, new order will be: {}", max_order, max_order + 1);

    let bookmark = TagBookmark {
        id: bookmark_id,
        user_id,
        project_id,
        tag_id,
        order_index: max_order + 1,
        created_at: now,
        updated_at: now,
    };

    println!("[Tauri] Calling tag_bookmark_service::create_bookmark...");
    tag_bookmark_service::create_bookmark(repos, &bookmark)
        .await
        .map_err(|e| {
            println!("[Tauri] Error creating bookmark: {}", e);
            e.to_string()
        })?;

    println!("[Tauri] Bookmark created successfully, returning model");
    Ok(to_command_model(bookmark))
}

/// プロジェクトのブックマーク一覧を取得
#[tauri::command]
pub async fn list_tag_bookmarks_by_project(
    user_id: String,
    project_id: String,
    state: State<'_, AppState>,
) -> Result<Vec<TagBookmarkCommandModel>, String> {
    println!("[Tauri] list_tag_bookmarks_by_project called - user_id: {}, project_id: {}", user_id, project_id);

    let repos_lock = state.repositories.read().await;
    let repos = &*repos_lock;
    let user_id = UserId::from(user_id);
    let project_id = ProjectId::from(project_id);

    let bookmarks = tag_bookmark_service::list_bookmarks_by_user_and_project(
        repos,
        &user_id,
        &project_id,
    )
    .await
    .map_err(|e| e.to_string())?;

    Ok(bookmarks.into_iter().map(to_command_model).collect())
}

/// ユーザーの全ブックマークを取得
#[tauri::command]
pub async fn list_tag_bookmarks_by_user(
    user_id: String,
    state: State<'_, AppState>,
) -> Result<Vec<TagBookmarkCommandModel>, String> {
    println!("[Tauri] list_tag_bookmarks_by_user called - user_id: {}", user_id);

    let repos_lock = state.repositories.read().await;
    let repos = &*repos_lock;
    let user_id = UserId::from(user_id);

    let bookmarks = tag_bookmark_service::list_bookmarks_by_user(repos, &user_id)
        .await
        .map_err(|e| {
            println!("[Tauri] Error listing bookmarks: {}", e);
            e.to_string()
        })?;

    println!("[Tauri] Found {} bookmarks", bookmarks.len());
    Ok(bookmarks.into_iter().map(to_command_model).collect())
}

/// ブックマークを更新
#[tauri::command]
pub async fn update_tag_bookmark(
    bookmark_id: String,
    order_index: i32,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let repos_lock = state.repositories.read().await;
    let repos = &*repos_lock;
    let bookmark_id = TagBookmarkId::from(bookmark_id);

    // bookmark_idからブックマークを探す
    // まずuser_id, project_id, tag_idを取得する必要があるため、SQLiteから検索
    let bookmark = repos
        .tag_bookmarks_sqlite()
        .find_by_id(&bookmark_id)
        .await
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "Bookmark not found".to_string())?;

    let mut updated_bookmark = bookmark.clone();
    updated_bookmark.order_index = order_index;
    updated_bookmark.updated_at = chrono::Utc::now();

    tag_bookmark_service::update_bookmark(repos, &updated_bookmark)
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}

/// ブックマークを削除
#[tauri::command]
pub async fn delete_tag_bookmark(
    bookmark_id: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    println!("[Tauri] delete_tag_bookmark called - bookmark_id: {}", bookmark_id);

    let repos_lock = state.repositories.read().await;
    let repos = &*repos_lock;
    let bookmark_id = TagBookmarkId::from(bookmark_id);

    // bookmark_idからブックマークを探してuser_id, project_id, tag_idを取得
    let bookmark = repos
        .tag_bookmarks_sqlite()
        .find_by_id(&bookmark_id)
        .await
        .map_err(|e| {
            println!("[Tauri] Error finding bookmark: {}", e);
            e.to_string()
        })?
        .ok_or_else(|| "Bookmark not found".to_string())?;

    println!("[Tauri] Found bookmark, deleting...");
    tag_bookmark_service::delete_bookmark(
        repos,
        &bookmark_id,
        &bookmark.user_id,
        &bookmark.project_id,
        &bookmark.tag_id,
    )
    .await
    .map_err(|e| {
        println!("[Tauri] Error deleting bookmark: {}", e);
        e.to_string()
    })?;

    println!("[Tauri] Bookmark deleted successfully");
    Ok(())
}

/// タグがブックマーク済みかチェック
#[tauri::command]
pub async fn is_tag_bookmarked(
    user_id: String,
    project_id: String,
    tag_id: String,
    state: State<'_, AppState>,
) -> Result<bool, String> {
    println!("[Tauri] is_tag_bookmarked called - user_id: {}, project_id: {}, tag_id: {}", user_id, project_id, tag_id);

    let repos_lock = state.repositories.read().await;
    let repos = &*repos_lock;
    let user_id = UserId::from(user_id);
    let project_id = ProjectId::from(project_id);
    let tag_id = TagId::from(tag_id);

    let is_bookmarked =
        tag_bookmark_service::is_bookmarked(repos, &user_id, &project_id, &tag_id)
            .await
            .map_err(|e| e.to_string())?;

    Ok(is_bookmarked)
}

/// ブックマークを並び替え
#[tauri::command]
pub async fn reorder_tag_bookmarks(
    user_id: String,
    project_id: String,
    from_index: i32,
    to_index: i32,
    state: State<'_, AppState>,
) -> Result<(), String> {
    println!("[Tauri] reorder_tag_bookmarks called - user_id: {}, project_id: {}, from: {}, to: {}", user_id, project_id, from_index, to_index);

    let repos_lock = state.repositories.read().await;
    let repos = &*repos_lock;
    let user_id = UserId::from(user_id);
    let project_id = ProjectId::from(project_id);

    tag_bookmark_service::reorder_bookmarks(repos, &user_id, &project_id, from_index, to_index)
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}
