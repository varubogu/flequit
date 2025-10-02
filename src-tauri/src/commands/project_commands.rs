use crate::models::project::{ProjectCommandModel, ProjectTreeCommandModel};
use crate::models::CommandModelConverter;
use crate::state::AppState;
use flequit_core::facades::project_facades;
use flequit_core::services::{tag_service, task_list_service};
use flequit_model::models::{task_projects::project::PartialProject, ModelConverter};
use flequit_model::types::id_types::ProjectId;
use tauri::State;
use tracing::instrument;

#[instrument(level = "info", skip(state, project), fields(project_id = %project.id))]
#[tauri::command]
pub async fn create_project(
    state: State<'_, AppState>,
    project: ProjectCommandModel,
) -> Result<bool, String> {
    let repositories = state.repositories.read().await;
    let internal_project = project.to_model().await?;

    project_facades::create_project(&*repositories, &internal_project)
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

#[instrument(level = "info", skip(state, patch), fields(project_id = %id))]
#[tauri::command]
pub async fn update_project(
    state: State<'_, AppState>,
    id: String,
    patch: PartialProject,
) -> Result<bool, String> {
    let repositories = state.repositories.read().await;
    let project_id = ProjectId::from(id);
    project_facades::update_project(&*repositories, &project_id, &patch)
        .await
        .map_err(|e| {
            tracing::error!(target: "commands::project", command = "update_project", project_id = %project_id, error = %e);
            e
        })
}

#[instrument(level = "info", skip(state), fields(project_id = %id))]
#[tauri::command]
pub async fn delete_project(state: State<'_, AppState>, id: String) -> Result<bool, String> {
    let repositories = state.repositories.read().await;
    let project_id = ProjectId::from(id);
    project_facades::delete_project(&*repositories, &project_id)
        .await
        .map_err(|e| {
            tracing::error!(target: "commands::project", command = "delete_project", project_id = %project_id, error = %e);
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
        task_lists: task_list_commands,
        all_tags: tag_commands,
    };

    Ok(Some(project_tree_command))
}
