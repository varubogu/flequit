use crate::ports::infrastructure_repositories::*;
use crate::services::tag_service;
use crate::InfrastructureRepositoriesTrait;
use chrono::{DateTime, Utc};
use flequit_model::models::task_projects::tag::{PartialTag, Tag};
use flequit_model::traits::TransactionManager;
use flequit_model::types::id_types::{ProjectId, TagId, UserId};
use flequit_repository::repositories::project_repository_trait::ProjectRepository;
use flequit_types::errors::service_error::ServiceError;
use sea_orm::DatabaseTransaction;

pub async fn create_tag<R>(
    repositories: &R,
    project_id: &ProjectId,
    tag: &Tag,
    user_id: &UserId,
) -> Result<bool, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match tag_service::create_tag(repositories, project_id, tag, user_id).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to create tag: {:?}", e)),
    }
}

pub async fn get_tag<R>(
    repositories: &R,
    project_id: &ProjectId,
    id: &TagId,
) -> Result<Option<Tag>, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match tag_service::get_tag(repositories, project_id, id).await {
        Ok(Some(tag)) => Ok(Some(tag)),
        Ok(None) => Ok(None),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to get tag: {:?}", e)),
    }
}

pub async fn search_tags<R>(
    repositories: &R,
    project_id: &ProjectId,
    name: Option<&str>,
    limit: Option<i32>,
    offset: Option<i32>,
) -> Result<Vec<Tag>, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match tag_service::search_tags(repositories, project_id, name, limit, offset).await {
        Ok(tags) => Ok(tags),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to search tags: {:?}", e)),
    }
}

pub async fn update_tag<R>(
    repositories: &R,
    project_id: &ProjectId,
    tag_id: &TagId,
    patch: &PartialTag,
    user_id: &UserId,
) -> Result<bool, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match tag_service::update_tag(repositories, project_id, tag_id, patch, user_id).await {
        Ok(changed) => Ok(changed),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to update tag: {:?}", e)),
    }
}

