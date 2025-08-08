// Module declarations
mod commands;
mod services;
mod repositories;
mod types;
mod errors;

use commands::{
    auto_save::auto_save,
    bulk_commands::{
        bulk_update_tasks,
        bulk_delete_tasks,
        bulk_update_task_status,
        bulk_assign_tasks,
        bulk_delete_subtasks,
        bulk_toggle_subtasks_completion,
    },
    document_commands::{
        get_document_state,
        load_document_state,
        merge_document,
    },
    file_commands::{
        save_data_to_file,
        load_data_from_file,
        initialize_sample_data,
        export_data_json,
        import_data_json,
        create_backup,
        restore_from_backup,
        list_backups,
    },
    greet::greet,
    path_commands::{
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

    },
    project_commands::{
        create_project,
        get_project,
        list_projects,
        update_project,
        delete_project,
    },
    subtask_commands::{
        create_subtask,
        update_subtask,
        delete_subtask,
    },
    tag_commands::{
        create_tag,
        update_tag,
        delete_tag,
        // get_all_tags,
        // add_tag_to_task,
        // remove_tag_from_task,
        // add_tag_to_subtask,
        // remove_tag_from_subtask,
    },
    task_commands::{
        create_task,
        get_task,
        // get_all_tasks,
        update_task,
        delete_task,
        // create_task_with_subtasks,
        // update_task_with_subtasks,
        // delete_task_with_subtasks,
    },
    task_list_commands::{
        create_task_list,
        update_task_list,
        delete_task_list,
    }
};



use repositories::automerge::{ProjectRepository, TaskRepository, SubtaskRepository, TagRepository, UserRepository, SqliteStorage, AutomergeStorage};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {

    // Ensure directories are created at startup

    // インフラストラクチャ層の初期化
    let sqlite_storage = SqliteStorage::new();
    let automerge_storage = AutomergeStorage::new();

    // Repository層の初期化
    let project_repository = ProjectRepository::new(sqlite_storage.clone(), automerge_storage.clone());
    let task_repository = TaskRepository::new(sqlite_storage.clone(), automerge_storage.clone());
    let subtask_repository = SubtaskRepository::new(sqlite_storage.clone(), automerge_storage.clone());
    let tag_repository = TagRepository::new(sqlite_storage.clone(), automerge_storage.clone());
    let user_repository = UserRepository::new(sqlite_storage.clone(), automerge_storage.clone());

    tauri::Builder::default()
        // Storage層をState管理
        .manage(sqlite_storage)
        .manage(automerge_storage)
        // Repository層をState管理
        .manage(project_repository)
        .manage(task_repository)
        .manage(subtask_repository)
        .manage(tag_repository)
        .manage(user_repository)
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            // Basic commands
            greet,
            auto_save,

            // Task management commands
            create_task,
            get_task,
            // get_all_tasks,
            update_task,
            delete_task,
            // create_task_with_subtasks,
            // update_task_with_subtasks,
            // delete_task_with_subtasks,

            // Project management commands
            get_project,
            list_projects,
            create_project,
            update_project,
            delete_project,

            // Subtask management commands
            create_subtask,
            update_subtask,
            delete_subtask,

            // Tag management commands
            create_tag,
            update_tag,
            delete_tag,
            // get_all_tags,
            // add_tag_to_task,
            // remove_tag_from_task,
            // add_tag_to_subtask,
            // remove_tag_from_subtask,

            // Bulk operation commands
            // bulk_move_tasks,

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
            ensure_directories,

            // task_list_commands
            create_task_list,
            update_task_list,
            delete_task_list,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
