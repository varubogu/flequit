mod automerge_manager;

use automerge_manager::{AutomergeManager, Task, ProjectTree, TaskListWithTasks, TaskWithSubTasks};
use std::sync::{Arc, Mutex};
use tauri::State;

type AutomergeState = Arc<Mutex<AutomergeManager>>;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn create_task(
    state: State<AutomergeState>,
    title: String,
    description: String,
) -> Result<Task, String> {
    let manager = state.lock().unwrap();
    manager.create_task(title, description)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn get_task(
    state: State<AutomergeState>,
    task_id: String,
) -> Result<Option<Task>, String> {
    let manager = state.lock().unwrap();
    manager.get_task(&task_id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn get_all_tasks(
    state: State<AutomergeState>,
) -> Result<Vec<Task>, String> {
    let manager = state.lock().unwrap();
    manager.get_all_tasks()
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn update_task(
    state: State<AutomergeState>,
    task_id: String,
    title: Option<String>,
    description: Option<String>,
    completed: Option<bool>,
) -> Result<Option<Task>, String> {
    let manager = state.lock().unwrap();
    manager.update_task(&task_id, title, description, completed)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_task(
    state: State<AutomergeState>,
    task_id: String,
) -> Result<bool, String> {
    let manager = state.lock().unwrap();
    manager.delete_task(&task_id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn get_document_state(
    state: State<AutomergeState>,
) -> Result<Vec<u8>, String> {
    let manager = state.lock().unwrap();
    Ok(manager.get_document_state())
}

#[tauri::command]
fn load_document_state(
    state: State<AutomergeState>,
    data: Vec<u8>,
) -> Result<(), String> {
    let manager = state.lock().unwrap();
    manager.load_document_state(&data)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn merge_document(
    state: State<AutomergeState>,
    data: Vec<u8>,
) -> Result<(), String> {
    let manager = state.lock().unwrap();
    manager.merge_document(&data)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn save_data_to_file(
    state: State<AutomergeState>,
    file_path: String,
) -> Result<(), String> {
    let manager = state.lock().unwrap();
    manager.save_to_file(&file_path)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn load_data_from_file(
    state: State<AutomergeState>,
    file_path: String,
) -> Result<(), String> {
    let manager = state.lock().unwrap();
    manager.load_from_file(&file_path)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn initialize_sample_data(
    state: State<AutomergeState>,
) -> Result<(), String> {
    let manager = state.lock().unwrap();
    manager.initialize_sample_data()
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn get_project_trees(
    state: State<AutomergeState>,
) -> Result<Vec<ProjectTree>, String> {
    let manager = state.lock().unwrap();
    manager.get_project_trees()
        .map_err(|e| e.to_string())
}

// プロジェクト管理コマンド
#[tauri::command]
fn create_project(
    state: State<AutomergeState>,
    name: String,
    description: Option<String>,
    color: Option<String>,
) -> Result<ProjectTree, String> {
    let manager = state.lock().unwrap();
    manager.create_project(name, description, color)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn update_project(
    state: State<AutomergeState>,
    project_id: String,
    name: Option<String>,
    description: Option<String>,
    color: Option<String>,
) -> Result<Option<ProjectTree>, String> {
    let manager = state.lock().unwrap();
    manager.update_project(&project_id, name, description, color)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_project(
    state: State<AutomergeState>,
    project_id: String,
) -> Result<bool, String> {
    let manager = state.lock().unwrap();
    manager.delete_project(&project_id)
        .map_err(|e| e.to_string())
}

// タスクリスト管理コマンド
#[tauri::command]
fn create_task_list(
    state: State<AutomergeState>,
    project_id: String,
    name: String,
    description: Option<String>,
    color: Option<String>,
) -> Result<TaskListWithTasks, String> {
    let manager = state.lock().unwrap();
    manager.create_task_list(project_id, name, description, color)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn update_task_list(
    state: State<AutomergeState>,
    task_list_id: String,
    name: Option<String>,
    description: Option<String>,
    color: Option<String>,
) -> Result<Option<TaskListWithTasks>, String> {
    let manager = state.lock().unwrap();
    manager.update_task_list(&task_list_id, name, description, color)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_task_list(
    state: State<AutomergeState>,
    task_list_id: String,
) -> Result<bool, String> {
    let manager = state.lock().unwrap();
    manager.delete_task_list(&task_list_id)
        .map_err(|e| e.to_string())
}

// 拡張タスク管理コマンド
#[tauri::command]
fn create_task_with_subtasks(
    state: State<AutomergeState>,
    list_id: String,
    title: String,
    description: Option<String>,
    status: Option<String>,
    priority: Option<i32>,
    start_date: Option<i64>,
    end_date: Option<i64>,
) -> Result<TaskWithSubTasks, String> {
    let manager = state.lock().unwrap();
    manager.create_task_with_subtasks(
        list_id, title, description, status, priority, start_date, end_date
    ).map_err(|e| e.to_string())
}

#[tauri::command]
fn update_task_with_subtasks(
    state: State<AutomergeState>,
    task_id: String,
    title: Option<String>,
    description: Option<String>,
    status: Option<String>,
    priority: Option<i32>,
    start_date: Option<i64>,
    end_date: Option<i64>,
) -> Result<Option<TaskWithSubTasks>, String> {
    let manager = state.lock().unwrap();
    manager.update_task_with_subtasks(
        &task_id, title, description, status, priority, start_date, end_date
    ).map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_task_with_subtasks(
    state: State<AutomergeState>,
    task_id: String,
) -> Result<bool, String> {
    let manager = state.lock().unwrap();
    manager.delete_task_with_subtasks(&task_id)
        .map_err(|e| e.to_string())
}

// 自動保存コマンド
#[tauri::command]
fn auto_save(
    state: State<AutomergeState>,
) -> Result<(), String> {
    let manager = state.lock().unwrap();
    manager.save_to_file("./data/tasks.automerge")
        .map_err(|e| e.to_string())
}

// 一括操作コマンド
#[tauri::command]
fn bulk_move_tasks(
    state: State<AutomergeState>,
    task_ids: Vec<String>,
    target_list_id: String,
) -> Result<bool, String> {
    let manager = state.lock().unwrap();
    manager.bulk_move_tasks(task_ids, target_list_id)
        .map_err(|e| e.to_string())
}

// 拡張ファイル操作コマンド
#[tauri::command]
fn export_data_json(
    state: State<AutomergeState>,
    file_path: String,
) -> Result<(), String> {
    let manager = state.lock().unwrap();
    manager.export_to_json(&file_path)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn import_data_json(
    state: State<AutomergeState>,
    file_path: String,
) -> Result<(), String> {
    let manager = state.lock().unwrap();
    manager.import_from_json(&file_path)
        .map_err(|e| e.to_string())
}

// サブタスク管理コマンド
#[tauri::command]
fn create_subtask(
    state: State<AutomergeState>,
    task_id: String,
    title: String,
    description: Option<String>,
    status: Option<String>,
    priority: Option<i32>,
) -> Result<automerge_manager::SubTask, String> {
    let manager = state.lock().unwrap();
    manager.create_subtask(&task_id, title, description, status, priority)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn update_subtask(
    state: State<AutomergeState>,
    subtask_id: String,
    title: Option<String>,
    description: Option<String>,
    status: Option<String>,
    priority: Option<i32>,
) -> Result<Option<automerge_manager::SubTask>, String> {
    let manager = state.lock().unwrap();
    manager.update_subtask(&subtask_id, title, description, status, priority)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_subtask(
    state: State<AutomergeState>,
    subtask_id: String,
) -> Result<bool, String> {
    let manager = state.lock().unwrap();
    manager.delete_subtask(&subtask_id)
        .map_err(|e| e.to_string())
}

// タグ管理コマンド
#[tauri::command]
fn create_tag(
    state: State<AutomergeState>,
    name: String,
    color: Option<String>,
) -> Result<automerge_manager::Tag, String> {
    let manager = state.lock().unwrap();
    manager.create_tag(name, color)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn update_tag(
    state: State<AutomergeState>,
    tag_id: String,
    name: Option<String>,
    color: Option<String>,
) -> Result<Option<automerge_manager::Tag>, String> {
    let manager = state.lock().unwrap();
    manager.update_tag(&tag_id, name, color)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_tag(
    state: State<AutomergeState>,
    tag_id: String,
) -> Result<bool, String> {
    let manager = state.lock().unwrap();
    manager.delete_tag(&tag_id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn get_all_tags(
    state: State<AutomergeState>,
) -> Result<Vec<automerge_manager::Tag>, String> {
    let manager = state.lock().unwrap();
    manager.get_all_tags()
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn add_tag_to_task(
    state: State<AutomergeState>,
    task_id: String,
    tag_id: String,
) -> Result<bool, String> {
    let manager = state.lock().unwrap();
    manager.add_tag_to_task(&task_id, &tag_id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn remove_tag_from_task(
    state: State<AutomergeState>,
    task_id: String,
    tag_id: String,
) -> Result<bool, String> {
    let manager = state.lock().unwrap();
    manager.remove_tag_from_task(&task_id, &tag_id)
        .map_err(|e| e.to_string())
}

// サブタスクのタグ管理コマンド
#[tauri::command]
fn add_tag_to_subtask(
    state: State<AutomergeState>,
    subtask_id: String,
    tag_id: String,
) -> Result<bool, String> {
    let manager = state.lock().unwrap();
    manager.add_tag_to_subtask(&subtask_id, &tag_id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn remove_tag_from_subtask(
    state: State<AutomergeState>,
    subtask_id: String,
    tag_id: String,
) -> Result<bool, String> {
    let manager = state.lock().unwrap();
    manager.remove_tag_from_subtask(&subtask_id, &tag_id)
        .map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let automerge_manager = Arc::new(Mutex::new(AutomergeManager::new()));

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(automerge_manager)
        .invoke_handler(tauri::generate_handler![
            greet,
            create_task,
            get_task,
            get_all_tasks,
            update_task,
            delete_task,
            get_document_state,
            load_document_state,
            merge_document,
            save_data_to_file,
            load_data_from_file,
            initialize_sample_data,
            get_project_trees,
            create_project,
            update_project,
            delete_project,
            create_task_list,
            update_task_list,
            delete_task_list,
            create_task_with_subtasks,
            update_task_with_subtasks,
            delete_task_with_subtasks,
            auto_save,
            bulk_move_tasks,
            export_data_json,
            import_data_json,
            create_subtask,
            update_subtask,
            delete_subtask,
            create_tag,
            update_tag,
            delete_tag,
            get_all_tags,
            add_tag_to_task,
            remove_tag_from_task,
            add_tag_to_subtask,
            remove_tag_from_subtask
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