pub async fn delete_tag<R>(
    repositories: &R,
    project_id: &ProjectId,
    id: &TagId,
    user_id: &UserId,
    timestamp: &DateTime<Utc>,
) -> Result<bool, String>
where
    R: InfrastructureRepositoriesTrait
        + TransactionManager<Transaction = DatabaseTransaction>
        + Send
        + Sync,
{
    // 1. Automergeスナップショットを作成（ロールバック用）
    let snapshot = if let Some(automerge) = repositories.automerge_repositories() {
        let automerge_guard = automerge.read().await;
        match automerge_guard
            .projects_repo()
            .create_snapshot(project_id)
            .await
        {
            Ok(snap) => Some(snap),
            Err(e) => {
                tracing::warn!("Failed to create Automerge snapshot: {:?}", e);
                None
            }
        }
    } else {
        None
    };

    // 2. SQLiteトランザクションを開始
    let txn = match repositories.begin().await {
        Ok(txn) => txn,
        Err(e) => return Err(format!("Failed to begin transaction: {:?}", e)),
    };

    // SQLiteリポジトリにアクセス
    let sqlite_repos = match repositories.sqlite_repositories() {
        Some(repos) => repos,
        None => {
            if let Err(e) = repositories.rollback(txn).await {
                return Err(format!(
                    "SQLite repositories not initialized and rollback failed: {:?}",
                    e
                ));
            }
            return Err("SQLite repositories not initialized".to_string());
        }
    };

    let sqlite_repos_guard = sqlite_repos.read().await;

    // 1. タグブックマークを削除
    if let Err(e) = sqlite_repos_guard
        .tag_bookmarks_repo()
        .remove_all_by_tag_id_with_txn(&txn, project_id, id)
        .await
    {
        if let Err(rollback_err) = repositories.rollback(txn).await {
            return Err(format!(
                "Failed to delete tag bookmarks: {:?} and rollback failed: {:?}",
                e, rollback_err
            ));
        }
        return Err(format!("Failed to delete tag bookmarks: {:?}", e));
    }

    // 2. タスクタグの関連付けを削除
    if let Err(e) = sqlite_repos_guard
        .task_tags_repo()
        .remove_all_by_tag_id_with_txn(&txn, project_id, id)
        .await
    {
        if let Err(rollback_err) = repositories.rollback(txn).await {
            return Err(format!(
                "Failed to delete task tags: {:?} and rollback failed: {:?}",
                e, rollback_err
            ));
        }
        return Err(format!("Failed to delete task tags: {:?}", e));
    }

    // 3. サブタスクタグの関連付けを削除
    if let Err(e) = sqlite_repos_guard
        .subtask_tags_repo()
        .remove_all_by_tag_id_with_txn(&txn, id)
        .await
    {
        if let Err(rollback_err) = repositories.rollback(txn).await {
            return Err(format!(
                "Failed to delete subtask tags: {:?} and rollback failed: {:?}",
                e, rollback_err
            ));
        }
        return Err(format!("Failed to delete subtask tags: {:?}", e));
    }

    // 4. タグ本体を削除
    if let Err(e) = sqlite_repos_guard
        .tags_repo()
        .delete_with_txn(&txn, project_id, id)
        .await
    {
        if let Err(rollback_err) = repositories.rollback(txn).await {
            return Err(format!(
                "Failed to delete tag: {:?} and rollback failed: {:?}",
                e, rollback_err
            ));
        }
        return Err(format!("Failed to delete tag: {:?}", e));
    }

    drop(sqlite_repos_guard);

    // 5. Automerge論理削除をSQLiteコミット前に実行
    if let Some(automerge) = repositories.automerge_repositories() {
        let automerge_guard = automerge.read().await;

        if let Err(e) = automerge_guard
            .projects_repo()
            .mark_tag_deleted(project_id, id, user_id, timestamp)
            .await
        {
            // Automerge失敗 → スナップショットから復元
            if let Some(ref snap) = snapshot {
                if let Err(re) = automerge_guard
                    .projects_repo()
                    .restore_from_snapshot(project_id, snap)
                    .await
                {
                    tracing::error!(
                        "Failed to restore Automerge snapshot after deletion failure: {:?}",
                        re
                    );
                }
            }
            // SQLiteロールバック
            if let Err(rollback_err) = repositories.rollback(txn).await {
                return Err(format!(
                    "Failed to delete from Automerge: {:?} and rollback failed: {:?}",
                    e, rollback_err
                ));
            }
            return Err(format!("Failed to delete from Automerge: {:?}", e));
        }
    }

    // 6. SQLiteをコミット
    if let Err(e) = repositories.commit(txn).await {
        // SQLiteコミット失敗 → Automergeスナップショットから復元
        if let (Some(snap), Some(automerge)) = (snapshot, repositories.automerge_repositories()) {
            let automerge_guard = automerge.read().await;
            if let Err(restore_err) = automerge_guard
                .projects_repo()
                .restore_from_snapshot(project_id, &snap)
                .await
            {
                tracing::error!(
                    "Failed to restore Automerge snapshot after commit failure: {:?}",
                    restore_err
                );
            }
        }
        return Err(format!("Failed to commit transaction: {:?}", e));
    }

    Ok(true)
}

pub async fn restore_tag<R>(
    repositories: &R,
    project_id: &ProjectId,
    id: &TagId,
    user_id: &UserId,
    timestamp: &DateTime<Utc>,
) -> Result<bool, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    let automerge = match repositories.automerge_repositories() {
        Some(a) => a,
        None => return Err("Automerge repositories not initialized".to_string()),
    };
    let automerge_guard = automerge.read().await;

    // 1. Automergeから削除済みタグを取得
    let deleted_tag = match automerge_guard
        .projects_repo()
        .get_deleted_tag_by_id(project_id, id)
        .await
    {
        Ok(Some(t)) => t,
        Ok(None) => return Err(format!("Tag not found or not deleted: {}", id)),
        Err(e) => return Err(format!("Failed to get deleted tag: {:?}", e)),
    };

    // 2. SQLiteにタグを再作成
    if let Err(e) = repositories
        .tags()
        .save(project_id, &deleted_tag, user_id, timestamp)
        .await
    {
        return Err(format!("Failed to recreate tag in SQLite: {:?}", e));
    }

    // 3. Automergeでタグを復元（deleted=false）
    if let Err(e) = automerge_guard
        .projects_repo()
        .restore_tag(project_id, id, user_id, timestamp)
        .await
    {
        // Automerge復元失敗 → SQLiteから再削除してロールバック
        if let Err(del_err) = repositories.tags().delete(project_id, id).await {
            tracing::error!(
                "Failed to restore Automerge and cleanup SQLite also failed: automerge={:?}, sqlite={:?}",
                e, del_err
            );
        }
        return Err(format!("Failed to restore tag in Automerge: {:?}", e));
    }

    Ok(true)
}
