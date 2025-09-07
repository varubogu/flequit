use flequit_types::errors::service_error::ServiceError;
use flequit_model::models::task_projects::{task_tag::TaskTag, subtask_tag::SubTaskTag};
use flequit_model::types::id_types::{TaskId, SubTaskId, TagId};
use flequit_infrastructure::InfrastructureRepositoriesTrait;

/// TaskTagサービス操作

#[tracing::instrument(level = "trace")]
pub async fn add_task_tag_relation(repositories: &dyn InfrastructureRepositoriesTrait, task_id: &TaskId, tag_id: &TagId) -> Result<(), ServiceError> {
    // リポジトリ経由でアクセス(実装待ち)
    // repositories.task_tags.add_relation(task_id, tag_id).await
    //     .map_err(|e| ServiceError::RepositoryError(format!("{:?}", e)))?;

    // 一時的な仮実装 - 実際はリポジトリ層を経由する
    Ok(())
}

#[tracing::instrument(level = "trace")]
pub async fn remove_task_tag_relation(repositories: &dyn InfrastructureRepositoriesTrait, task_id: &TaskId, tag_id: &TagId) -> Result<(), ServiceError> {
    // リポジトリ経由でアクセス(実装待ち)
    // repositories.task_tags.remove_relation(task_id, tag_id).await
    //     .map_err(|e| ServiceError::RepositoryError(format!("{:?}", e)))?;
    Ok(())
}

#[tracing::instrument(level = "trace")]
pub async fn get_tag_ids_by_task_id(repositories: &dyn InfrastructureRepositoriesTrait, task_id: &TaskId) -> Result<Vec<TagId>, ServiceError> {
    // リポジトリ経由でアクセス(実装待ち)
    // let tag_ids = repositories.task_tags.find_tag_ids_by_task_id(task_id).await
    //     .map_err(|e| ServiceError::RepositoryError(format!("{:?}", e)))?;

    // 一時的な仮実装
    Ok(Vec::new())
}

#[tracing::instrument(level = "trace")]
pub async fn get_task_ids_by_tag_id(repositories: &dyn InfrastructureRepositoriesTrait, tag_id: &TagId) -> Result<Vec<TaskId>, ServiceError> {
    // リポジトリ経由でアクセス(実装待ち)
    // let task_ids = repositories.task_tags().find_task_ids_by_tag_id(tag_id).await
    //     .map_err(|e| ServiceError::Repository(format!("{:?}", e)))?;

    // 一時的な仮実装
    Ok(Vec::new())
}

#[tracing::instrument(level = "trace")]
pub async fn update_task_tag_relations(repositories: &dyn InfrastructureRepositoriesTrait, task_id: &TaskId, tag_ids: &[TagId]) -> Result<(), ServiceError> {
    // リポジトリ経由でアクセス(実装待ち)
    // repositories.task_tags.update_relations(task_id, tag_ids).await
    //     .map_err(|e| ServiceError::RepositoryError(format!("{:?}", e)))?;

    Ok(())
}

#[tracing::instrument(level = "trace")]
pub async fn remove_all_task_tags_by_task_id(repositories: &dyn InfrastructureRepositoriesTrait, task_id: &TaskId) -> Result<(), ServiceError> {
    // リポジトリ経由でアクセス(実装待ち)
    // repositories.task_tags.remove_all_by_task_id(task_id).await
    //     .map_err(|e| ServiceError::RepositoryError(format!("{:?}", e)))?;
    Ok(())
}

#[tracing::instrument(level = "trace")]
pub async fn remove_all_task_tags_by_tag_id(repositories: &dyn InfrastructureRepositoriesTrait, tag_id: &TagId) -> Result<(), ServiceError> {
    // リポジトリ経由でアクセス(実装待ち)
    // repositories.task_tags.remove_all_by_tag_id(tag_id).await
    //     .map_err(|e| ServiceError::RepositoryError(format!("{:?}", e)))?;
    Ok(())
}

#[tracing::instrument(level = "trace")]
pub async fn get_all_task_tags(repositories: &dyn InfrastructureRepositoriesTrait) -> Result<Vec<TaskTag>, ServiceError> {
    // リポジトリ経由でアクセス(実装待ち)
    // let task_tags = repositories.task_tags.find_all().await
    //     .map_err(|e| ServiceError::RepositoryError(format!("{:?}", e)))?;
    // Ok(task_tags)

    Ok(Vec::new())
}

