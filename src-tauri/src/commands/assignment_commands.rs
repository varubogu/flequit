use crate::models::subtask_assignment::SubtaskAssignmentCommandModel;
use crate::models::task_assignment::TaskAssignmentCommandModel;
use crate::state::AppState;
use flequit_core::facades::assignment_facades;
use flequit_model::types::id_types::{ProjectId, SubTaskId, TaskId, UserId};
use tauri::State;

// TaskAssignment関連コマンド（CRUD）


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

    assignment_facades::add_task_assignment(&*repositories, &project_id, &task_id, &user_id).await
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

    assignment_facades::remove_task_assignment(&*repositories, &project_id_typed, &task_id_typed, &user_id_typed).await
}

// SubtaskAssignment関連コマンド（CRUD）


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

    assignment_facades::add_subtask_assignment(&*repositories, &project_id_typed, &subtask_id, &user_id).await
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

    assignment_facades::remove_subtask_assignment(&*repositories, &project_id_typed, &subtask_id_typed, &user_id_typed)
        .await
}
