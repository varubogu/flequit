use crate::models::task_assignment::TaskAssignmentCommandModel;
use crate::state::AppState;
use flequit_core::facades::task_assignment_facades as facades;
use flequit_model::types::id_types::{ProjectId, TaskId, UserId};
use tauri::State;

#[tauri::command]
pub async fn create_task_assignment(
    state: State<'_, AppState>,
    project_id: String,
    task_assignment: TaskAssignmentCommandModel,
) -> Result<bool, String> {
    let project_id = match ProjectId::try_from_str(&project_id) {
        Ok(id) => id,
        Err(err) => return Err(err.to_string()),
    };
    let task_id = TaskId::from(task_assignment.task_id);
    let user_id = UserId::from(task_assignment.user_id);
    let repositories = state.repositories.read().await;
    facades::add(&*repositories, &project_id, &task_id, &user_id)
        .await
        .map_err(|e| {
            tracing::error!(target: "commands::task_assignment", command = "create_task_assignment", project_id = %project_id, task_id = %task_id, user_id = %user_id, error = %e);
            e
        })
}

#[tauri::command]
pub async fn delete_task_assignment(
    state: State<'_, AppState>,
    project_id: String,
    task_id: String,
    user_id: String,
) -> Result<bool, String> {
    let project_id_typed = match ProjectId::try_from_str(&project_id) {
        Ok(id) => id,
        Err(err) => return Err(err.to_string()),
    };
    let task_id_typed = TaskId::from(task_id);
    let user_id_typed = UserId::from(user_id);
    let repositories = state.repositories.read().await;
    facades::remove(&*repositories, &project_id_typed, &task_id_typed, &user_id_typed)
        .await
        .map_err(|e| {
            tracing::error!(target: "commands::task_assignment", command = "delete_task_assignment", project_id = %project_id_typed, task_id = %task_id_typed, user_id = %user_id_typed, error = %e);
            e
        })
}
