use crate::errors::service_error::ServiceError;
use crate::models::subtask::SubTask;
use crate::repositories::base_repository_trait::Repository;
use crate::repositories::unified::UnifiedRepositories;
use crate::types::id_types::SubTaskId;

pub async fn create_subtask(project_id: &str, subtask: &SubTask) -> Result<(), ServiceError> {
    if project_id.trim().is_empty() || subtask.title.trim().is_empty() {
        return Err(ServiceError::ValidationError(
            "Project ID and Subtask title cannot be empty".to_string(),
        ));
    }
    let repository = UnifiedRepositories::new().await?;
    repository.sub_tasks.save(subtask).await?;
    Ok(())
}

pub async fn get_subtask(subtask_id: &SubTaskId) -> Result<Option<SubTask>, ServiceError> {
    let repository = UnifiedRepositories::new().await?;
    // ProjectsRepositoryのget_subtaskはproject_idとsubtask_idのみ必要（task_idは使用されない）
    Ok(repository.sub_tasks.find_by_id(subtask_id).await?)
}

pub async fn list_subtasks(task_id: &str) -> Result<Vec<SubTask>, ServiceError> {
    // 一時的に空のVecを返す
    let _ = task_id;
    Ok(Vec::new())
}

pub async fn update_subtask(subtask: &SubTask) -> Result<(), ServiceError> {
    let repository = UnifiedRepositories::new().await?;
    repository.sub_tasks.save(subtask).await?;
    Ok(())
}

pub async fn delete_subtask(subtask_id: &SubTaskId) -> Result<(), ServiceError> {
    // 一時的に何もしない
    let _ = (subtask_id);
    Ok(())
}

pub async fn toggle_completion(subtask_id: &SubTaskId) -> Result<(), ServiceError> {
    // 一時的に何もしない
    let _ = (subtask_id);
    Ok(())
}
