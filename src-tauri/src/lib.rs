// Module declarations
mod commands;
pub mod errors;
mod facades;
mod models;
pub mod repositories;
mod services;
mod types;

use commands::*;


#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {

    // Ensure directories are created at startup
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            // Initialization commands
            initialization_commands::load_local_settings,
            initialization_commands::load_current_account,
            initialization_commands::load_all_project_data,
            initialization_commands::load_all_account,

            // Account commands
            account_commands::create_account,
            account_commands::get_account,
            account_commands::update_account,
            account_commands::delete_account,

            // Task management commands
            task_commands::create_task,
            task_commands::get_task,
            task_commands::update_task,
            task_commands::delete_task,
            task_commands::search_tasks,

            // Project management commands
            project_commands::create_project,
            project_commands::get_project,
            project_commands::update_project,
            project_commands::delete_project,
            project_commands::search_projects,

            // Setting management commands
            setting_commands::get_setting,
            setting_commands::get_all_settings,
            setting_commands::update_setting,

            // Subtask management commands (frontend compatibility aliases)
            subtask_commands::create_sub_task,
            subtask_commands::get_sub_task,
            subtask_commands::update_sub_task,
            subtask_commands::delete_sub_task,
            subtask_commands::search_sub_tasks,

            // Tag management commands
            tag_commands::create_tag,
            tag_commands::get_tag,
            tag_commands::update_tag,
            tag_commands::delete_tag,
            tag_commands::search_tags,

            // TaskList commands
            task_list_commands::create_task_list,
            task_list_commands::get_task_list,
            task_list_commands::update_task_list,
            task_list_commands::delete_task_list,
            task_list_commands::search_task_lists,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
