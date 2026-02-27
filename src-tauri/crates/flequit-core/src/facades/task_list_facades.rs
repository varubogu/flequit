use crate::ports::infrastructure_repositories::*;
use crate::services::task_list_service;
use crate::InfrastructureRepositoriesTrait;
use chrono::{DateTime, Utc};
use flequit_model::models::task_projects::task_list::{PartialTaskList, TaskList};
use flequit_model::traits::TransactionManager;
use flequit_model::types::id_types::{ProjectId, TaskListId, UserId};
use flequit_repository::repositories::project_repository_trait::ProjectRepository;
use flequit_types::errors::service_error::ServiceError;
use sea_orm::DatabaseTransaction;

pub async fn create_task_list<R>(
    repositories: &R,
    project_id: &ProjectId,
    task_list: &TaskList,
    user_id: &UserId,
) -> Result<bool, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match task_list_service::create_task_list(repositories, project_id, task_list, user_id).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to create task list: {:?}", e)),
    }
}

pub async fn get_task_list<R>(
    repositories: &R,
    project_id: &ProjectId,
    id: &TaskListId,
) -> Result<Option<TaskList>, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match task_list_service::get_task_list(repositories, project_id, id).await {
        Ok(task_list) => Ok(task_list),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to get task list: {:?}", e)),
    }
}

pub async fn search_task_lists<R>(
    repositories: &R,
    project_id: &ProjectId,
    name: Option<&str>,
    is_archived: Option<bool>,
    order_index: Option<i32>,
    limit: Option<i32>,
    offset: Option<i32>,
) -> Result<Vec<TaskList>, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match task_list_service::search_task_lists(
        repositories,
        project_id,
        name,
        is_archived,
        order_index,
        limit,
        offset,
    )
    .await
    {
        Ok(task_lists) => Ok(task_lists),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to search task lists: {:?}", e)),
    }
}

pub async fn update_task_list<R>(
    repositories: &R,
    project_id: &ProjectId,
    task_list_id: &TaskListId,
    patch: &PartialTaskList,
    user_id: &UserId,
) -> Result<bool, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match task_list_service::update_task_list(
        repositories,
        project_id,
        task_list_id,
        patch,
        user_id,
    )
    .await
    {
        Ok(changed) => Ok(changed),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to update task list: {:?}", e)),
    }
}

pub async fn delete_task_list<R>(
    repositories: &R,
    project_id: &ProjectId,
    id: &TaskListId,
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

    // 3. タスクリスト本体を削除
    if let Err(e) = sqlite_repos_guard
        .task_lists_repo()
        .delete_with_txn(&txn, project_id, id)
        .await
    {
        if let Err(rollback_err) = repositories.rollback(txn).await {
            return Err(format!(
                "Failed to delete task list: {:?} and rollback failed: {:?}",
                e, rollback_err
            ));
        }
        return Err(format!("Failed to delete task list: {:?}", e));
    }

    drop(sqlite_repos_guard);

    // 4. Automerge論理削除をSQLiteコミット前に実行
    if let Some(automerge) = repositories.automerge_repositories() {
        let automerge_guard = automerge.read().await;

        if let Err(e) = automerge_guard
            .projects_repo()
            .mark_task_list_deleted(project_id, id, user_id, timestamp)
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

    // 5. SQLiteをコミット
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

pub async fn restore_task_list<R>(
    repositories: &R,
    project_id: &ProjectId,
    id: &TaskListId,
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

    // 1. Automergeから削除済みタスクリストを取得
    let deleted_task_list = match automerge_guard
        .projects_repo()
        .get_deleted_task_list_by_id(project_id, id)
        .await
    {
        Ok(Some(tl)) => tl,
        Ok(None) => return Err(format!("Task list not found or not deleted: {}", id)),
        Err(e) => return Err(format!("Failed to get deleted task list: {:?}", e)),
    };

    // 2. SQLiteにタスクリストを再作成
    if let Err(e) = repositories
        .task_lists()
        .save(project_id, &deleted_task_list, user_id, timestamp)
        .await
    {
        return Err(format!("Failed to recreate task list in SQLite: {:?}", e));
    }

    // 3. Automergeでタスクリストを復元（deleted=false）
    if let Err(e) = automerge_guard
        .projects_repo()
        .restore_task_list(project_id, id, user_id, timestamp)
        .await
    {
        // Automerge復元失敗 → SQLiteから再削除してロールバック
        if let Err(del_err) = repositories.task_lists().delete(project_id, id).await {
            tracing::error!(
                "Failed to restore Automerge and cleanup SQLite also failed: automerge={:?}, sqlite={:?}",
                e, del_err
            );
        }
        return Err(format!("Failed to restore task list in Automerge: {:?}", e));
    }

    Ok(true)
}
