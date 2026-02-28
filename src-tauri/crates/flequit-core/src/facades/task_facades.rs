use tracing::info;

use crate::ports::infrastructure_repositories::*;
use crate::services::{tag_service, task_service, task_tag_service};
use crate::InfrastructureRepositoriesTrait;
use chrono::{DateTime, Utc};
use flequit_model::models::task_projects::tag::Tag;
use flequit_model::models::task_projects::task::{PartialTask, Task};
use flequit_model::models::task_projects::task_tag::TaskTag;
use flequit_model::traits::TransactionManager;
use flequit_model::types::id_types::{ProjectId, TagId, TaskId, UserId};
use flequit_repository::repositories::project_repository_trait::ProjectRepository;
use flequit_types::errors::service_error::ServiceError;
use sea_orm::DatabaseTransaction;
use uuid::Uuid;

pub async fn create_task<R>(
    repositories: &R,
    project_id: &ProjectId,
    task: &Task,
    user_id: &UserId,
) -> Result<bool, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match task_service::create_task(repositories, project_id, task, user_id).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to create task: {:?}", e)),
    }
}

pub async fn get_task<R>(
    repositories: &R,
    project_id: &ProjectId,
    id: &TaskId,
) -> Result<Option<Task>, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    info!("get_task called with id: {}", id);
    match task_service::get_task(repositories, project_id, id).await {
        Ok(t) => Ok(t),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to update task: {:?}", e)),
    }
}

pub async fn search_tasks<R>(
    repositories: &R,
    project_id: &ProjectId,
    condition: &task_service::TaskSearchCondition,
) -> Result<Vec<Task>, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match task_service::search_tasks(repositories, project_id, condition).await {
        Ok(tasks) => Ok(tasks),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to search tasks: {:?}", e)),
    }
}

pub async fn update_task<R>(
    repositories: &R,
    project_id: &ProjectId,
    task_id: &TaskId,
    patch: &PartialTask,
    user_id: &UserId,
) -> Result<bool, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match task_service::update_task(repositories, project_id, task_id, patch, user_id).await {
        Ok(changed) => Ok(changed),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to update task: {:?}", e)),
    }
}

pub async fn delete_task<R>(
    repositories: &R,
    project_id: &ProjectId,
    id: &TaskId,
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

    // 1. サブタスクを削除（内部でSubtaskTagsも削除される）
    if let Err(e) = sqlite_repos_guard
        .sub_tasks_repo()
        .remove_all_by_task_id_with_txn(&txn, project_id, &id.to_string())
        .await
    {
        if let Err(rollback_err) = repositories.rollback(txn).await {
            return Err(format!(
                "Failed to delete subtasks: {:?} and rollback failed: {:?}",
                e, rollback_err
            ));
        }
        return Err(format!("Failed to delete subtasks: {:?}", e));
    }

    // 2. タスクタグの関連付けを削除
    if let Err(e) = sqlite_repos_guard
        .task_tags_repo()
        .remove_all_by_task_id_with_txn(&txn, project_id, id)
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

    // 3. タスク割り当てを削除
    if let Err(e) = sqlite_repos_guard
        .task_assignments_repo()
        .remove_all_by_task_id_with_txn(&txn, id)
        .await
    {
        if let Err(rollback_err) = repositories.rollback(txn).await {
            return Err(format!(
                "Failed to delete task assignments: {:?} and rollback failed: {:?}",
                e, rollback_err
            ));
        }
        return Err(format!("Failed to delete task assignments: {:?}", e));
    }

    // 4. タスク繰り返しルールを削除
    if let Err(e) = sqlite_repos_guard
        .task_recurrences_repo()
        .remove_all_with_txn(&txn, project_id, id)
        .await
    {
        if let Err(rollback_err) = repositories.rollback(txn).await {
            return Err(format!(
                "Failed to delete task recurrences: {:?} and rollback failed: {:?}",
                e, rollback_err
            ));
        }
        return Err(format!("Failed to delete task recurrences: {:?}", e));
    }

    // 5. タスク本体を削除
    if let Err(e) = sqlite_repos_guard
        .tasks_repo()
        .delete_with_txn(&txn, project_id, id)
        .await
    {
        if let Err(rollback_err) = repositories.rollback(txn).await {
            return Err(format!(
                "Failed to delete task: {:?} and rollback failed: {:?}",
                e, rollback_err
            ));
        }
        return Err(format!("Failed to delete task: {:?}", e));
    }

    drop(sqlite_repos_guard);

    // 6. Automerge論理削除をSQLiteコミット前に実行
    if let Some(automerge) = repositories.automerge_repositories() {
        let automerge_guard = automerge.read().await;

        if let Err(e) = automerge_guard
            .projects_repo()
            .mark_task_deleted(project_id, id, user_id, timestamp)
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

    // 7. SQLiteをコミット
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

pub async fn restore_task<R>(
    repositories: &R,
    project_id: &ProjectId,
    id: &TaskId,
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

    // 1. Automergeから削除済みタスクを取得
    let deleted_task = match automerge_guard
        .projects_repo()
        .get_deleted_task_by_id(project_id, id)
        .await
    {
        Ok(Some(t)) => t,
        Ok(None) => return Err(format!("Task not found or not deleted: {}", id)),
        Err(e) => return Err(format!("Failed to get deleted task: {:?}", e)),
    };

    // 2. SQLiteにタスクを再作成
    if let Err(e) = repositories
        .tasks()
        .save(project_id, &deleted_task, user_id, timestamp)
        .await
    {
        return Err(format!("Failed to recreate task in SQLite: {:?}", e));
    }

    // 3. Automergeでタスクを復元（deleted=false）
    if let Err(e) = automerge_guard
        .projects_repo()
        .restore_task(project_id, id, user_id, timestamp)
        .await
    {
        // Automerge復元失敗 → SQLiteから再削除してロールバック
        if let Err(del_err) = repositories.tasks().delete(project_id, id).await {
            tracing::error!(
                "Failed to restore Automerge and cleanup SQLite also failed: automerge={:?}, sqlite={:?}",
                e, del_err
            );
        }
        return Err(format!("Failed to restore task in Automerge: {:?}", e));
    }

    Ok(true)
}

/// TaskTag facades (moved from tagging_facades.rs)
pub async fn add_task_tag_relation<R>(
    repositories: &R,
    project_id: &ProjectId,
    task_id: &TaskId,
    tag_id: &TagId,
    user_id: &UserId,
) -> Result<bool, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match task_tag_service::add_task_tag_relation(
        repositories,
        project_id,
        task_id,
        tag_id,
        user_id,
    )
    .await
    {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to add task-tag relation: {:?}", e)),
    }
}

// 名前から作成/取得し、紐づけを原子的に行う
pub async fn add_task_tag<R>(
    repositories: &R,
    project_id: &ProjectId,
    task_id: &TaskId,
    tag_name: &str,
    user_id: &UserId,
) -> Result<Tag, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    // 1) 既存タグ検索（完全一致）
    let existing = match tag_service::list_tags(repositories, project_id).await {
        Ok(all) => all.into_iter().find(|t| t.name == tag_name),
        Err(ServiceError::ValidationError(msg)) => return Err(msg),
        Err(e) => return Err(format!("Failed to list tags: {:?}", e)),
    };

    // 2) 無ければ作成
    let tag: Tag = if let Some(existing_tag) = existing {
        existing_tag
    } else {
        let now = Utc::now();
        let new_tag = Tag {
            id: TagId::from(Uuid::new_v4()),
            name: tag_name.to_string(),
            color: None,
            order_index: None,
            created_at: now,
            updated_at: now,
            deleted: false,
            updated_by: *user_id,
        };
        match tag_service::create_tag(repositories, project_id, &new_tag, user_id).await {
            Ok(_) => new_tag,
            Err(ServiceError::ValidationError(msg)) => return Err(msg),
            Err(e) => return Err(format!("Failed to create tag: {:?}", e)),
        }
    };

    // 3) 関連付け
    match task_tag_service::add_task_tag_relation(
        repositories,
        project_id,
        task_id,
        &tag.id,
        user_id,
    )
    .await
    {
        Ok(_) => Ok(tag),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to add task-tag relation: {:?}", e)),
    }
}

