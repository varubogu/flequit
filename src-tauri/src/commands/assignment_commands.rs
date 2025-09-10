use flequit_core::facades::assignment_facades;
use crate::models::task_assignment::TaskAssignmentCommandModel;
use crate::models::subtask_assignment::SubtaskAssignmentCommandModel;
use flequit_model::types::id_types::{TaskId, SubTaskId, UserId};
use crate::state::AppState;
use tauri::State;

// TaskAssignment関連コマンド（CRUD）

#[tracing::instrument]
#[tauri::command]
pub async fn create_task_assignment(
    state: State<'_, AppState>,
    task_assignment: TaskAssignmentCommandModel,
) -> Result<bool, String> {
    let task_id = TaskId::from(task_assignment.task_id);
    let user_id = UserId::from(task_assignment.user_id);
    let repositories = state.repositories.read().await;
    
    assignment_facades::add_task_assignment(&*repositories, &task_id, &user_id).await
}

#[tracing::instrument]
#[tauri::command]
pub async fn delete_task_assignment(
    state: State<'_, AppState>,
    task_id: String,
    user_id: String,
) -> Result<bool, String> {
    let task_id_typed = TaskId::from(task_id);
    let user_id_typed = UserId::from(user_id);
    let repositories = state.repositories.read().await;
    
    assignment_facades::remove_task_assignment(&*repositories, &task_id_typed, &user_id_typed).await
}

// SubtaskAssignment関連コマンド（CRUD）

#[tracing::instrument]
#[tauri::command]
pub async fn create_subtask_assignment(
    state: State<'_, AppState>,
    subtask_assignment: SubtaskAssignmentCommandModel,
) -> Result<bool, String> {
    let subtask_id = SubTaskId::from(subtask_assignment.subtask_id);
    let user_id = UserId::from(subtask_assignment.user_id);
    let repositories = state.repositories.read().await;
    
    assignment_facades::add_subtask_assignment(&*repositories, &subtask_id, &user_id).await
}

#[tracing::instrument]
#[tauri::command]
pub async fn delete_subtask_assignment(
    state: State<'_, AppState>,
    subtask_id: String,
    user_id: String,
) -> Result<bool, String> {
    let subtask_id_typed = SubTaskId::from(subtask_id);
    let user_id_typed = UserId::from(user_id);
    let repositories = state.repositories.read().await;
    
    assignment_facades::remove_subtask_assignment(&*repositories, &subtask_id_typed, &user_id_typed).await
}
