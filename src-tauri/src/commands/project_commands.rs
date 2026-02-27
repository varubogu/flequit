use crate::models::project::{ProjectCommandModel, ProjectTreeCommandModel};
use crate::models::project_search_request::ProjectSearchRequest;
use crate::models::CommandModelConverter;
use crate::state::AppState;
use chrono::Utc;
use flequit_core::facades::project_facades;
use flequit_core::services::{tag_service, task_list_service};
use flequit_model::models::{task_projects::project::PartialProject, ModelConverter};
use flequit_model::types::id_types::{ProjectId, UserId};
use tauri::State;
use tracing::instrument;

#[instrument(level = "info", skip(state, project), fields(project_id = %project.id))]
#[tauri::command]
pub async fn create_project(
    state: State<'_, AppState>,
    project: ProjectCommandModel,
    user_id: String,
) -> Result<bool, String> {
    let user_id_typed = UserId::from(user_id);
    let repositories = state.repositories.read().await;
    let internal_project = project.to_model().await?;

    project_facades::create_project(&*repositories, &internal_project, &user_id_typed)
        .await
        .map_err(|e| {
            tracing::error!(target: "commands::project", command = "create_project", error = %e);
            e
        })
}

#[instrument(level = "info", skip(state), fields(project_id = %id))]
#[tauri::command]
pub async fn get_project(
    state: State<'_, AppState>,
    id: String,
) -> Result<Option<ProjectCommandModel>, String> {
    let repositories = state.repositories.read().await;
    let project_id = ProjectId::from(id);
    let result = project_facades::get_project(&*repositories, &project_id)
        .await
        .map_err(|e| {
            tracing::error!(target: "commands::project", command = "get_project", project_id = %project_id, error = %e);
            e
        })?;
    match result {
        Some(project) => Ok(Some(project.to_command_model().await?)),
        None => Ok(None),
    }
}

#[instrument(level = "info", skip(state), fields(name = ?condition.name))]
#[tauri::command]
pub async fn search_projects(
    state: State<'_, AppState>,
    condition: ProjectSearchRequest,
) -> Result<Vec<ProjectCommandModel>, String> {
    let repositories = state.repositories.read().await;

    let projects = project_facades::search_projects(
        &*repositories,
        condition.name.as_deref(),
        condition.status.as_ref(),
        condition.owner_id.as_deref(),
        condition.is_archived,
        condition.limit,
        condition.offset,
    )
    .await
    .map_err(|e| {
        tracing::error!(target: "commands::project", command = "search_projects", error = %e);
        e
    })?;

    let mut result = Vec::with_capacity(projects.len());
    for project in projects {
        result.push(project.to_command_model().await?);
    }

    Ok(result)
}

#[instrument(level = "info", skip(state, patch), fields(project_id = %id))]
#[tauri::command]
pub async fn update_project(
    state: State<'_, AppState>,
    id: String,
    patch: PartialProject,
    user_id: String,
) -> Result<bool, String> {
    let user_id_typed = UserId::from(user_id);
    let repositories = state.repositories.read().await;
    let project_id = ProjectId::from(id);
    project_facades::update_project(&*repositories, &project_id, &patch, &user_id_typed)
        .await
        .map_err(|e| {
            tracing::error!(target: "commands::project", command = "update_project", project_id = %project_id, error = %e);
            e
        })
}

#[instrument(level = "info", skip(state), fields(project_id = %id))]
#[tauri::command]
pub async fn delete_project(
    state: State<'_, AppState>,
    id: String,
    user_id: String,
) -> Result<bool, String> {
    let timestamp = Utc::now();
    let repositories = state.repositories.read().await;
    let project_id = ProjectId::from(id);
    let user_id_typed = UserId::from(user_id);
    project_facades::delete_project(&*repositories, &project_id, &user_id_typed, &timestamp)
        .await
        .map_err(|e| {
            tracing::error!(target: "commands::project", command = "delete_project", project_id = %project_id, error = %e);
            e
        })
}

#[instrument(level = "info", skip(state), fields(project_id = %id))]
#[tauri::command]
pub async fn restore_project(
    state: State<'_, AppState>,
    id: String,
    user_id: String,
) -> Result<bool, String> {
    let timestamp = Utc::now();
    let repositories = state.repositories.read().await;
    let project_id = ProjectId::from(id);
    let user_id_typed = UserId::from(user_id);
    project_facades::restore_project(&*repositories, &project_id, &user_id_typed, &timestamp)
        .await
        .map_err(|e| {
            tracing::error!(target: "commands::project", command = "restore_project", project_id = %project_id, error = %e);
            e
        })
}

#[instrument(level = "info", skip(state), fields(project_id = %id))]
#[tauri::command]
pub async fn get_project_with_tasks_and_tags(
    state: State<'_, AppState>,
    id: String,
) -> Result<Option<ProjectTreeCommandModel>, String> {
    let repositories = state.repositories.read().await;
    let project_id = ProjectId::from(id);

    // プロジェクト基本情報を取得
    let project = match project_facades::get_project(&*repositories, &project_id)
        .await
        .map_err(|e| {
            tracing::error!(target: "commands::project", command = "get_project_with_tasks_and_tags", step = "get_project", project_id = %project_id, error = %e);
            e
        })? {
        Some(p) => p,
        None => return Ok(None),
    };

    // プロジェクト内のタスクリスト（タスク・サブタスク含む）を取得
    let task_lists_with_tasks = task_list_service::get_task_lists_with_tasks(&*repositories, &project_id)
        .await
        .map_err(|e| {
            tracing::error!(target: "commands::project", command = "get_project_with_tasks_and_tags", step = "get_task_lists_with_tasks", project_id = %project_id, error = %e);
            e.to_string()
        })?;

    // プロジェクト内の全タグを取得
    let all_tags = tag_service::list_tags(&*repositories, &project_id)
        .await
        .map_err(|e| {
            tracing::error!(target: "commands::project", command = "get_project_with_tasks_and_tags", step = "list_tags", project_id = %project_id, error = %e);
            e.to_string()
        })?;

    // タスクリストをCommandModelに変換
    let mut task_list_commands = Vec::new();
    for task_list in task_lists_with_tasks {
        task_list_commands.push(task_list.to_command_model().await?);
    }

    // タグをCommandModelに変換
    let mut tag_commands = Vec::new();
    for tag in all_tags {
        tag_commands.push(tag.to_command_model().await?);
    }

    // ProjectTreeCommandModelを構築
    let project_tree_command = ProjectTreeCommandModel {
        id: project.id.to_string(),
        name: project.name,
        description: project.description,
        color: project.color,
        order_index: project.order_index,
        is_archived: project.is_archived,
        status: project.status,
        owner_id: project.owner_id.map(|id| id.to_string()),
        created_at: project.created_at.to_rfc3339(),
        updated_at: project.updated_at.to_rfc3339(),
        deleted: project.deleted,
        updated_by: project.updated_by.to_string(),
        task_lists: task_list_commands,
        all_tags: tag_commands,
    };

    Ok(Some(project_tree_command))
}
