use crate::ports::infrastructure_repositories::*;
use crate::services::project_service;
use crate::InfrastructureRepositoriesTrait;
use chrono::{DateTime, Utc};
use flequit_model::models::task_projects::project::{PartialProject, Project};
use flequit_model::traits::TransactionManager;
use flequit_model::types::id_types::{ProjectId, UserId};
use flequit_repository::repositories::base_repository_trait::Repository;
use flequit_repository::repositories::project_repository_trait::ProjectRepository;
use flequit_types::errors::repository_error::RepositoryError;
use flequit_types::errors::service_error::ServiceError;
use sea_orm::DatabaseTransaction;

pub async fn create_project<R>(
    repositories: &R,
    project: &Project,
    user_id: &UserId,
) -> Result<bool, String>
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
    R: InfrastructureRepositoriesTrait
        + TransactionManager<Transaction = DatabaseTransaction>
        + Send
        + Sync,
{
    // 1. Automergeスナップショットを作成（ロールバック用）
    let snapshot = if let Some(automerge) = repositories.automerge_repositories() {
        let automerge_guard = automerge.read().await;
        match automerge_guard.projects_repo().create_snapshot(id).await {
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

    // 1. プロジェクト内の全タスクを削除（内部でSubTask、TaskTag、TaskAssignment、TaskRecurrenceも削除される）
    let task_ids = match sqlite_repos_guard
        .tasks_repo()
        .find_ids_by_project_id(id)
        .await
    {
        Ok(ids) => ids,
        Err(e) => {
            if let Err(rollback_err) = repositories.rollback(txn).await {
                return Err(format!(
                    "Failed to get task IDs: {:?} and rollback failed: {:?}",
                    e, rollback_err
                ));
            }
            return Err(format!("Failed to get task IDs: {:?}", e));
        }
    };

    for task_id in task_ids {
        // サブタスクを削除（内部でSubtaskTagsも削除される）
        if let Err(e) = sqlite_repos_guard
            .sub_tasks_repo()
            .remove_all_by_task_id_with_txn(&txn, id, &task_id.to_string())
            .await
        {
            if let Err(rollback_err) = repositories.rollback(txn).await {
                return Err(format!(
                    "Failed to delete subtasks for task {}: {:?} and rollback failed: {:?}",
                    task_id, e, rollback_err
                ));
            }
            return Err(format!(
                "Failed to delete subtasks for task {}: {:?}",
                task_id, e
            ));
        }

        // タスクタグの関連付けを削除
        if let Err(e) = sqlite_repos_guard
            .task_tags_repo()
            .remove_all_by_task_id_with_txn(&txn, id, &task_id)
            .await
        {
            if let Err(rollback_err) = repositories.rollback(txn).await {
                return Err(format!(
                    "Failed to delete task tags for task {}: {:?} and rollback failed: {:?}",
                    task_id, e, rollback_err
                ));
            }
            return Err(format!(
                "Failed to delete task tags for task {}: {:?}",
                task_id, e
            ));
        }

        // タスク割り当てを削除
        if let Err(e) = sqlite_repos_guard
            .task_assignments_repo()
            .remove_all_by_task_id_with_txn(&txn, &task_id)
            .await
        {
            if let Err(rollback_err) = repositories.rollback(txn).await {
                return Err(format!(
                    "Failed to delete task assignments for task {}: {:?} and rollback failed: {:?}",
                    task_id, e, rollback_err
                ));
            }
            return Err(format!(
                "Failed to delete task assignments for task {}: {:?}",
                task_id, e
            ));
        }

        // タスク繰り返しルールを削除
        if let Err(e) = sqlite_repos_guard
            .task_recurrences_repo()
            .remove_all_with_txn(&txn, id, &task_id)
            .await
        {
            if let Err(rollback_err) = repositories.rollback(txn).await {
                return Err(format!(
                    "Failed to delete task recurrences for task {}: {:?} and rollback failed: {:?}",
                    task_id, e, rollback_err
                ));
            }
            return Err(format!(
                "Failed to delete task recurrences for task {}: {:?}",
                task_id, e
            ));
        }

        // タスク本体を削除
        if let Err(e) = sqlite_repos_guard
            .tasks_repo()
            .delete_with_txn(&txn, id, &task_id)
            .await
        {
            if let Err(rollback_err) = repositories.rollback(txn).await {
                return Err(format!(
                    "Failed to delete task {}: {:?} and rollback failed: {:?}",
                    task_id, e, rollback_err
                ));
            }
            return Err(format!("Failed to delete task {}: {:?}", task_id, e));
        }
    }

    // 2. プロジェクト内の全タグを削除（Tag削除でTagBookmark、TaskTag、SubtaskTagも削除される）
    let tag_ids = match sqlite_repos_guard
        .tags_repo()
        .find_ids_by_project_id(id)
        .await
    {
        Ok(ids) => ids,
        Err(e) => {
            if let Err(rollback_err) = repositories.rollback(txn).await {
                return Err(format!(
                    "Failed to get tag IDs: {:?} and rollback failed: {:?}",
                    e, rollback_err
                ));
            }
            return Err(format!("Failed to get tag IDs: {:?}", e));
        }
    };

    for tag_id in tag_ids {
        // タグブックマークを削除
        if let Err(e) = sqlite_repos_guard
            .tag_bookmarks_repo()
            .remove_all_by_tag_id_with_txn(&txn, id, &tag_id)
            .await
        {
            if let Err(rollback_err) = repositories.rollback(txn).await {
                return Err(format!(
                    "Failed to delete tag bookmarks for tag {}: {:?} and rollback failed: {:?}",
                    tag_id, e, rollback_err
                ));
            }
            return Err(format!(
                "Failed to delete tag bookmarks for tag {}: {:?}",
                tag_id, e
            ));
        }

        // タスクタグの関連付けを削除（残っているものがあれば）
        if let Err(e) = sqlite_repos_guard
            .task_tags_repo()
            .remove_all_by_tag_id_with_txn(&txn, id, &tag_id)
            .await
        {
            if let Err(rollback_err) = repositories.rollback(txn).await {
                return Err(format!(
                    "Failed to delete task tags for tag {}: {:?} and rollback failed: {:?}",
                    tag_id, e, rollback_err
                ));
            }
            return Err(format!(
                "Failed to delete task tags for tag {}: {:?}",
                tag_id, e
            ));
        }

        // サブタスクタグの関連付けを削除（残っているものがあれば）
        if let Err(e) = sqlite_repos_guard
            .subtask_tags_repo()
            .remove_all_by_tag_id_with_txn(&txn, &tag_id)
            .await
        {
            if let Err(rollback_err) = repositories.rollback(txn).await {
                return Err(format!(
                    "Failed to delete subtask tags for tag {}: {:?} and rollback failed: {:?}",
                    tag_id, e, rollback_err
                ));
            }
            return Err(format!(
                "Failed to delete subtask tags for tag {}: {:?}",
                tag_id, e
            ));
        }

        // タグ本体を削除
        if let Err(e) = sqlite_repos_guard
            .tags_repo()
            .delete_with_txn(&txn, id, &tag_id)
            .await
        {
            if let Err(rollback_err) = repositories.rollback(txn).await {
                return Err(format!(
                    "Failed to delete tag {}: {:?} and rollback failed: {:?}",
                    tag_id, e, rollback_err
                ));
            }
            return Err(format!("Failed to delete tag {}: {:?}", tag_id, e));
        }
    }

    // 3. プロジェクト内の全TaskListを削除
    if let Err(e) = sqlite_repos_guard
        .task_lists_repo()
        .remove_all_by_project_id_with_txn(&txn, id)
        .await
    {
        if let Err(rollback_err) = repositories.rollback(txn).await {
            return Err(format!(
                "Failed to delete task lists: {:?} and rollback failed: {:?}",
                e, rollback_err
            ));
        }
        return Err(format!("Failed to delete task lists: {:?}", e));
    }

    // 4. プロジェクト本体を削除
    if let Err(e) = sqlite_repos_guard
        .projects_repo()
        .delete_with_txn(&txn, id)
        .await
    {
        if let Err(rollback_err) = repositories.rollback(txn).await {
            return Err(format!(
                "Failed to delete project: {:?} and rollback failed: {:?}",
                e, rollback_err
            ));
        }
        return Err(format!("Failed to delete project: {:?}", e));
    }

    drop(sqlite_repos_guard);

    // 5. Automerge論理削除をSQLiteコミット前に実行（子データ含む一括削除）
    if let Some(automerge) = repositories.automerge_repositories() {
        let automerge_guard = automerge.read().await;

        let automerge_result: Result<(), RepositoryError> = async {
            automerge_guard
                .projects_repo()
                .mark_all_tasks_deleted(id, user_id, timestamp)
                .await?;
            automerge_guard
                .projects_repo()
                .mark_all_tags_deleted(id, user_id, timestamp)
                .await?;
            automerge_guard
                .projects_repo()
                .mark_all_task_lists_deleted(id, user_id, timestamp)
                .await?;
            automerge_guard
                .projects_repo()
                .mark_project_deleted(id, user_id, timestamp)
                .await?;
            Ok(())
        }
        .await;

        if let Err(e) = automerge_result {
            // Automerge失敗 → スナップショットから復元
            if let Some(ref snap) = snapshot {
                if let Err(re) = automerge_guard
                    .projects_repo()
                    .restore_from_snapshot(id, snap)
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
                .restore_from_snapshot(id, &snap)
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

pub async fn restore_project<R>(
    repositories: &R,
    id: &ProjectId,
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

    // 1. Automergeから削除済みプロジェクトと子データを取得
    let deleted_project = match automerge_guard
        .projects_repo()
        .get_deleted_project(id)
        .await
    {
        Ok(Some(p)) => p,
        Ok(None) => return Err(format!("Project not found or not deleted: {}", id)),
        Err(e) => return Err(format!("Failed to get deleted project: {:?}", e)),
    };

    let deleted_task_lists = match automerge_guard
        .projects_repo()
        .get_deleted_task_lists(id)
        .await
    {
        Ok(lists) => lists,
        Err(e) => return Err(format!("Failed to get deleted task lists: {:?}", e)),
    };

    let deleted_tags = match automerge_guard.projects_repo().get_deleted_tags(id).await {
        Ok(tags) => tags,
        Err(e) => return Err(format!("Failed to get deleted tags: {:?}", e)),
    };

    let deleted_tasks = match automerge_guard.projects_repo().get_deleted_tasks(id).await {
        Ok(tasks) => tasks,
        Err(e) => return Err(format!("Failed to get deleted tasks: {:?}", e)),
    };

    // 2. SQLiteにプロジェクトを再作成
    if let Err(e) = repositories
        .projects()
        .save(&deleted_project, user_id, timestamp)
        .await
    {
        return Err(format!("Failed to recreate project in SQLite: {:?}", e));
    }

    // 3. SQLiteにタスクリストを再作成（タスクより先に復元）
    for task_list in &deleted_task_lists {
        if let Err(e) = repositories
            .task_lists()
            .save(id, task_list, user_id, timestamp)
            .await
        {
            if let Err(del_err) = repositories.projects().delete(id).await {
                tracing::error!(
                    "Restore task_list failed and project cleanup also failed: {:?} / {:?}",
                    e,
                    del_err
                );
            }
            return Err(format!("Failed to recreate task list in SQLite: {:?}", e));
        }
    }

    // 4. SQLiteにタグを再作成
    for tag in &deleted_tags {
        if let Err(e) = repositories.tags().save(id, tag, user_id, timestamp).await {
            if let Err(del_err) = repositories.projects().delete(id).await {
                tracing::error!(
                    "Restore tag failed and project cleanup also failed: {:?} / {:?}",
                    e,
                    del_err
                );
            }
            return Err(format!("Failed to recreate tag in SQLite: {:?}", e));
        }
    }

    // 5. SQLiteにタスクを再作成（タスクリストの後）
    for task in &deleted_tasks {
        if let Err(e) = repositories
            .tasks()
            .save(id, task, user_id, timestamp)
            .await
        {
            if let Err(del_err) = repositories.projects().delete(id).await {
                tracing::error!(
                    "Restore task failed and project cleanup also failed: {:?} / {:?}",
                    e,
                    del_err
                );
            }
            return Err(format!("Failed to recreate task in SQLite: {:?}", e));
        }
    }

    // 6. Automergeでプロジェクトを復元（deleted=false）
    if let Err(e) = automerge_guard
        .projects_repo()
        .restore_project(id, user_id, timestamp)
        .await
    {
        // Automerge復元失敗 → SQLiteから再削除してロールバック
        if let Err(del_err) = repositories.projects().delete(id).await {
            tracing::error!(
                "Failed to restore Automerge and cleanup SQLite also failed: automerge={:?}, sqlite={:?}",
                e, del_err
            );
        }
        return Err(format!("Failed to restore project in Automerge: {:?}", e));
    }

    // 7. Automergeで子データを復元（エラーはウォーニングのみ）
    if let Err(e) = automerge_guard
        .projects_repo()
        .restore_all_task_lists(id, user_id, timestamp)
        .await
    {
        tracing::warn!(
            "Failed to restore task lists in Automerge (non-fatal): {:?}",
            e
        );
    }
    if let Err(e) = automerge_guard
        .projects_repo()
        .restore_all_tags(id, user_id, timestamp)
        .await
    {
        tracing::warn!("Failed to restore tags in Automerge (non-fatal): {:?}", e);
    }
    if let Err(e) = automerge_guard
        .projects_repo()
        .restore_all_tasks(id, user_id, timestamp)
        .await
    {
        tracing::warn!("Failed to restore tasks in Automerge (non-fatal): {:?}", e);
    }

    Ok(true)
}
