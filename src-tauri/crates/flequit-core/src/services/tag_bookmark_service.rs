use chrono::Utc;
use crate::ports::infrastructure_repositories::{
    TagBookmarkAutomergeRepositoryPort, TagBookmarkSqliteRepositoryPort,
};
use crate::InfrastructureRepositoriesTrait;
use flequit_model::models::user_preferences::tag_bookmark::TagBookmark;
use flequit_model::types::id_types::{ProjectId, TagBookmarkId, TagId, UserId};
use flequit_types::errors::service_error::ServiceError;

/// ブックマークを作成
pub async fn create_bookmark<R>(
    repositories: &R,
    bookmark: &TagBookmark,
) -> Result<(), ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    // 既に同じブックマークが存在するか確認
    let existing = repositories
        .tag_bookmarks_sqlite()
        .find_by_user_project_tag(&bookmark.user_id, &bookmark.project_id, &bookmark.tag_id)
        .await?;

    if existing.is_some() {
        return Err(ServiceError::ValidationError(
            "Bookmark already exists".to_string(),
        ));
    }

    let now = Utc::now();
    let mut new_bookmark = bookmark.clone();
    new_bookmark.created_at = now;
    new_bookmark.updated_at = now;

    // SQLiteに保存
    repositories
        .tag_bookmarks_sqlite()
        .create(&new_bookmark)
        .await?;

    // Automergeに保存
    repositories
        .tag_bookmarks_automerge()
        .create(&new_bookmark)
        .await?;

    Ok(())
}

/// ブックマークを取得
pub async fn get_bookmark<R>(
    repositories: &R,
    user_id: &UserId,
    project_id: &ProjectId,
    tag_id: &TagId,
) -> Result<Option<TagBookmark>, ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    repositories
        .tag_bookmarks_sqlite()
        .find_by_user_project_tag(user_id, project_id, tag_id)
        .await
        .map_err(ServiceError::from)
}

/// ユーザーとプロジェクトのブックマーク一覧を取得
pub async fn list_bookmarks_by_user_and_project<R>(
    repositories: &R,
    user_id: &UserId,
    project_id: &ProjectId,
) -> Result<Vec<TagBookmark>, ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    repositories
        .tag_bookmarks_sqlite()
        .find_by_user_and_project(user_id, project_id)
        .await
        .map_err(ServiceError::from)
}

/// ユーザーの全ブックマークを取得
pub async fn list_bookmarks_by_user<R>(
    repositories: &R,
    user_id: &UserId,
) -> Result<Vec<TagBookmark>, ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    repositories
        .tag_bookmarks_sqlite()
        .find_by_user(user_id)
        .await
        .map_err(ServiceError::from)
}

/// ブックマークを更新（order_indexの変更）
pub async fn update_bookmark<R>(
    repositories: &R,
    bookmark: &TagBookmark,
) -> Result<(), ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    let mut updated_bookmark = bookmark.clone();
    updated_bookmark.updated_at = Utc::now();

    // SQLiteを更新
    repositories
        .tag_bookmarks_sqlite()
        .update(&updated_bookmark)
        .await?;

    // Automergeを更新
    repositories
        .tag_bookmarks_automerge()
        .update(&updated_bookmark)
        .await?;

    Ok(())
}

/// 複数のブックマークを一括更新（並び替え用）
pub async fn update_bookmarks_bulk<R>(
    repositories: &R,
    bookmarks: &[TagBookmark],
) -> Result<(), ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    let now = Utc::now();
    let updated_bookmarks: Vec<TagBookmark> = bookmarks
        .iter()
        .map(|b| {
            let mut updated = b.clone();
            updated.updated_at = now;
            updated
        })
        .collect();

    // SQLiteを一括更新
    repositories
        .tag_bookmarks_sqlite()
        .update_bulk(&updated_bookmarks)
        .await?;

    // Automergeを一括更新
    for bookmark in &updated_bookmarks {
        repositories
            .tag_bookmarks_automerge()
            .update(bookmark)
            .await?;
    }

    Ok(())
}

/// ブックマークを削除
pub async fn delete_bookmark<R>(
    repositories: &R,
    bookmark_id: &TagBookmarkId,
    user_id: &UserId,
    project_id: &ProjectId,
    tag_id: &TagId,
) -> Result<(), ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    // SQLiteから削除
    repositories
        .tag_bookmarks_sqlite()
        .delete(bookmark_id)
        .await?;

    // Automergeから削除
    repositories
        .tag_bookmarks_automerge()
        .delete(user_id, project_id, tag_id)
        .await?;

    Ok(())
}

/// タグがブックマーク済みかチェック
pub async fn is_bookmarked<R>(
    repositories: &R,
    user_id: &UserId,
    project_id: &ProjectId,
    tag_id: &TagId,
) -> Result<bool, ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    let bookmark = repositories
        .tag_bookmarks_sqlite()
        .find_by_user_project_tag(user_id, project_id, tag_id)
        .await?;

    Ok(bookmark.is_some())
}

/// 次のorder_indexを取得
pub async fn get_next_order_index<R>(
    repositories: &R,
    user_id: &UserId,
    project_id: &ProjectId,
) -> Result<i32, ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    let max_order = repositories
        .tag_bookmarks_sqlite()
        .get_max_order_index(user_id, project_id)
        .await?;

    Ok(max_order + 1)
}

/// ブックマークを並び替え（ドラッグ&ドロップ用）
pub async fn reorder_bookmarks<R>(
    repositories: &R,
    user_id: &UserId,
    project_id: &ProjectId,
    from_index: i32,
    to_index: i32,
) -> Result<(), ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    let mut bookmarks = list_bookmarks_by_user_and_project(repositories, user_id, project_id).await?;

    if from_index < 0 || to_index < 0 || from_index >= bookmarks.len() as i32 || to_index >= bookmarks.len() as i32 {
        return Err(ServiceError::ValidationError(
            "Invalid index".to_string(),
        ));
    }

    // 要素を移動
    let bookmark = bookmarks.remove(from_index as usize);
    bookmarks.insert(to_index as usize, bookmark);

    // order_indexを再設定
    for (i, bookmark) in bookmarks.iter_mut().enumerate() {
        bookmark.order_index = i as i32;
    }

    // 一括更新
    update_bookmarks_bulk(repositories, &bookmarks).await?;

    Ok(())
}

/// タグに紐づくすべてのブックマークを削除（タグ削除時に使用）
pub async fn delete_bookmarks_by_tag<R>(
    repositories: &R,
    project_id: &ProjectId,
    tag_id: &TagId,
) -> Result<(), ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    // タグに紐づくブックマークを取得
    let bookmarks = repositories
        .tag_bookmarks_sqlite()
        .find_by_project_and_tag(project_id, tag_id)
        .await?;

    // 各ブックマークを削除
    for bookmark in bookmarks {
        // SQLiteから削除
        repositories
            .tag_bookmarks_sqlite()
            .delete(&bookmark.id)
            .await?;

        // Automergeから削除
        repositories
            .tag_bookmarks_automerge()
            .delete(&bookmark.user_id, &bookmark.project_id, &bookmark.tag_id)
            .await?;
    }

    Ok(())
}
