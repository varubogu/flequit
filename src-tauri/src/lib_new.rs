// Module declarations
mod commands;
mod services;
mod repositories;
mod infrastructure;
mod types;
mod errors;

// Re-exports for easy access
use std::sync::Arc;
use tokio::sync::Mutex;

// Import necessary services
use crate::services::automerge::{
    project_service::ProjectService,
    task_service::TaskService,
    subtask_service::SubtaskService,
    tag_service::TagService,
    user_service::UserService,
};

use crate::repositories::automerge::{
    project_repository::ProjectRepository,
    task_repository::TaskRepository,
    subtask_repository::SubtaskRepository,
    tag_repository::TagRepository,
    user_repository::UserRepository,
};

use crate::infrastructure::automerge_service::AutomergeRepoService;

// Import commands
use crate::commands::project_commands::{create_project, get_project, list_projects, update_project, delete_project};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Initialize runtime for async operations
    let rt = tokio::runtime::Runtime::new().expect("Failed to create Tokio runtime");
    
    // Initialize AutomergeRepoService
    let automerge_service = rt.block_on(async {
        Arc::new(AutomergeRepoService::new().await.expect("Failed to initialize AutomergeRepoService"))
    });
    
    // Initialize repositories
    let project_repo = Arc::new(ProjectRepository::new(automerge_service.clone()));
    let task_repo = Arc::new(TaskRepository::new(automerge_service.clone()));
    let subtask_repo = Arc::new(SubtaskRepository::new(automerge_service.clone()));
    let tag_repo = Arc::new(TagRepository::new(automerge_service.clone()));
    let user_repo = Arc::new(UserRepository::new(automerge_service.clone()));
    
    // Initialize services
    let project_service = ProjectService::new(project_repo.clone());
    let task_service = TaskService::new(task_repo.clone(), project_repo.clone());
    let subtask_service = SubtaskService::new(subtask_repo.clone(), task_repo.clone());
    let tag_service = TagService::new(tag_repo.clone());
    let user_service = UserService::new(user_repo.clone());
    
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(project_service)
        .manage(task_service)
        .manage(subtask_service)
        .manage(tag_service)
        .manage(user_service)
        .manage(automerge_service)
        .invoke_handler(tauri::generate_handler![
            // Project commands
            create_project,
            get_project,
            list_projects,
            update_project,
            delete_project,
        ])
        .setup(|app| {
            // 起動時初期化処理
            let handle = app.handle();
            tauri::async_runtime::spawn(async move {
                // Automergeサービス起動時設定
                if let Some(automerge_service) = handle.try_state::<Arc<AutomergeRepoService>>() {
                    if let Err(e) = automerge_service.start_sync().await {
                        eprintln!("Failed to start sync: {}", e);
                    }
                }
            });
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}