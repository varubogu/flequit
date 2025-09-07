use chrono::Utc;
use flequit_model::types::task_types::TaskStatus;

use flequit_types::errors::service_error::ServiceError;
use flequit_model::models::task_projects::subtask::{PartialSubTask, SubTask};
use flequit_repository::repositories::base_repository_trait::Repository;
use flequit_repository::repositories::project_repository_trait::ProjectRepository;
use flequit_infrastructure::InfrastructureRepositoriesTrait;
use flequit_model::types::id_types::{SubTaskId, ProjectId};

#[tracing::instrument(level = "trace")]
pub async fn create_subtask(repositories: &dyn InfrastructureRepositoriesTrait, project_id: &ProjectId, subtask: &SubTask) -> Result<(), ServiceError> {
    let mut new_data = subtask.clone();
    let now = Utc::now();
    new_data.created_at = now;
    new_data.updated_at = now;

    repositories.sub_tasks().save(project_id, &new_data).await?;

    Ok(())
}

#[tracing::instrument(level = "trace")]
pub async fn get_subtask(repositories: &dyn InfrastructureRepositoriesTrait, project_id: &ProjectId, subtask_id: &SubTaskId) -> Result<Option<SubTask>, ServiceError> {
    Ok(repositories.sub_tasks().find_by_id(project_id, subtask_id).await?)
}

#[tracing::instrument(level = "trace")]
pub async fn list_subtasks(repositories: &dyn InfrastructureRepositoriesTrait, project_id: &ProjectId, task_id: &str) -> Result<Vec<SubTask>, ServiceError> {
    let all_subtasks = repositories.sub_tasks().find_all(project_id).await?;

    // task_idでフィルタリング
    let filtered_subtasks = all_subtasks
        .into_iter()
        .filter(|subtask| subtask.task_id.to_string() == task_id)
        .collect();

    Ok(filtered_subtasks)
}

#[tracing::instrument(level = "trace")]
pub async fn update_subtask(
    _repositories: &dyn InfrastructureRepositoriesTrait,
    _project_id: &ProjectId,
    _subtask_id: &SubTaskId,
    _patch: &PartialSubTask,
) -> Result<bool, ServiceError> {
    // TODO: Infrastructure層にpatchメソッドが実装されたら有効化
    Err(ServiceError::InternalError("SubTask patch method is not implemented".to_string()))
}

#[tracing::instrument(level = "trace")]
pub async fn delete_subtask(repositories: &dyn InfrastructureRepositoriesTrait, project_id: &ProjectId, subtask_id: &SubTaskId) -> Result<(), ServiceError> {
    repositories.sub_tasks().delete(project_id, subtask_id).await?;
    Ok(())
}

#[tracing::instrument(level = "trace")]
pub async fn toggle_completion(repositories: &dyn InfrastructureRepositoriesTrait, project_id: &ProjectId, subtask_id: &SubTaskId) -> Result<(), ServiceError> {
    // 既存のサブタスクを取得
    if let Some(mut subtask) = repositories.sub_tasks().find_by_id(project_id, subtask_id).await? {
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
        repositories.sub_tasks().save(project_id, &subtask).await?;
    }

    Ok(())
}
