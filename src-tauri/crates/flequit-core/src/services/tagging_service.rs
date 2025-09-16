use flequit_infrastructure::InfrastructureRepositoriesTrait;
use flequit_model::models::task_projects::{subtask_tag::SubTaskTag, task_tag::TaskTag};
use flequit_model::types::id_types::{ProjectId, SubTaskId, TagId, TaskId};
use flequit_repository::repositories::project_repository_trait::ProjectRepository;
use flequit_repository::project_relation_repository_trait::ProjectRelationRepository;
use flequit_repository::base_repository_trait::Repository;
use flequit_types::errors::service_error::ServiceError;

/// TaskTagサービス操作


pub async fn add_task_tag_relation<R>(
    repositories: &R,
    project_id: &ProjectId,
    task_id: &TaskId,
    tag_id: &TagId,
) -> Result<(), ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    // タスクが存在するプロジェクトIDを取得
    let actual_project_id = find_project_id_by_task_id(repositories, project_id, task_id).await?;

    // タスクタグ関係を追加
    repositories
        .task_tags()
        .add(&actual_project_id, task_id, tag_id).await
        .map_err(|e| ServiceError::Repository(e))?;

    Ok(())
}


pub async fn remove_task_tag_relation<R>(
    repositories: &R,
    project_id: &ProjectId,
    task_id: &TaskId,
    tag_id: &TagId,
) -> Result<(), ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    // タスクが存在するプロジェクトIDを取得
    let actual_project_id = find_project_id_by_task_id(repositories, project_id, task_id).await?;

    // タスクタグ関係を削除
    repositories.task_tags().remove(&actual_project_id, task_id, tag_id).await
        .map_err(|e| ServiceError::Repository(e))?;

    Ok(())
}


pub async fn get_tag_ids_by_task_id<R>(
    repositories: &R,
    project_id: &ProjectId,
    task_id: &TaskId,
) -> Result<Vec<TagId>, ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    // リポジトリ経由でアクセス(実装待ち)
    let tag_ids = repositories.task_tags()
        .find_relations(project_id, task_id).await
        .map_err(|e| ServiceError::Repository(e))?;

    // 一時的な仮実装
    Ok(tag_ids.into_iter().map(|t| t.tag_id).collect())
}


pub async fn get_task_ids_by_tag_id<R>(
    repositories: &R,
    _project_id: &ProjectId,
    tag_id: &TagId,
) -> Result<Vec<TaskId>, ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    // タグIDからタスクIDを取得するため、全プロジェクトを検索
    let projects = repositories.projects().find_all().await
        .map_err(|e| ServiceError::Repository(e))?;

    let mut task_ids = Vec::new();
    for project in projects {
        let task_tags = repositories.task_tags().find_all(&project.id).await
            .map_err(|e| ServiceError::Repository(e))?;

        for task_tag in task_tags {
            if task_tag.tag_id == *tag_id {
                task_ids.push(task_tag.task_id);
            }
        }
    }

    Ok(task_ids)
}


pub async fn update_task_tag_relations<R>(
    repositories: &R,
    project_id: &ProjectId,
    task_id: &TaskId,
    tag_ids: &[TagId],
) -> Result<(), ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    // タスクが存在するプロジェクトIDを取得
    let actual_project_id = find_project_id_by_task_id(repositories, project_id, task_id).await?;

    // 既存のタスクタグ関係をすべて削除
    repositories.task_tags().remove_all(&actual_project_id, task_id).await
        .map_err(|e| ServiceError::Repository(e))?;

    // 新しいタグとの関係を作成
    for tag_id in tag_ids {
        repositories.task_tags().add(&actual_project_id, task_id, tag_id).await
            .map_err(|e| ServiceError::Repository(e))?;
    }

    Ok(())
}


pub async fn remove_all_task_tags_by_task_id<R>(
    repositories: &R,
    project_id: &ProjectId,
    task_id: &TaskId,
) -> Result<(), ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    // タスクが存在するプロジェクトIDを取得
    let actual_project_id = find_project_id_by_task_id(repositories, project_id, task_id).await?;

    // プロジェクト内のタスクタグ関係をすべて削除
    repositories.task_tags().remove_all(&actual_project_id, task_id).await
        .map_err(|e| ServiceError::Repository(e))?;
    Ok(())
}


