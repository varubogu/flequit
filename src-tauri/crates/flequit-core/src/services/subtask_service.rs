use chrono::Utc;
use flequit_model::types::task_types::TaskStatus;

use flequit_infrastructure::InfrastructureRepositoriesTrait;
use flequit_model::models::task_projects::subtask::{PartialSubTask, SubTask};
use flequit_model::types::id_types::{ProjectId, SubTaskId, UserId};
use flequit_repository::repositories::project_patchable_trait::ProjectPatchable;
use flequit_repository::repositories::project_repository_trait::ProjectRepository;
use flequit_types::errors::service_error::ServiceError;

pub async fn create_subtask<R>(
    repositories: &R,
    project_id: &ProjectId,
    subtask: &SubTask,
    user_id: &UserId,
) -> Result<(), ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    let mut new_data = subtask.clone();
    let now = Utc::now();
    new_data.created_at = now;
    new_data.updated_at = now;

    repositories.sub_tasks().save(project_id, &new_data, user_id, &now).await?;

    Ok(())
}

pub async fn get_subtask<R>(
    repositories: &R,
    project_id: &ProjectId,
    subtask_id: &SubTaskId,
) -> Result<Option<SubTask>, ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    Ok(repositories
        .sub_tasks()
        .find_by_id(project_id, subtask_id)
        .await?)
}

pub async fn list_subtasks<R>(
    repositories: &R,
    project_id: &ProjectId,
    task_id: &str,
) -> Result<Vec<SubTask>, ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    let all_subtasks = repositories.sub_tasks().find_all(project_id).await?;

    // task_idでフィルタリング
    let filtered_subtasks = all_subtasks
        .into_iter()
        .filter(|subtask| subtask.task_id.to_string() == task_id)
        .collect();

    Ok(filtered_subtasks)
}

pub async fn update_subtask<R>(
    repositories: &R,
    project_id: &ProjectId,
    subtask_id: &SubTaskId,
    patch: &PartialSubTask,
    user_id: &UserId,
) -> Result<bool, ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    // プロジェクトスコープでパッチによる部分更新を実行
    let now = Utc::now();
    let changed = repositories
        .sub_tasks()
        .patch(project_id, subtask_id, patch, user_id, &now)
        .await?;
    Ok(changed)
}

pub async fn delete_subtask<R>(
    repositories: &R,
    project_id: &ProjectId,
    subtask_id: &SubTaskId,
) -> Result<(), ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    repositories
        .sub_tasks()
        .delete(project_id, subtask_id)
        .await?;
    Ok(())
}

pub async fn toggle_completion<R>(
    repositories: &R,
    project_id: &ProjectId,
    subtask_id: &SubTaskId,
    user_id: &UserId,
) -> Result<(), ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    // 既存のサブタスクを取得
    if let Some(mut subtask) = repositories
        .sub_tasks()
        .find_by_id(project_id, subtask_id)
        .await?
    {
        // 完了状態をトグル
        subtask.completed = !subtask.completed;

        // ステータスも更新（completedフラグと連動）
        subtask.status = if subtask.completed {
            TaskStatus::Completed
        } else {
            TaskStatus::NotStarted
        };

        // 更新日時を設定
        subtask.updated_at = Utc::now();

        // 保存
        let now = Utc::now();
        repositories.sub_tasks().save(project_id, &subtask, user_id, &now).await?;
    }

    Ok(())
}
