
#[tauri::command]
pub fn bulk_move_tasks(
    task_ids: Vec<String>,
    target_list_id: String,
) -> Result<bool, String> {
    println!("bulk_commands called");
    println!("task_ids: {:?}", task_ids);
    println!("target_list_id: {:?}", target_list_id);
    Ok(true)
}
