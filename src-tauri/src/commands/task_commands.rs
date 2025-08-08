use crate::types::{Task, TaskWithSubTasks};

#[tauri::command]
pub fn create_task(
    title: String,
    description: String,
) -> Result<Task, String> {
    println!("auto_save called");
    let task = Task {
        id: "".to_string(),
        project_id: "".to_string(),
        title: title,
        description: Option::from(description),
        status: crate::types::TaskStatus::Todo,
        priority: crate::types::Priority::Low,
        assigned_to: Option::from("".to_string()),
        tags: vec![],
        due_date: Option::from(0),
        created_at: 0,
        updated_at: 0,
    };
    Ok(task)
}

#[tauri::command]
pub fn get_task(
    task_id: String,
) -> Result<Option<Task>, String> {
    println!("auto_save called");
    let task = Task {
        id: task_id,
        project_id: "".to_string(),
        title: "".to_string(),
        description: Option::from("".to_string()),
        status: crate::types::TaskStatus::Todo,
        priority: crate::types::Priority::High,
        assigned_to: Option::from("".to_string()),
        tags: vec![],
        due_date: Option::from(0),
        created_at: 0,
        updated_at: 0,
    };
    Ok(Option::from(task))
}

#[tauri::command]
pub fn get_all_tasks(
) -> Result<Vec<Task>, String> {
    println!("auto_save called");
    Ok(vec![])
}

#[tauri::command]
pub fn update_task(
    task_id: String,
    title: Option<String>,
    description: Option<String>,
    completed: Option<bool>,
) -> Result<Option<Task>, String> {
    println!("auto_save called");
    println!("task_id: {:?}", task_id);
    println!("title: {:?}", title);
    println!("description: {:?}", description);
    println!("completed: {:?}", completed);

    let task = Task {
        id:task_id,
        project_id: todo!(),
        title: title.unwrap(),
        description: todo!(),
        status: todo!(),
        priority: todo!(),
        assigned_to: todo!(),
        tags: todo!(),
        due_date: todo!(),
        created_at: todo!(),
        updated_at: todo!()
    };
    Ok(Option::from(task))
}

#[tauri::command]
pub fn delete_task(
    task_id: String,
) -> Result<bool, String> {
    println!("auto_save called");
    println!("task_id: {:?}", task_id);

    Ok(true)
}

#[tauri::command]
pub fn create_task_with_subtasks(
    list_id: String,
    title: String,
    description: Option<String>,
    status: Option<String>,
    priority: Option<i32>,
    start_date: Option<i64>,
    end_date: Option<i64>,
) -> Result<TaskWithSubTasks, String> {
    println!("auto_save called");
    println!("list_id: {:?}", list_id);
    println!("title: {:?}", title);
    println!("description: {:?}", description);
    println!("status: {:?}", status);
    println!("priority: {:?}", priority);
    println!("start_date: {:?}", start_date);
    println!("end_date: {:?}", end_date);

    let task = TaskWithSubTasks {
        id: "".to_string(),
        list_id: "".to_string(),
        title: title,
        description: description,
        status: "".to_string(),
        priority: 0,
        start_date: Option::from(0),
        end_date: Option::from(0),
        order_index: 0,
        is_archived: false,
        created_at: 0,
        updated_at: 0,
        sub_tasks: vec![],
        tags: vec![],
    };
    Ok(task)
}

#[tauri::command]
pub fn update_task_with_subtasks(
    task_id: String,
    title: Option<String>,
    description: Option<String>,
    status: Option<String>,
    priority: Option<i32>,
    start_date: Option<i64>,
    end_date: Option<i64>,
) -> Result<Option<TaskWithSubTasks>, String> {
    println!("auto_save called");
    let task = TaskWithSubTasks {
        id: task_id,
        list_id: "".to_string(),
        title: title.unwrap(),
        description: description,
        status: status.unwrap(),
        priority: priority.unwrap(),
        start_date: start_date,
        end_date: end_date,
        order_index: 0,
        is_archived: false,
        created_at: 0,
        updated_at: 0,
        sub_tasks: vec![],
        tags: vec![],
    };
    Ok(Option::from(task))
}

#[tauri::command]
pub fn delete_task_with_subtasks(
    task_id: String,
) -> Result<bool, String> {
    println!("auto_save called");
    println!("task_id: {:?}", task_id);
    Ok(true)
}
