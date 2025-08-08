use crate::types::SubTask;

#[tauri::command]
pub fn create_subtask(
    task_id: String,
    title: String,
    description: Option<String>,
    status: Option<String>,
    priority: Option<i32>,
) -> Result<SubTask, String> {
    println!("auto_save called");
    let sub_task = SubTask {
        id: "".to_string(),
        task_id: task_id,
        title: title,
        description: description,
        status: status.unwrap(),
        priority: priority,
        start_date: Option::from(0),
        end_date: Option::from(0),
        order_index: 0,
        tags: vec![],
        created_at: 0,
        updated_at: 0,
    };
    Ok(sub_task)
}

#[tauri::command]
pub fn update_subtask(
    subtask_id: String,
    title: Option<String>,
    description: Option<String>,
    status: Option<String>,
    priority: Option<i32>,
) -> Result<Option<SubTask>, String> {
    println!("auto_save called");
        let sub_task = SubTask {
        id: "".to_string(),
        task_id: subtask_id,
        title: title.unwrap(),
        description: description,
        status: status.unwrap(),
        priority: priority,
        start_date: Option::from(0),
        end_date: Option::from(0),
        order_index: 0,
        tags: vec![],
        created_at: 0,
        updated_at: 0,
    };
    Ok(Option::from(sub_task))
}

#[tauri::command]
pub fn delete_subtask(
    subtask_id: String,
) -> Result<bool, String> {
    println!("auto_save called");
    println!("subtask_id: {:?}", subtask_id);
    Ok(true)
}
