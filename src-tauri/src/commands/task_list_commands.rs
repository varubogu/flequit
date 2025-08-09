use crate::types::task_types::{TaskList, TaskListWithTasks};

#[tauri::command]
pub fn create_task_list(
    task_list: TaskList,
) -> Result<TaskList, String> {
    println!("create_task_list called");
    println!("task_list: {:?}", task_list);

    Ok(task_list)
}

#[tauri::command]
pub fn update_task_list(
    task_list: TaskList,
) -> Result<TaskList, String> {
    println!("update_task_list called");
    println!("task_list: {:?}", task_list);

    Ok(task_list)
}

#[tauri::command]
pub fn delete_task_list(
    task_list_id: String,
) -> Result<bool, String> {
    println!("auto_save called");
    println!("task_list_id: {}", task_list_id);
    Ok(true)
}
