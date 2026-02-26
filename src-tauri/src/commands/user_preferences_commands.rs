use crate::models::user_preferences::TagBookmarkCommandModel;
use crate::state::AppState;
use flequit_core::services::tag_bookmark_service;
use flequit_core::InfrastructureRepositoriesTrait;
use flequit_model::models::user_preferences::tag_bookmark::TagBookmark;
use flequit_model::types::id_types::{ProjectId, TagBookmarkId, TagId, UserId};
use tauri::State;
use tracing::instrument;

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
#[instrument(level = "info", skip(state), fields(user_id = %user_id, project_id = %project_id, tag_id = %tag_id))]
#[tauri::command]
pub async fn create_tag_bookmark(
    user_id: String,
    project_id: String,
    tag_id: String,
    state: State<'_, AppState>,
) -> Result<TagBookmarkCommandModel, String> {
    let repos_lock = state.repositories.read().await;
    let repos = &*repos_lock;
    let user_id = UserId::from(user_id);
    let project_id = ProjectId::from(project_id);
    let tag_id = TagId::from(tag_id);

    // 新しいブックマークを作成
    let bookmark_id = TagBookmarkId::new();
    let now = chrono::Utc::now();

    // order_indexを取得
    let max_order = repos
        .tag_bookmarks_sqlite()
        .get_max_order_index(&user_id, &project_id)
        .await
        .map_err(|e| {
            tracing::error!(target: "commands::user_preferences", command = "create_tag_bookmark", error = %e);
            e.to_string()
        })?;

    let bookmark = TagBookmark {
        id: bookmark_id,
        user_id,
        project_id,
        tag_id,
        order_index: max_order + 1,
        created_at: now,
        updated_at: now,
    };

    tag_bookmark_service::create_bookmark(repos, &bookmark)
        .await
        .map_err(|e| {
            tracing::error!(target: "commands::user_preferences", command = "create_tag_bookmark", error = %e);
            e.to_string()
        })?;

    Ok(to_command_model(bookmark))
}

/// プロジェクトのブックマーク一覧を取得
#[instrument(level = "info", skip(state), fields(user_id = %user_id, project_id = %project_id))]
#[tauri::command]
pub async fn list_tag_bookmarks_by_project(
    user_id: String,
    project_id: String,
    state: State<'_, AppState>,
) -> Result<Vec<TagBookmarkCommandModel>, String> {
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
    .map_err(|e| {
        tracing::error!(target: "commands::user_preferences", command = "list_tag_bookmarks_by_project", error = %e);
        e.to_string()
    })?;

    Ok(bookmarks.into_iter().map(to_command_model).collect())
}

/// ユーザーの全ブックマークを取得
#[instrument(level = "info", skip(state), fields(user_id = %user_id))]
#[tauri::command]
pub async fn list_tag_bookmarks_by_user(
    user_id: String,
    state: State<'_, AppState>,
) -> Result<Vec<TagBookmarkCommandModel>, String> {
    let repos_lock = state.repositories.read().await;
    let repos = &*repos_lock;
    let user_id = UserId::from(user_id);

    let bookmarks = tag_bookmark_service::list_bookmarks_by_user(repos, &user_id)
        .await
        .map_err(|e| {
            tracing::error!(target: "commands::user_preferences", command = "list_tag_bookmarks_by_user", error = %e);
            e.to_string()
        })?;

    Ok(bookmarks.into_iter().map(to_command_model).collect())
}

/// ブックマークを更新
#[instrument(level = "info", skip(state), fields(bookmark_id = %bookmark_id))]
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
        .map_err(|e| {
            tracing::error!(target: "commands::user_preferences", command = "update_tag_bookmark", bookmark_id = %bookmark_id, error = %e);
            e.to_string()
        })?
        .ok_or_else(|| "Bookmark not found".to_string())?;

    let mut updated_bookmark = bookmark.clone();
    updated_bookmark.order_index = order_index;
    updated_bookmark.updated_at = chrono::Utc::now();

    tag_bookmark_service::update_bookmark(repos, &updated_bookmark)
        .await
        .map_err(|e| {
            tracing::error!(target: "commands::user_preferences", command = "update_tag_bookmark", bookmark_id = %bookmark_id, error = %e);
            e.to_string()
        })?;

    Ok(())
}

/// ブックマークを削除
#[instrument(level = "info", skip(state), fields(bookmark_id = %bookmark_id))]
#[tauri::command]
pub async fn delete_tag_bookmark(
    bookmark_id: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let repos_lock = state.repositories.read().await;
    let repos = &*repos_lock;
    let bookmark_id = TagBookmarkId::from(bookmark_id);

    // bookmark_idからブックマークを探してuser_id, project_id, tag_idを取得
    let bookmark = repos
        .tag_bookmarks_sqlite()
        .find_by_id(&bookmark_id)
        .await
        .map_err(|e| {
            tracing::error!(target: "commands::user_preferences", command = "delete_tag_bookmark", bookmark_id = %bookmark_id, error = %e);
            e.to_string()
        })?
        .ok_or_else(|| "Bookmark not found".to_string())?;

    tag_bookmark_service::delete_bookmark(
        repos,
        &bookmark_id,
        &bookmark.user_id,
        &bookmark.project_id,
        &bookmark.tag_id,
    )
    .await
    .map_err(|e| {
        tracing::error!(target: "commands::user_preferences", command = "delete_tag_bookmark", bookmark_id = %bookmark_id, error = %e);
        e.to_string()
    })?;

    Ok(())
}

/// タグがブックマーク済みかチェック
#[instrument(level = "info", skip(state), fields(user_id = %user_id, project_id = %project_id, tag_id = %tag_id))]
#[tauri::command]
pub async fn is_tag_bookmarked(
    user_id: String,
    project_id: String,
    tag_id: String,
    state: State<'_, AppState>,
) -> Result<bool, String> {
    let repos_lock = state.repositories.read().await;
    let repos = &*repos_lock;
    let user_id = UserId::from(user_id);
    let project_id = ProjectId::from(project_id);
    let tag_id = TagId::from(tag_id);

    let is_bookmarked =
        tag_bookmark_service::is_bookmarked(repos, &user_id, &project_id, &tag_id)
            .await
            .map_err(|e| {
                tracing::error!(target: "commands::user_preferences", command = "is_tag_bookmarked", error = %e);
                e.to_string()
            })?;

    Ok(is_bookmarked)
}

/// ブックマークを並び替え
#[instrument(level = "info", skip(state), fields(user_id = %user_id, project_id = %project_id))]
#[tauri::command]
pub async fn reorder_tag_bookmarks(
    user_id: String,
    project_id: String,
    from_index: i32,
    to_index: i32,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let repos_lock = state.repositories.read().await;
    let repos = &*repos_lock;
    let user_id = UserId::from(user_id);
    let project_id = ProjectId::from(project_id);

    tag_bookmark_service::reorder_bookmarks(repos, &user_id, &project_id, from_index, to_index)
        .await
        .map_err(|e| {
            tracing::error!(target: "commands::user_preferences", command = "reorder_tag_bookmarks", error = %e);
            e.to_string()
        })?;

    Ok(())
}
