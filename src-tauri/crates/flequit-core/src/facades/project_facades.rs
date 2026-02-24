use crate::services::project_service;
use chrono::{DateTime, Utc};
use flequit_infrastructure::InfrastructureRepositoriesTrait;
use flequit_model::models::task_projects::project::{PartialProject, Project};
use flequit_model::traits::TransactionManager;
use flequit_model::types::id_types::{ProjectId, UserId};
use flequit_repository::repositories::base_repository_trait::Repository;
use flequit_types::errors::service_error::ServiceError;
use sea_orm::DatabaseTransaction;

pub async fn create_project<R>(repositories: &R, project: &Project, user_id: &UserId) -> Result<bool, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match project_service::create_project(repositories, project, user_id).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to create project: {:?}", e)),
    }
}

pub async fn get_project<R>(repositories: &R, id: &ProjectId) -> Result<Option<Project>, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match project_service::get_project(repositories, id).await {
        Ok(Some(project)) => Ok(Some(project)),
        Ok(None) => Ok(None),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to get project: {:?}", e)),
    }
}

pub async fn update_project<R>(
    repositories: &R,
    project_id: &ProjectId,
    patch: &PartialProject,
    user_id: &UserId,
) -> Result<bool, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match project_service::update_project(repositories, project_id, patch, user_id).await {
        Ok(changed) => Ok(changed),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to update project: {:?}", e)),
    }
}

pub async fn delete_project<R>(
    repositories: &R,
    id: &ProjectId,
    user_id: &UserId,
    timestamp: &DateTime<Utc>,
) -> Result<bool, String>
where
    R: InfrastructureRepositoriesTrait + TransactionManager<Transaction = DatabaseTransaction> + Send + Sync,
{
    // 1. Automergeスナップショットを作成（ロールバック用）
    let snapshot = if let Some(automerge) = repositories.automerge_repositories() {
        let automerge_guard = automerge.read().await;
        match automerge_guard.projects.create_snapshot(id).await {
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
                return Err(format!("SQLite repositories not initialized and rollback failed: {:?}", e));
            }
            return Err("SQLite repositories not initialized".to_string());
        }
    };

    let sqlite_repos_guard = sqlite_repos.read().await;

    // 1. プロジェクト内の全タスクを削除（内部でSubTask、TaskTag、TaskAssignment、TaskRecurrenceも削除される）
    let task_ids = match sqlite_repos_guard.tasks.find_ids_by_project_id(id).await {
        Ok(ids) => ids,
        Err(e) => {
            if let Err(rollback_err) = repositories.rollback(txn).await {
                return Err(format!("Failed to get task IDs: {:?} and rollback failed: {:?}", e, rollback_err));
            }
            return Err(format!("Failed to get task IDs: {:?}", e));
        }
    };

    for task_id in task_ids {
        // サブタスクを削除（内部でSubtaskTagsも削除される）
        if let Err(e) = sqlite_repos_guard.sub_tasks.remove_all_by_task_id_with_txn(&txn, id, &task_id.to_string()).await {
            if let Err(rollback_err) = repositories.rollback(txn).await {
                return Err(format!("Failed to delete subtasks for task {}: {:?} and rollback failed: {:?}", task_id, e, rollback_err));
            }
            return Err(format!("Failed to delete subtasks for task {}: {:?}", task_id, e));
        }

        // タスクタグの関連付けを削除
        if let Err(e) = sqlite_repos_guard.task_tags.remove_all_by_task_id_with_txn(&txn, id, &task_id).await {
            if let Err(rollback_err) = repositories.rollback(txn).await {
                return Err(format!("Failed to delete task tags for task {}: {:?} and rollback failed: {:?}", task_id, e, rollback_err));
            }
            return Err(format!("Failed to delete task tags for task {}: {:?}", task_id, e));
        }

        // タスク割り当てを削除
        if let Err(e) = sqlite_repos_guard.task_assignments.remove_all_by_task_id_with_txn(&txn, &task_id).await {
            if let Err(rollback_err) = repositories.rollback(txn).await {
                return Err(format!("Failed to delete task assignments for task {}: {:?} and rollback failed: {:?}", task_id, e, rollback_err));
            }
            return Err(format!("Failed to delete task assignments for task {}: {:?}", task_id, e));
        }

        // タスク繰り返しルールを削除
        if let Err(e) = sqlite_repos_guard.task_recurrences.remove_all_with_txn(&txn, id, &task_id).await {
            if let Err(rollback_err) = repositories.rollback(txn).await {
                return Err(format!("Failed to delete task recurrences for task {}: {:?} and rollback failed: {:?}", task_id, e, rollback_err));
            }
            return Err(format!("Failed to delete task recurrences for task {}: {:?}", task_id, e));
        }

        // タスク本体を削除
        if let Err(e) = sqlite_repos_guard.tasks.delete_with_txn(&txn, id, &task_id).await {
            if let Err(rollback_err) = repositories.rollback(txn).await {
                return Err(format!("Failed to delete task {}: {:?} and rollback failed: {:?}", task_id, e, rollback_err));
            }
            return Err(format!("Failed to delete task {}: {:?}", task_id, e));
        }
    }

    // 2. プロジェクト内の全タグを削除（Tag削除でTagBookmark、TaskTag、SubtaskTagも削除される）
    let tag_ids = match sqlite_repos_guard.tags.find_ids_by_project_id(id).await {
        Ok(ids) => ids,
        Err(e) => {
            if let Err(rollback_err) = repositories.rollback(txn).await {
                return Err(format!("Failed to get tag IDs: {:?} and rollback failed: {:?}", e, rollback_err));
            }
            return Err(format!("Failed to get tag IDs: {:?}", e));
        }
    };

    for tag_id in tag_ids {
        // タグブックマークを削除
        if let Err(e) = sqlite_repos_guard.tag_bookmarks.remove_all_by_tag_id_with_txn(&txn, id, &tag_id).await {
            if let Err(rollback_err) = repositories.rollback(txn).await {
                return Err(format!("Failed to delete tag bookmarks for tag {}: {:?} and rollback failed: {:?}", tag_id, e, rollback_err));
            }
            return Err(format!("Failed to delete tag bookmarks for tag {}: {:?}", tag_id, e));
        }

        // タスクタグの関連付けを削除（残っているものがあれば）
        if let Err(e) = sqlite_repos_guard.task_tags.remove_all_by_tag_id_with_txn(&txn, id, &tag_id).await {
            if let Err(rollback_err) = repositories.rollback(txn).await {
                return Err(format!("Failed to delete task tags for tag {}: {:?} and rollback failed: {:?}", tag_id, e, rollback_err));
            }
            return Err(format!("Failed to delete task tags for tag {}: {:?}", tag_id, e));
        }

        // サブタスクタグの関連付けを削除（残っているものがあれば）
        if let Err(e) = sqlite_repos_guard.subtask_tags.remove_all_by_tag_id_with_txn(&txn, &tag_id).await {
            if let Err(rollback_err) = repositories.rollback(txn).await {
                return Err(format!("Failed to delete subtask tags for tag {}: {:?} and rollback failed: {:?}", tag_id, e, rollback_err));
            }
            return Err(format!("Failed to delete subtask tags for tag {}: {:?}", tag_id, e));
        }

        // タグ本体を削除
        if let Err(e) = sqlite_repos_guard.tags.delete_with_txn(&txn, id, &tag_id).await {
            if let Err(rollback_err) = repositories.rollback(txn).await {
                return Err(format!("Failed to delete tag {}: {:?} and rollback failed: {:?}", tag_id, e, rollback_err));
            }
            return Err(format!("Failed to delete tag {}: {:?}", tag_id, e));
        }
    }

    // 3. プロジェクト内の全TaskListを削除
    if let Err(e) = sqlite_repos_guard.task_lists.remove_all_by_project_id_with_txn(&txn, id).await {
        if let Err(rollback_err) = repositories.rollback(txn).await {
            return Err(format!("Failed to delete task lists: {:?} and rollback failed: {:?}", e, rollback_err));
        }
        return Err(format!("Failed to delete task lists: {:?}", e));
    }

    // 4. プロジェクト本体を削除
    if let Err(e) = sqlite_repos_guard.projects.delete_with_txn(&txn, id).await {
        if let Err(rollback_err) = repositories.rollback(txn).await {
            return Err(format!("Failed to delete project: {:?} and rollback failed: {:?}", e, rollback_err));
        }
        return Err(format!("Failed to delete project: {:?}", e));
    }

    drop(sqlite_repos_guard);

    // 5. Automerge論理削除をSQLiteコミット前に実行
    if let Some(automerge) = repositories.automerge_repositories() {
        let automerge_guard = automerge.read().await;
        if let Err(e) = automerge_guard.projects.mark_project_deleted(id, user_id, timestamp).await {
            // Automerge失敗 → SQLiteロールバック
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
            if let Err(restore_err) = automerge_guard.projects.restore_from_snapshot(id, &snap).await {
                tracing::error!("Failed to restore Automerge snapshot after commit failure: {:?}", restore_err);
            }
        }
        return Err(format!("Failed to commit transaction: {:?}", e));
    }

    Ok(true)
}

