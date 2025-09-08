// Module declarations
mod commands;
pub mod logger;
pub mod models;
pub mod state;

// Re-export from flequit-core
pub use flequit_core::*;

use commands::*;
use tauri_specta::collect_commands;
use specta_typescript::Typescript;

use crate::models::account::AccountCommandModel;


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
            // Task recurrence commands
            task_commands::create_task_recurrence,
            task_commands::get_task_recurrence_by_task_id,
            task_commands::delete_task_recurrence,
            // Project management commands
            project_commands::create_project,
            project_commands::get_project,
            project_commands::update_project,
            project_commands::delete_project,
            // Setting management commands
            settings_commands::get_setting,
            settings_commands::get_all_settings,
            settings_commands::update_setting,
            settings_commands::set_setting,
            // Custom Date Format commands
            settings_commands::get_custom_date_format_setting,
            settings_commands::get_all_custom_date_format_settings,
            settings_commands::add_custom_date_format_setting,
            settings_commands::update_custom_date_format_setting,
            settings_commands::delete_custom_date_format_setting,
            // Time Label commands
            settings_commands::get_time_label_setting,
            settings_commands::get_all_time_label_settings,
            settings_commands::add_time_label_setting,
            settings_commands::update_time_label_setting,
            settings_commands::delete_time_label_setting,
            // View Item commands
            settings_commands::get_view_item_setting,
            settings_commands::get_all_view_item_settings,
            settings_commands::add_view_item_setting,
            settings_commands::update_view_item_setting,
            settings_commands::delete_view_item_setting,
            // Subtask management commands (frontend compatibility aliases)
            subtask_commands::create_sub_task,
            subtask_commands::get_sub_task,
            subtask_commands::update_sub_task,
            subtask_commands::delete_sub_task,
            // Subtask recurrence commands
            subtask_commands::create_subtask_recurrence,
            subtask_commands::get_subtask_recurrence_by_subtask_id,
            subtask_commands::delete_subtask_recurrence,
            // Tag management commands
            tag_commands::create_tag,
            tag_commands::get_tag,
            tag_commands::update_tag,
            tag_commands::delete_tag,
            // TaskList commands
            task_list_commands::create_task_list,
            task_list_commands::get_task_list,
            task_list_commands::update_task_list,
            task_list_commands::delete_task_list,
            // User commands
            user_commands::create_user,
            user_commands::get_user,
            user_commands::update_user,
            user_commands::delete_user,
            // Tagging commands
            tagging_commands::create_task_tag,
            tagging_commands::delete_task_tag,
            tagging_commands::create_subtask_tag,
            tagging_commands::delete_subtask_tag,
            // Assignment commands
            assignment_commands::create_task_assignment,
            assignment_commands::delete_task_assignment,
            assignment_commands::create_subtask_assignment,
            assignment_commands::delete_subtask_assignment,
            // Task recurrence management commands
            task_commands::create_recurrence_rule,
            task_commands::get_recurrence_rule,
            task_commands::get_all_recurrence_rules,
            task_commands::update_recurrence_rule,
            task_commands::delete_recurrence_rule,
            task_commands::create_recurrence_adjustment,
            task_commands::get_recurrence_adjustments_by_rule_id,
            task_commands::delete_recurrence_adjustment,
            task_commands::create_recurrence_details,
            task_commands::get_recurrence_details_by_rule_id,
            task_commands::update_recurrence_details,
            task_commands::delete_recurrence_details,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

pub fn tauri_specta_output() {
    let builder = tauri_specta::Builder::<tauri::Wry>::new()
        .commands(collect_commands![
        ])
        .typ::<AccountCommandModel>();

    #[cfg(debug_assertions)]
    builder
            .export(Typescript::default(), "../src/lib/types/bindings.ts")
            .expect("Failed to export typescript bindings");
}
