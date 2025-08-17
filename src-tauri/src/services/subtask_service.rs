use chrono::Utc;

use crate::errors::service_error::ServiceError;
use crate::models::subtask::SubTask;
use crate::repositories::base_repository_trait::Repository;
use crate::repositories::Repositories;
use crate::types::id_types::SubTaskId;

pub async fn create_subtask(subtask: &SubTask) -> Result<(), ServiceError> {
    let mut new_data = subtask.clone();
    let now = Utc::now();
    new_data.created_at = now;
    new_data.updated_at = now;

    let repository = Repositories::new().await?;
    repository.sub_tasks.save(&new_data).await?;

    Ok(())
}

pub async fn get_subtask(subtask_id: &SubTaskId) -> Result<Option<SubTask>, ServiceError> {
    let repository = Repositories::new().await?;
    Ok(repository.sub_tasks.find_by_id(subtask_id).await?)
}

pub async fn list_subtasks(task_id: &str) -> Result<Vec<SubTask>, ServiceError> {
    // 一時的に空のVecを返す
    let _ = task_id;
    let repository = Repositories::new().await?;
    Ok(repository.sub_tasks.find_all().await?)
}

pub async fn update_subtask(subtask: &SubTask) -> Result<(), ServiceError> {
    let repository = Repositories::new().await?;
    repository.sub_tasks.save(subtask).await?;
    Ok(())
}

pub async fn delete_subtask(subtask_id: &SubTaskId) -> Result<(), ServiceError> {
    let repository = Repositories::new().await?;
    repository.sub_tasks.delete(subtask_id).await?;
    Ok(())
}

pub async fn toggle_completion(subtask_id: &SubTaskId) -> Result<(), ServiceError> {
    // 一時的に何もしない
    let _ = subtask_id;
    Ok(())
}