pub async fn remove_task_tag_relation<R>(
    repositories: &R,
    project_id: &ProjectId,
    task_id: &TaskId,
    tag_id: &TagId,
) -> Result<bool, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match task_tag_service::remove_task_tag_relation(repositories, project_id, task_id, tag_id)
        .await
    {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to remove task-tag relation: {:?}", e)),
    }
}

pub async fn get_tag_ids_by_task_id<R>(
    repositories: &R,
    project_id: &ProjectId,
    task_id: &TaskId,
) -> Result<Vec<TagId>, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match task_tag_service::get_tag_ids_by_task_id(repositories, project_id, task_id).await {
        Ok(tag_ids) => Ok(tag_ids),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to get tag IDs by task ID: {:?}", e)),
    }
}

pub async fn get_task_ids_by_tag_id<R>(
    repositories: &R,
    project_id: &ProjectId,
    tag_id: &TagId,
) -> Result<Vec<TaskId>, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match task_tag_service::get_task_ids_by_tag_id(repositories, project_id, tag_id).await {
        Ok(task_ids) => Ok(task_ids),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to get task IDs by tag ID: {:?}", e)),
    }
}

pub async fn update_task_tag_relations<R>(
    repositories: &R,
    project_id: &ProjectId,
    task_id: &TaskId,
    tag_ids: &[TagId],
    user_id: &UserId,
) -> Result<bool, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match task_tag_service::update_task_tag_relations(
        repositories,
        project_id,
        task_id,
        tag_ids,
        user_id,
    )
    .await
    {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to update task-tag relations: {:?}", e)),
    }
}

pub async fn remove_all_task_tags_by_task_id<R>(
    repositories: &R,
    project_id: &ProjectId,
    task_id: &TaskId,
) -> Result<bool, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match task_tag_service::remove_all_task_tags_by_task_id(repositories, project_id, task_id).await
    {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!(
            "Failed to remove all task tags by task ID: {:?}",
            e
        )),
    }
}

pub async fn remove_all_task_tags_by_tag_id<R>(
    repositories: &R,
    project_id: &ProjectId,
    tag_id: &TagId,
) -> Result<bool, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match task_tag_service::remove_all_task_tags_by_tag_id(repositories, project_id, tag_id).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to remove all task tags by tag ID: {:?}", e)),
    }
}

pub async fn get_all_task_tags<R>(
    repositories: &R,
    project_id: &ProjectId,
) -> Result<Vec<TaskTag>, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match task_tag_service::get_all_task_tags(repositories, project_id).await {
        Ok(task_tags) => Ok(task_tags),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to get all task tags: {:?}", e)),
    }
}
