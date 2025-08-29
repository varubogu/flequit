
use crate::errors::service_error::ServiceError;
use flequit_model::models::tagging::{TaskTag, SubtaskTag};
use flequit_model::types::id_types::{TaskId, SubTaskId, TagId};
use crate::repositories::Repositories;

/// TaskTagサービス操作

#[tracing::instrument(level = "trace")]
pub async fn add_task_tag_relation(task_id: &TaskId, tag_id: &TagId) -> Result<(), ServiceError> {
    let _repository = Repositories::instance().await;
    // TODO: TaskTagRepositoryTraitの実装後に、repository.task_tags.add_relation(task_id, tag_id).await?;
    // 一時的に直接SQLite実装にアクセス
    let sqlite_repos = flequit_storage::infrastructure::local_sqlite::local_sqlite_repositories::LocalSqliteRepositories::new().await?;
    sqlite_repos.task_tags.add_relation(task_id, tag_id).await?;
    Ok(())
}

#[tracing::instrument(level = "trace")]
pub async fn remove_task_tag_relation(task_id: &TaskId, tag_id: &TagId) -> Result<(), ServiceError> {
    let sqlite_repos = flequit_storage::infrastructure::local_sqlite::local_sqlite_repositories::LocalSqliteRepositories::new().await?;
    sqlite_repos.task_tags.remove_relation(task_id, tag_id).await?;
    Ok(())
}

#[tracing::instrument(level = "trace")]
pub async fn get_tag_ids_by_task_id(task_id: &TaskId) -> Result<Vec<TagId>, ServiceError> {
    let sqlite_repos = flequit_storage::infrastructure::local_sqlite::local_sqlite_repositories::LocalSqliteRepositories::new().await?;
    let tag_ids = sqlite_repos.task_tags.find_tag_ids_by_task_id(task_id).await?;
    Ok(tag_ids)
}

#[tracing::instrument(level = "trace")]
pub async fn get_task_ids_by_tag_id(tag_id: &TagId) -> Result<Vec<TaskId>, ServiceError> {
    let sqlite_repos = flequit_storage::infrastructure::local_sqlite::local_sqlite_repositories::LocalSqliteRepositories::new().await?;
    let task_ids = sqlite_repos.task_tags.find_task_ids_by_tag_id(tag_id).await?;
    Ok(task_ids)
}

#[tracing::instrument(level = "trace")]
pub async fn update_task_tag_relations(task_id: &TaskId, tag_ids: &[TagId]) -> Result<(), ServiceError> {
    let sqlite_repos = flequit_storage::infrastructure::local_sqlite::local_sqlite_repositories::LocalSqliteRepositories::new().await?;
    sqlite_repos.task_tags.remove_all_relations_by_task_id(task_id).await?;
    
    for tag_id in tag_ids {
        sqlite_repos.task_tags.add_relation(task_id, tag_id).await?;
    }
    
    Ok(())
}

#[tracing::instrument(level = "trace")]
pub async fn remove_all_task_tags_by_task_id(task_id: &TaskId) -> Result<(), ServiceError> {
    let sqlite_repos = flequit_storage::infrastructure::local_sqlite::local_sqlite_repositories::LocalSqliteRepositories::new().await?;
    sqlite_repos.task_tags.remove_all_relations_by_task_id(task_id).await?;
    Ok(())
}

#[tracing::instrument(level = "trace")]
pub async fn remove_all_task_tags_by_tag_id(tag_id: &TagId) -> Result<(), ServiceError> {
    let sqlite_repos = flequit_storage::infrastructure::local_sqlite::local_sqlite_repositories::LocalSqliteRepositories::new().await?;
    sqlite_repos.task_tags.remove_all_relations_by_tag_id(tag_id).await?;
    Ok(())
}

#[tracing::instrument(level = "trace")]
pub async fn get_all_task_tags() -> Result<Vec<TaskTag>, ServiceError> {
    let sqlite_repos = flequit_storage::infrastructure::local_sqlite::local_sqlite_repositories::LocalSqliteRepositories::new().await?;
    // 全ての関係を取得してTaskTagモデルに変換
    // TODO: SQLite実装からTaskTagエンティティを直接取得する方法を実装
    // 一時的に空のベクタを返す
    Ok(Vec::new())
}

