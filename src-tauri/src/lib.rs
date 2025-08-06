// Module declarations
mod commands;
mod services;
mod types;
mod utils;

// Re-exports for easy access
use commands::*;
use services::AutomergeService;
use services::automerge_service::AutomergeManager;
use services::path_service::PathService;
use std::sync::{Arc, Mutex};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Initialize services
    let automerge_manager = Arc::new(Mutex::new(AutomergeManager::new()));
    let path_service = Arc::new(Mutex::new(
        PathService::new().expect("Failed to initialize PathService")
    ));
    
    // Ensure directories are created at startup
    if let Ok(service) = path_service.lock() {
        if let Err(e) = service.ensure_directories() {
            eprintln!("Failed to create directories: {}", e);
        }
    }

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(automerge_manager)
        .manage(path_service)
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
            create_backup,
            restore_from_backup,
            list_backups,
            
            // AutoMerge document commands
            get_document_state,
            load_document_state,
            merge_document,
            
            // Path management commands
            get_current_data_dir,
            get_current_backup_dir,
            get_current_export_dir,
            get_system_default_data_dir,
            get_path_config,
            update_path_config,
            set_custom_data_dir,
            reset_to_system_default,
            validate_path,
            ensure_directories
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}