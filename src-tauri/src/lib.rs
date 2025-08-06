// Module declarations
mod commands;
mod services;
mod types;
mod utils;

// Re-exports for easy access
use commands::*;
use services::AutomergeService;
use services::automerge_service::AutomergeManager;
use std::sync::{Arc, Mutex};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let automerge_manager = Arc::new(Mutex::new(AutomergeManager::new()));

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(automerge_manager)
        .invoke_handler(tauri::generate_handler![
            // Basic commands
            greet,
            auto_save,
            
            // Task management commands
            create_task,
            get_task,
            get_all_tasks,
            update_task,
            delete_task,
            create_task_with_subtasks,
            update_task_with_subtasks,
            delete_task_with_subtasks,
            
            // Project management commands
            get_project_trees,
            create_project,
            update_project,
            delete_project,
            
            // Task list management commands
            create_task_list,
            update_task_list,
            delete_task_list,
            
            // Subtask management commands
            create_subtask,
            update_subtask,
            delete_subtask,
            
            // Tag management commands
            create_tag,
            update_tag,
            delete_tag,
            get_all_tags,
            add_tag_to_task,
            remove_tag_from_task,
            add_tag_to_subtask,
            remove_tag_from_subtask,
            
            // Bulk operation commands
            bulk_move_tasks,
            
            // File operation commands
            save_data_to_file,
            load_data_from_file,
            initialize_sample_data,
            export_data_json,
            import_data_json,
            
            // AutoMerge document commands
            get_document_state,
            load_document_state,
            merge_document
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}