pub async fn remove_all_task_tags_by_tag_id<R>(
    repositories: &R,
    _project_id: &ProjectId,
    tag_id: &TagId,
) -> Result<(), ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    // 全プロジェクトを検索して、指定されたタグに関連するタスクタグをすべて削除
    let projects = repositories.projects().find_all().await
        .map_err(|e| ServiceError::Repository(e))?;

    for project in projects {
        let task_tags = repositories.task_tags().find_all(&project.id).await
            .map_err(|e| ServiceError::Repository(e))?;

        for task_tag in task_tags {
            if task_tag.tag_id == *tag_id {
                repositories.task_tags().remove(&project.id, &task_tag.task_id, tag_id).await
                    .map_err(|e| ServiceError::Repository(e))?;
            }
        }
    }

    Ok(())
}


pub async fn get_all_task_tags<R>(
    repositories: &R,
    _project_id: &ProjectId,
) -> Result<Vec<TaskTag>, ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    // 全プロジェクトからタスクタグを取得
    let projects = repositories.projects().find_all().await
        .map_err(|e| ServiceError::Repository(e))?;

    let mut all_task_tags = Vec::new();
    for project in projects {
        let task_tags = repositories.task_tags().find_all(&project.id).await
            .map_err(|e| ServiceError::Repository(e))?;
        all_task_tags.extend(task_tags);
    }

    Ok(all_task_tags)
}

/// SubtaskTagサービス操作


pub async fn add_subtask_tag_relation<R>(
    repositories: &R,
    project_id: &ProjectId,
    subtask_id: &SubTaskId,
    tag_id: &TagId,
) -> Result<(), ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    // サブタスクが存在するプロジェクトIDを取得
    let actual_project_id = find_project_id_by_subtask_id(repositories, project_id, subtask_id).await?;

    // サブタスクタグ関係を追加
    repositories.subtask_tags().add(&actual_project_id, subtask_id, tag_id).await
        .map_err(|e| ServiceError::Repository(e))?;

    Ok(())
}


pub async fn remove_subtask_tag_relation<R>(
    repositories: &R,
    project_id: &ProjectId,
    subtask_id: &SubTaskId,
    tag_id: &TagId,
) -> Result<(), ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    // サブタスクが存在するプロジェクトIDを取得
    let actual_project_id = find_project_id_by_subtask_id(repositories, project_id, subtask_id).await?;

    // サブタスクタグ関係を削除
    repositories.subtask_tags().remove(&actual_project_id, subtask_id, tag_id).await
        .map_err(|e| ServiceError::Repository(e))?;

    Ok(())
}


pub async fn get_tag_ids_by_subtask_id<R>(
    repositories: &R,
    project_id: &ProjectId,
    subtask_id: &SubTaskId,
) -> Result<Vec<TagId>, ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    // サブタスクが存在するプロジェクトIDを取得
    let actual_project_id = find_project_id_by_subtask_id(repositories, project_id, subtask_id).await?;

    // サブタスクタグ関係から TagID を取得
    let subtask_tags = repositories.subtask_tags().find_relations(&actual_project_id, subtask_id).await
        .map_err(|e| ServiceError::Repository(e))?;

    Ok(subtask_tags.into_iter().map(|t| t.tag_id).collect())
}


pub async fn get_subtask_ids_by_tag_id<R>(
    repositories: &R,
    _project_id: &ProjectId,
    tag_id: &TagId,
) -> Result<Vec<SubTaskId>, ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    // タグIDからサブタスクIDを取得するため、全プロジェクトを検索
    let projects = repositories.projects().find_all().await
        .map_err(|e| ServiceError::Repository(e))?;

    let mut subtask_ids = Vec::new();
    for project in projects {
        let subtask_tags = repositories.subtask_tags().find_all(&project.id).await
            .map_err(|e| ServiceError::Repository(e))?;

        for subtask_tag in subtask_tags {
            if subtask_tag.tag_id == *tag_id {
                subtask_ids.push(subtask_tag.subtask_id);
            }
        }
    }

    Ok(subtask_ids)
}