/// SubtaskTagサービス操作

#[tracing::instrument(level = "trace")]
pub async fn add_subtask_tag_relation(subtask_id: &SubTaskId, tag_id: &TagId) -> Result<(), ServiceError> {
    let sqlite_repos = flequit_storage::infrastructure::local_sqlite::local_sqlite_repositories::LocalSqliteRepositories::new().await?;
    sqlite_repos.subtask_tags.add_relation(subtask_id, tag_id).await?;
    Ok(())
}

#[tracing::instrument(level = "trace")]
pub async fn remove_subtask_tag_relation(subtask_id: &SubTaskId, tag_id: &TagId) -> Result<(), ServiceError> {
    let sqlite_repos = flequit_storage::infrastructure::local_sqlite::local_sqlite_repositories::LocalSqliteRepositories::new().await?;
    sqlite_repos.subtask_tags.remove_relation(subtask_id, tag_id).await?;
    Ok(())
}

#[tracing::instrument(level = "trace")]
pub async fn get_tag_ids_by_subtask_id(subtask_id: &SubTaskId) -> Result<Vec<TagId>, ServiceError> {
    let sqlite_repos = flequit_storage::infrastructure::local_sqlite::local_sqlite_repositories::LocalSqliteRepositories::new().await?;
    let tag_ids = sqlite_repos.subtask_tags.find_tag_ids_by_subtask_id(subtask_id).await?;
    Ok(tag_ids)
}

#[tracing::instrument(level = "trace")]
pub async fn get_subtask_ids_by_tag_id(tag_id: &TagId) -> Result<Vec<SubTaskId>, ServiceError> {
    let sqlite_repos = flequit_storage::infrastructure::local_sqlite::local_sqlite_repositories::LocalSqliteRepositories::new().await?;
    let subtask_ids = sqlite_repos.subtask_tags.find_subtask_ids_by_tag_id(tag_id).await?;
    Ok(subtask_ids)
}

#[tracing::instrument(level = "trace")]
pub async fn update_subtask_tag_relations(subtask_id: &SubTaskId, tag_ids: &[TagId]) -> Result<(), ServiceError> {
    let sqlite_repos = flequit_storage::infrastructure::local_sqlite::local_sqlite_repositories::LocalSqliteRepositories::new().await?;
    sqlite_repos.subtask_tags.remove_all_relations_by_subtask_id(subtask_id).await?;
    
    for tag_id in tag_ids {
        sqlite_repos.subtask_tags.add_relation(subtask_id, tag_id).await?;
    }
    
    Ok(())
}

#[tracing::instrument(level = "trace")]
pub async fn remove_all_subtask_tags_by_subtask_id(subtask_id: &SubTaskId) -> Result<(), ServiceError> {
    let sqlite_repos = flequit_storage::infrastructure::local_sqlite::local_sqlite_repositories::LocalSqliteRepositories::new().await?;
    sqlite_repos.subtask_tags.remove_all_relations_by_subtask_id(subtask_id).await?;
    Ok(())
}

#[tracing::instrument(level = "trace")]
pub async fn remove_all_subtask_tags_by_tag_id(tag_id: &TagId) -> Result<(), ServiceError> {
    let sqlite_repos = flequit_storage::infrastructure::local_sqlite::local_sqlite_repositories::LocalSqliteRepositories::new().await?;
    sqlite_repos.subtask_tags.remove_all_relations_by_tag_id(tag_id).await?;
    Ok(())
}

#[tracing::instrument(level = "trace")]
pub async fn get_all_subtask_tags() -> Result<Vec<SubtaskTag>, ServiceError> {
    // TODO: SQLite実装からSubtaskTagエンティティを直接取得する方法を実装
    // 一時的に空のベクタを返す
    Ok(Vec::new())
}