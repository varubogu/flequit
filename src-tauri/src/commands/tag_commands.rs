use crate::types::Tag;

#[tauri::command]
pub fn create_tag(
    name: String,
    color: Option<String>,
) -> Result<Tag, String> {
    println!("auto_save called");
    let tag = Tag {
        id: "".to_string(),
        name: name,
        color: color,
        created_at: 0,
        updated_at: 0,
    };
    Ok(tag)
}

#[tauri::command]
pub fn update_tag(
    tag_id: String,
    name: Option<String>,
    color: Option<String>,
) -> Result<Option<Tag>, String> {
    println!("auto_save called");
    println!("tag_id: {:?}", tag_id);
    println!("name: {:?}", name);
    println!("color: {:?}", color);

    let tag = Tag {
        id: "".to_string(),
        name: name.unwrap(),
        color: color,
        created_at: 0,
        updated_at: 0,
    };
    Ok(Option::from(tag))
}

#[tauri::command]
pub fn delete_tag(
    tag_id: String,
) -> Result<bool, String> {
    println!("auto_save called");
    println!("tag_id: {:?}", tag_id);
    Ok(true)
}

#[tauri::command]
pub fn get_all_tags(
) -> Result<Vec<Tag>, String> {
    println!("auto_save called");
    Ok(vec![])
}

#[tauri::command]
pub fn add_tag_to_task(
    task_id: String,
    tag_id: String,
) -> Result<bool, String> {
    println!("auto_save called");
    println!("task_id: {:?}", task_id);
    println!("tag_id: {:?}", tag_id);
    Ok(true)
}

#[tauri::command]
pub fn remove_tag_from_task(
    task_id: String,
    tag_id: String,
) -> Result<bool, String> {
    println!("auto_save called");
    println!("task_id: {:?}", task_id);
    println!("tag_id: {:?}", tag_id);
    Ok(true)}

#[tauri::command]
pub fn add_tag_to_subtask(
    subtask_id: String,
    tag_id: String,
) -> Result<bool, String> {
    println!("auto_save called");
    println!("subtask_id: {:?}", subtask_id);
    println!("tag_id: {:?}", tag_id);
    Ok(true)
}

#[tauri::command]
pub fn remove_tag_from_subtask(
    subtask_id: String,
    tag_id: String,
) -> Result<bool, String> {
    println!("auto_save called");
    println!("subtask_id: {:?}", subtask_id);
    println!("tag_id: {:?}", tag_id);
    Ok(true)
}