/// SubtaskTagサービス操作

#[tracing::instrument(level = "trace")]
pub async fn add_subtask_tag_relation(repositories: &dyn InfrastructureRepositoriesTrait, subtask_id: &SubTaskId, tag_id: &TagId) -> Result<(), ServiceError> {
    // リポジトリ経由でアクセス(実装待ち)
    // repositories.subtask_tags.add_relation(subtask_id, tag_id).await
    //     .map_err(|e| ServiceError::RepositoryError(format!("{:?}", e)))?;
    Ok(())
}

#[tracing::instrument(level = "trace")]
pub async fn remove_subtask_tag_relation(repositories: &dyn InfrastructureRepositoriesTrait, subtask_id: &SubTaskId, tag_id: &TagId) -> Result<(), ServiceError> {
    // リポジトリ経由でアクセス(実装待ち)
    // repositories.subtask_tags.remove_relation(subtask_id, tag_id).await
    //     .map_err(|e| ServiceError::RepositoryError(format!("{:?}", e)))?;
    Ok(())
}

#[tracing::instrument(level = "trace")]
pub async fn get_tag_ids_by_subtask_id(repositories: &dyn InfrastructureRepositoriesTrait, subtask_id: &SubTaskId) -> Result<Vec<TagId>, ServiceError> {
    // リポジトリ経由でアクセス(実装待ち)
    // let tag_ids = repositories.subtask_tags.find_tag_ids_by_subtask_id(subtask_id).await
    //     .map_err(|e| ServiceError::RepositoryError(format!("{:?}", e)))?;

    // 一時的な仮実装
    Ok(Vec::new())
}

#[tracing::instrument(level = "trace")]
pub async fn get_subtask_ids_by_tag_id(repositories: &dyn InfrastructureRepositoriesTrait, tag_id: &TagId) -> Result<Vec<SubTaskId>, ServiceError> {
    // リポジトリ経由でアクセス(実装待ち)
    // let subtask_ids = repositories.subtask_tags.find_subtask_ids_by_tag_id(tag_id).await
    //     .map_err(|e| ServiceError::RepositoryError(format!("{:?}", e)))?;

    // 一時的な仮実装
    Ok(Vec::new())
}

#[tracing::instrument(level = "trace")]
pub async fn update_subtask_tag_relations(repositories: &dyn InfrastructureRepositoriesTrait, subtask_id: &SubTaskId, tag_ids: &[TagId]) -> Result<(), ServiceError> {
    // リポジトリ経由でアクセス(実装待ち)
    // repositories.subtask_tags.update_relations(subtask_id, tag_ids).await
    //     .map_err(|e| ServiceError::RepositoryError(format!("{:?}", e)))?;

    Ok(())
}

#[tracing::instrument(level = "trace")]
pub async fn remove_all_subtask_tags_by_subtask_id(repositories: &dyn InfrastructureRepositoriesTrait, subtask_id: &SubTaskId) -> Result<(), ServiceError> {
    // リポジトリ経由でアクセス(実装待ち)
    // repositories.subtask_tags.remove_all_by_subtask_id(subtask_id).await
    //     .map_err(|e| ServiceError::RepositoryError(format!("{:?}", e)))?;

    Ok(())
}

#[tracing::instrument(level = "trace")]
pub async fn remove_all_subtask_tags_by_tag_id(repositories: &dyn InfrastructureRepositoriesTrait, tag_id: &TagId) -> Result<(), ServiceError> {
    // リポジトリ経由でアクセス(実装待ち)
    // repositories.subtask_tags.remove_all_by_tag_id(tag_id).await
    //     .map_err(|e| ServiceError::RepositoryError(format!("{:?}", e)))?;

    Ok(())
}

#[tracing::instrument(level = "trace")]
pub async fn get_all_subtask_tags(repositories: &dyn InfrastructureRepositoriesTrait) -> Result<Vec<SubTaskTag>, ServiceError> {
    // リポジトリ経由でアクセス(実装待ち)
    // let subtask_tags = repositories.subtask_tags.find_all().await
    //     .map_err(|e| ServiceError::RepositoryError(format!("{:?}", e)))?;
    // Ok(subtask_tags)

    // 一時的な仮実装
    Ok(Vec::new())
}
