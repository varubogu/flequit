pub mod account_commands;
pub mod initialization_commands;
pub mod project_commands;
pub mod settings_commands;
pub mod subtask_assignment_commands;
pub mod subtask_commands;
pub mod tag_commands;
pub mod tagging_commands;
pub mod task_assignment_commands;
pub mod task_commands;
pub mod task_list_commands;
pub mod user_commands;
pub mod user_preferences_commands;

#[macro_export]
macro_rules! generate_app_handler {
    () => {
        tauri::generate_handler![
            // Initialization commands
            // initialization_commands::load_local_settings,
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
            task_commands::search_tasks,
            task_commands::update_task,
            task_commands::delete_task,
            task_commands::restore_task,
            // Task recurrence commands
            task_commands::create_task_recurrence,
            task_commands::get_task_recurrence_by_task_id,
            task_commands::delete_task_recurrence,
            // Project management commands
            project_commands::create_project,
            project_commands::get_project,
            project_commands::search_projects,
            project_commands::update_project,
            project_commands::delete_project,
            project_commands::restore_project,
            project_commands::get_project_with_tasks_and_tags,
            // Setting management commands (legacy)
            settings_commands::get_setting,
            settings_commands::get_all_settings,
            settings_commands::update_setting,
            settings_commands::set_setting,
            // New settings management commands (flequit-settings based)
            settings_commands::load_settings,
            settings_commands::save_settings,
            settings_commands::update_settings_partially,
            settings_commands::settings_file_exists,
            settings_commands::initialize_settings_with_defaults,
            settings_commands::get_settings_file_path,
            // Settings array item CRUD
            settings_commands::add_custom_due_day,
            settings_commands::update_custom_due_day,
            settings_commands::delete_custom_due_day,
            settings_commands::add_datetime_format_setting,
            settings_commands::upsert_datetime_format_setting,
            settings_commands::delete_datetime_format_setting,
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
            subtask_commands::search_sub_tasks,
            subtask_commands::update_sub_task,
            subtask_commands::delete_sub_task,
            // Subtask recurrence commands
            subtask_commands::create_subtask_recurrence,
            subtask_commands::get_subtask_recurrence_by_subtask_id,
            subtask_commands::delete_subtask_recurrence,
            // Tag management commands
            tag_commands::create_tag,
            tag_commands::get_tag,
            tag_commands::search_tags,
            tag_commands::update_tag,
            tag_commands::delete_tag,
            tag_commands::restore_tag,
            // Tag Bookmark commands (User Preferences)
            user_preferences_commands::create_tag_bookmark,
            user_preferences_commands::list_tag_bookmarks_by_project,
            user_preferences_commands::list_tag_bookmarks_by_user,
            user_preferences_commands::update_tag_bookmark,
            user_preferences_commands::delete_tag_bookmark,
            user_preferences_commands::is_tag_bookmarked,
            user_preferences_commands::reorder_tag_bookmarks,
            // TaskList commands
            task_list_commands::create_task_list,
            task_list_commands::get_task_list,
            task_list_commands::search_task_lists,
            task_list_commands::update_task_list,
            task_list_commands::delete_task_list,
            task_list_commands::restore_task_list,
            task_list_commands::get_task_lists_with_tasks,
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
            // Name-based atomic tagging commands
            tagging_commands::create_task_tag_by_name,
            tagging_commands::create_subtask_tag_by_name,
            // Assignment commands
            task_assignment_commands::create_task_assignment,
            task_assignment_commands::delete_task_assignment,
            subtask_assignment_commands::create_subtask_assignment,
            subtask_assignment_commands::delete_subtask_assignment,
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
        ]
    };
}
