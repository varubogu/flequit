use crate::types::task_types::TaskListWithTasks;

#[tauri::command]
pub fn create_task_list(
    project_id: String,
    name: String,
    description: Option<String>,
    color: Option<String>,
) -> Result<TaskListWithTasks, String> {
    println!("auto_save called");
    println!("project_id: {}", project_id);
    println!("name: {}", name);
    println!("description: {:?}", description);
    println!("color: {:?}", color);

    let task_list = TaskListWithTasks {
        id: project_id,
        project_id: todo!(),
        name: name,
        description,
        color,
        order_index: todo!(),
        is_archived: todo!(),
        created_at: todo!(),
        updated_at: todo!(),
        tasks: todo!()
    };
    Ok(task_list)
}

#[tauri::command]
pub fn update_task_list(
    task_list_id: String,
    name: Option<String>,
    description: Option<String>,
    color: Option<String>,
) -> Result<Option<TaskListWithTasks>, String> {
    println!("auto_save called");
    println!("task_list_id: {}", task_list_id);
    println!("name: {}", name.unwrap());
    println!("description: {:?}", description);
    println!("color: {:?}", color);

    let task_list = TaskListWithTasks {
        id: task_list_id,
        project_id: todo!(),
        name: name.unwrap(),
        description,
        color,
        order_index: todo!(),
        is_archived: todo!(),
        created_at: todo!(),
        updated_at: todo!(),
        tasks: todo!()
    };
    Ok(Option::from(task_list))
}

#[tauri::command]
pub fn delete_task_list(
    task_list_id: String,
) -> Result<bool, String> {
    println!("auto_save called");
    println!("task_list_id: {}", task_list_id);
    Ok(true)
}
