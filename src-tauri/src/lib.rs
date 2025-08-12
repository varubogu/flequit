// Module declarations
mod commands;
mod services;
mod repositories;
mod types;
mod errors;

use commands::{
    initialization_commands::{
        load_local_settings,
        load_current_account,
        load_all_project_data,
        get_account,
        update_account,
    },
    project_commands::{
        create_project,
        get_project,
        update_project,
        delete_project,
        search_projects,
    },
    setting_commands::{
        get_setting,
        get_all_settings,
        update_setting,
    },
    subtask_commands::{
        // Aliases for frontend compatibility
        create_sub_task,
        get_sub_task,
        update_sub_task,
        delete_sub_task,
        search_sub_tasks,
    },
    tag_commands::{
        create_tag,
        get_tag,
        update_tag,
        delete_tag,
        search_tags,
    },
    task_commands::{
        create_task,
        get_task,
        update_task,
        delete_task,
        search_tasks,
    },
    task_list_commands::{
        create_task_list,
        get_task_list,
        update_task_list,
        delete_task_list,
        search_task_lists,
    },
};


#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {

    // Ensure directories are created at startup



    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            // Initialization commands
            load_local_settings,
            load_current_account,
            load_all_project_data,
            
            // Account commands
            get_account,
            update_account,

            // Task management commands
            create_task,
            get_task,
            update_task,
            delete_task,
            search_tasks,

            // Project management commands
            create_project,
            get_project,
            update_project,
            delete_project,
            search_projects,

            // Setting management commands
            get_setting,
            get_all_settings,
            update_setting,

            // Subtask management commands (frontend compatibility aliases)
            create_sub_task,
            get_sub_task,
            update_sub_task,
            delete_sub_task,
            search_sub_tasks,

            // Tag management commands
            create_tag,
            get_tag,
            update_tag,
            delete_tag,
            search_tags,

            // TaskList commands
            create_task_list,
            get_task_list,
            update_task_list,
            delete_task_list,
            search_task_lists,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
