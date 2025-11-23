use crate::services::tag_service;
use flequit_infrastructure::InfrastructureRepositoriesTrait;
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
) -> Result<bool, String>
where
    R: InfrastructureRepositoriesTrait + TransactionManager<Transaction = DatabaseTransaction> + Send + Sync,
{
    // トランザクションを開始
    let txn = match repositories.begin().await {
        Ok(txn) => txn,
        Err(e) => return Err(format!("Failed to begin transaction: {:?}", e)),
    };

    // SQLiteリポジトリにアクセス
    let sqlite_repos = match repositories.sqlite_repositories() {
        Some(repos) => repos,
        None => {
            if let Err(e) = repositories.rollback(txn).await {
                return Err(format!("SQLite repositories not initialized and rollback failed: {:?}", e));
            }
            return Err("SQLite repositories not initialized".to_string());
        }
    };

    let sqlite_repos_guard = sqlite_repos.read().await;

    // 1. タグブックマークを削除
    if let Err(e) = sqlite_repos_guard.tag_bookmarks.remove_all_by_tag_id_with_txn(&txn, project_id, id).await {
        if let Err(rollback_err) = repositories.rollback(txn).await {
            return Err(format!("Failed to delete tag bookmarks: {:?} and rollback failed: {:?}", e, rollback_err));
        }
        return Err(format!("Failed to delete tag bookmarks: {:?}", e));
    }

    // 2. タスクタグの関連付けを削除
    if let Err(e) = sqlite_repos_guard.task_tags.remove_all_by_tag_id_with_txn(&txn, project_id, id).await {
        if let Err(rollback_err) = repositories.rollback(txn).await {
            return Err(format!("Failed to delete task tags: {:?} and rollback failed: {:?}", e, rollback_err));
        }
        return Err(format!("Failed to delete task tags: {:?}", e));
    }

    // 3. サブタスクタグの関連付けを削除
    if let Err(e) = sqlite_repos_guard.subtask_tags.remove_all_by_tag_id_with_txn(&txn, id).await {
        if let Err(rollback_err) = repositories.rollback(txn).await {
            return Err(format!("Failed to delete subtask tags: {:?} and rollback failed: {:?}", e, rollback_err));
        }
        return Err(format!("Failed to delete subtask tags: {:?}", e));
    }

    // 4. タグ本体を削除
    if let Err(e) = sqlite_repos_guard.tags.delete_with_txn(&txn, project_id, id).await {
        if let Err(rollback_err) = repositories.rollback(txn).await {
            return Err(format!("Failed to delete tag: {:?} and rollback failed: {:?}", e, rollback_err));
        }
        return Err(format!("Failed to delete tag: {:?}", e));
    }

    drop(sqlite_repos_guard);

    // トランザクションをコミット
    if let Err(e) = repositories.commit(txn).await {
        return Err(format!("Failed to commit transaction: {:?}", e));
    }

    // 5. Automergeリポジトリからも削除（トランザクション不要）
    if let Err(e) = repositories.tags().delete(project_id, id).await {
        // Automergeの削除に失敗してもSQLiteは既にコミットされているので、
        // ログを記録して続行
        tracing::warn!("Failed to delete tag from Automerge: {:?}", e);
    }

    Ok(true)
}
