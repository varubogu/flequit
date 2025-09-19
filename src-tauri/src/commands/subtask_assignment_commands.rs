use crate::models::subtask_assignment::SubtaskAssignmentCommandModel;
use crate::state::AppState;
use flequit_core::facades::subtask_assignment_facades as facades;
use flequit_model::types::id_types::{ProjectId, SubTaskId, UserId};
use tauri::State;

#[tauri::command]
pub async fn create_subtask_assignment(
    state: State<'_, AppState>,
    project_id: String,
    subtask_assignment: SubtaskAssignmentCommandModel,
) -> Result<bool, String> {
    let project_id_typed = match ProjectId::try_from_str(&project_id) {
        Ok(id) => id,
        Err(err) => return Err(err.to_string()),
    };
    let subtask_id = SubTaskId::from(subtask_assignment.subtask_id);
    let user_id = UserId::from(subtask_assignment.user_id);
    let repositories = state.repositories.read().await;
    facades::add(&*repositories, &project_id_typed, &subtask_id, &user_id)
        .await
        .map_err(|e| {
            tracing::error!(target: "commands::subtask_assignment", command = "create_subtask_assignment", project_id = %project_id_typed, subtask_id = %subtask_id, user_id = %user_id, error = %e);
            e
        })
}

#[tauri::command]
pub async fn delete_subtask_assignment(
    state: State<'_, AppState>,
    project_id: String,
    subtask_id: String,
    user_id: String,
) -> Result<bool, String> {
    let project_id_typed = match ProjectId::try_from_str(&project_id) {
        Ok(id) => id,
        Err(err) => return Err(err.to_string()),
    };
    let subtask_id_typed = SubTaskId::from(subtask_id);
    let user_id_typed = UserId::from(user_id);
    let repositories = state.repositories.read().await;
    facades::remove(&*repositories, &project_id_typed, &subtask_id_typed, &user_id_typed)
        .await
        .map_err(|e| {
            tracing::error!(target: "commands::subtask_assignment", command = "delete_subtask_assignment", project_id = %project_id_typed, subtask_id = %subtask_id_typed, user_id = %user_id_typed, error = %e);
            e
        })
}