pub async fn update_subtask_tag_relations<R>(
    repositories: &R,
    project_id: &ProjectId,
    subtask_id: &SubTaskId,
    tag_ids: &[TagId],
) -> Result<(), ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    // サブタスクが存在するプロジェクトIDを取得
    let actual_project_id = find_project_id_by_subtask_id(repositories, project_id, subtask_id).await?;

    // 既存のサブタスクタグ関係をすべて削除
    repositories.subtask_tags().remove_all(&actual_project_id, subtask_id).await
        .map_err(|e| ServiceError::Repository(e))?;

    // 新しいタグとの関係を作成
    for tag_id in tag_ids {
        repositories.subtask_tags().add(&actual_project_id, subtask_id, tag_id).await
            .map_err(|e| ServiceError::Repository(e))?;
    }

    Ok(())
}


pub async fn remove_all_subtask_tags_by_subtask_id<R>(
    repositories: &R,
    project_id: &ProjectId,
    subtask_id: &SubTaskId,
) -> Result<(), ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    // サブタスクが存在するプロジェクトIDを取得
    let actual_project_id = find_project_id_by_subtask_id(repositories, project_id, subtask_id).await?;

    // プロジェクト内のサブタスクタグ関係をすべて削除
    repositories.subtask_tags().remove_all(&actual_project_id, subtask_id).await
        .map_err(|e| ServiceError::Repository(e))?;

    Ok(())
}


pub async fn remove_all_subtask_tags_by_tag_id<R>(
    repositories: &R,
    _project_id: &ProjectId,
    tag_id: &TagId,
) -> Result<(), ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    // 全プロジェクトを検索して、指定されたタグに関連するサブタスクタグをすべて削除
    let projects = repositories.projects().find_all().await
        .map_err(|e| ServiceError::Repository(e))?;

    for project in projects {
        let subtask_tags = repositories.subtask_tags().find_all(&project.id).await
            .map_err(|e| ServiceError::Repository(e))?;

        for subtask_tag in subtask_tags {
            if subtask_tag.tag_id == *tag_id {
                repositories.subtask_tags().remove(&project.id, &subtask_tag.subtask_id, tag_id).await
                    .map_err(|e| ServiceError::Repository(e))?;
            }
        }
    }

    Ok(())
}


pub async fn get_all_subtask_tags<R>(
    repositories: &R,
    _project_id: &ProjectId,
) -> Result<Vec<SubTaskTag>, ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    // 全プロジェクトからサブタスクタグを取得
    let projects = repositories.projects().find_all().await
        .map_err(|e| ServiceError::Repository(e))?;

    let mut all_subtask_tags = Vec::new();
    for project in projects {
        let subtask_tags = repositories.subtask_tags().find_all(&project.id).await
            .map_err(|e| ServiceError::Repository(e))?;
        all_subtask_tags.extend(subtask_tags);
    }

    Ok(all_subtask_tags)
}

/// ヘルパー関数: タスクIDからプロジェクトIDを取得
async fn find_project_id_by_task_id<R>(
    repositories: &R,
    _project_id: &ProjectId,
    task_id: &TaskId,
) -> Result<ProjectId, ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    // 全プロジェクトを取得してタスクを検索
    let projects = repositories.projects().find_all().await
        .map_err(|e| ServiceError::Repository(e))?;

    for project in projects {
        let tasks = repositories.tasks().find_all(&project.id).await
            .map_err(|e| ServiceError::Repository(e))?;

        if tasks.iter().any(|task| task.id == *task_id) {
            return Ok(project.id);
        }
    }

    Err(ServiceError::ValidationError(format!("Task with ID {} not found in any project", task_id)))
}

/// ヘルパー関数: サブタスクIDからプロジェクトIDを取得
async fn find_project_id_by_subtask_id<R>(
    repositories: &R,
    _project_id: &ProjectId,
    subtask_id: &SubTaskId,
) -> Result<ProjectId, ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    // 全プロジェクトを取得してサブタスクを検索
    let projects = repositories.projects().find_all().await
        .map_err(|e| ServiceError::Repository(e))?;

    for project in projects {
        let subtasks = repositories.sub_tasks().find_all(&project.id).await
            .map_err(|e| ServiceError::Repository(e))?;

        if subtasks.iter().any(|subtask| subtask.id == *subtask_id) {
            return Ok(project.id);
        }
    }

    Err(ServiceError::ValidationError(format!("SubTask with ID {} not found in any project", subtask_id)))
}