pub async fn restore_project<R>(
    repositories: &R,
    id: &ProjectId,
    user_id: &UserId,
    timestamp: &DateTime<Utc>,
) -> Result<bool, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    // 1. Automergeから削除済みプロジェクトを取得
    let deleted_project = if let Some(automerge) = repositories.automerge_repositories() {
        let automerge_guard = automerge.read().await;
        match automerge_guard.projects.get_deleted_project(id).await {
            Ok(Some(p)) => p,
            Ok(None) => return Err(format!("Project not found or not deleted: {}", id)),
            Err(e) => return Err(format!("Failed to get deleted project: {:?}", e)),
        }
    } else {
        return Err("Automerge repositories not initialized".to_string());
    };

    // 2. SQLiteにプロジェクトを再作成
    if let Err(e) = repositories.projects().save(&deleted_project, user_id, timestamp).await {
        return Err(format!("Failed to recreate project in SQLite: {:?}", e));
    }

    // 3. Automergeでdeleted=falseに設定（復元操作を記録）
    if let Some(automerge) = repositories.automerge_repositories() {
        let automerge_guard = automerge.read().await;
        if let Err(e) = automerge_guard.projects.restore_project(id, user_id, timestamp).await {
            // Automerge復元失敗 → SQLiteから再削除してロールバック
            if let Err(delete_err) = repositories.projects().delete(id).await {
                tracing::error!(
                    "Failed to restore Automerge and cleanup SQLite also failed: automerge={:?}, sqlite={:?}",
                    e, delete_err
                );
            }
            return Err(format!("Failed to restore project in Automerge: {:?}", e));
        }
    }

    Ok(true)
}
