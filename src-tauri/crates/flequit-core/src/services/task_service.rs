use chrono::Utc;
use flequit_infrastructure::InfrastructureRepositoriesTrait;
use flequit_model::models::task_projects::task::{PartialTask, Task};
use flequit_model::types::id_types::{ProjectId, TaskId, UserId};
use flequit_model::types::task_types::TaskStatus;
use flequit_repository::repositories::project_repository_trait::ProjectRepository;
use flequit_repository::repositories::project_patchable_trait::ProjectPatchable;
use flequit_types::errors::service_error::ServiceError;


pub async fn create_task<R>(
    repositories: &R,
    project_id: &ProjectId,
    task: &Task,
) -> Result<(), ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    repositories.tasks().save(project_id, task).await?;
    Ok(())
}

pub async fn get_task<R>(
    repositories: &R,
    project_id: &ProjectId,
    task_id: &TaskId,
) -> Result<Option<Task>, ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    Ok(repositories.tasks().find_by_id(project_id, task_id).await?)
}

pub async fn list_tasks<R>(
    repositories: &R,
    project_id: &ProjectId,
) -> Result<Vec<Task>, ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    Ok(repositories.tasks().find_all(project_id).await?)
}

pub async fn update_task<R>(
    repositories: &R,
    project_id: &ProjectId,
    task_id: &TaskId,
    patch: &PartialTask,
) -> Result<bool, ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    Ok(repositories.tasks().patch(project_id, task_id, patch).await?)
}

pub async fn delete_task<R>(
    repositories: &R,
    project_id: &ProjectId,
    task_id: &TaskId,
) -> Result<(), ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    repositories.tasks().delete(project_id, task_id).await?;
    Ok(())
}

pub async fn list_tasks_by_assignee<R>(
    repositories: &R,
    project_id: &str,
    user_id: &str,
) -> Result<Vec<Task>, ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    let project_id_typed = ProjectId::from(project_id.to_string());
    let all_tasks = repositories.tasks().find_all(&project_id_typed).await?;

    // user_idでフィルタリング
    let filtered_tasks = all_tasks
        .into_iter()
        .filter(|task| {
            task.assigned_user_ids
                .iter()
                .any(|id| id.to_string() == user_id)
        })
        .collect();

    Ok(filtered_tasks)
}

pub async fn list_tasks_by_status<R>(
    repositories: &R,
    project_id: &str,
    status: &TaskStatus,
) -> Result<Vec<Task>, ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    let project_id_typed = ProjectId::from(project_id.to_string());
    let all_tasks = repositories.tasks().find_all(&project_id_typed).await?;

    // statusでフィルタリング
    let filtered_tasks = all_tasks
        .into_iter()
        .filter(|task| task.status == *status)
        .collect();

    Ok(filtered_tasks)
}

pub async fn assign_task<R>(
    repositories: &R,
    project_id: &str,
    task_id: &str,
    assignee_id: Option<String>,
) -> Result<(), ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    // タスクIDから TaskId 型に変換
    let task_id_typed = TaskId::from(task_id.to_string());
    let project_id_typed = ProjectId::from(project_id.to_string());

    if let Some(mut task) = repositories
        .tasks()
        .find_by_id(&project_id_typed, &task_id_typed)
        .await?
    {
        // プロジェクトIDが一致するかチェック
        // project_idチェックをコメントアウト
        /*if task.project_id.to_string() != project_id {
            return Err(ServiceError::InternalError(
                "Task does not belong to the specified project".to_string(),
            ));
        }*/

        // assignee_idがある場合は追加、ない場合は全てクリア
        if let Some(assignee_id) = assignee_id {
            let user_id = UserId::from(assignee_id);
            // 既に含まれていない場合のみ追加
            if !task.assigned_user_ids.contains(&user_id) {
                task.assigned_user_ids.push(user_id);
            }
        } else {
            // assignee_idがNoneの場合は全てクリア
            task.assigned_user_ids.clear();
        }

        // 更新日時を設定
        task.updated_at = Utc::now();

        // 保存
        repositories.tasks().save(&project_id_typed, &task).await?;
    }

    Ok(())
}

pub async fn update_task_status<R>(
    repositories: &R,
    project_id: &str,
    task_id: &str,
    status: &TaskStatus,
) -> Result<(), ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    // タスクIDから TaskId 型に変換
    use TaskId;
    let task_id_typed = TaskId::from(task_id.to_string());
    let project_id_typed = ProjectId::from(project_id.to_string());

    if let Some(mut task) = repositories
        .tasks()
        .find_by_id(&project_id_typed, &task_id_typed)
        .await?
    {
        // プロジェクトIDが一致するかチェック
        // project_idチェックをコメントアウト
        /*if task.project_id.to_string() != project_id {
            return Err(ServiceError::InternalError(
                "Task does not belong to the specified project".to_string(),
            ));
        }*/

        // ステータス更新
        task.status = status.clone();

        // 更新日時を設定
        task.updated_at = Utc::now();

        // 保存
        repositories.tasks().save(&project_id_typed, &task).await?;
    }

    Ok(())
}

pub async fn update_task_priority<R>(
    repositories: &R,
    project_id: &str,
    task_id: &str,
    priority: i32,
) -> Result<(), ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    // タスクIDから TaskId 型に変換
    use TaskId;
    let task_id_typed = TaskId::from(task_id.to_string());
    let project_id_typed = ProjectId::from(project_id.to_string());

    if let Some(mut task) = repositories
        .tasks()
        .find_by_id(&project_id_typed, &task_id_typed)
        .await?
    {
        // プロジェクトIDが一致するかチェック
        // project_idチェックをコメントアウト
        /*if task.project_id.to_string() != project_id {
            return Err(ServiceError::InternalError(
                "Task does not belong to the specified project".to_string(),
            ));
        }*/

        // 優先度更新
        task.priority = priority;

        // 更新日時を設定
        task.updated_at = Utc::now();

        // 保存
        repositories.tasks().save(&project_id_typed, &task).await?;
    }

    Ok(())
}
