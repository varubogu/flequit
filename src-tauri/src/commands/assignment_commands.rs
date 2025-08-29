use flequit_core::facades::assignment_facades;
use crate::models::assignment::{TaskAssignmentCommand, SubtaskAssignmentCommand};
use flequit_model::types::id_types::{TaskId, SubTaskId, UserId};

// TaskAssignment関連コマンド（CRUD）

#[tracing::instrument]
#[tauri::command]
pub async fn create_task_assignment(task_assignment: TaskAssignmentCommand) -> Result<bool, String> {
    let task_id = TaskId::from(task_assignment.task_id);
    let user_id = UserId::from(task_assignment.user_id);
    assignment_facades::add_task_assignment(&task_id, &user_id).await
}

#[tracing::instrument]
#[tauri::command]
pub async fn delete_task_assignment(task_id: String, user_id: String) -> Result<bool, String> {
    let task_id_typed = TaskId::from(task_id);
    let user_id_typed = UserId::from(user_id);
    assignment_facades::remove_task_assignment(&task_id_typed, &user_id_typed).await
}

// SubtaskAssignment関連コマンド（CRUD）

#[tracing::instrument]
#[tauri::command]
pub async fn create_subtask_assignment(subtask_assignment: SubtaskAssignmentCommand) -> Result<bool, String> {
    let subtask_id = SubTaskId::from(subtask_assignment.subtask_id);
    let user_id = UserId::from(subtask_assignment.user_id);
    assignment_facades::add_subtask_assignment(&subtask_id, &user_id).await
}

#[tracing::instrument]
#[tauri::command]
pub async fn delete_subtask_assignment(subtask_id: String, user_id: String) -> Result<bool, String> {
    let subtask_id_typed = SubTaskId::from(subtask_id);
    let user_id_typed = UserId::from(user_id);
    assignment_facades::remove_subtask_assignment(&subtask_id_typed, &user_id_typed).await
}