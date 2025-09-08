use flequit_core::facades::initialization_facades;
use crate::models::account::AccountCommandModel;
use crate::models::project::ProjectTreeCommandModel;
use crate::models::CommandModelConverter;
use flequit_model::models::app_settings::settings::Settings;

#[tracing::instrument]
#[tauri::command]
pub async fn load_local_settings() -> Result<Option<Settings>, String> {
    let settings = initialization_facades::load_local_settings().await?;
    Ok(settings)
}

#[tracing::instrument]
#[tauri::command]
pub async fn load_current_account() -> Result<Option<AccountCommandModel>, String> {
    let account = initialization_facades::load_current_account().await?;
    match account {
        Some(acc) => Ok(Option::from(acc.to_command_model().await?)),
        None => Ok(None),
    }
}

#[tracing::instrument]
#[tauri::command]
pub async fn load_all_project_data() -> Result<Vec<ProjectTreeCommandModel>, String> {
    let project_trees = initialization_facades::load_all_project_trees().await?;
    let mut command_results = Vec::new();
    for project_tree in project_trees {
        command_results.push(project_tree.to_command_model().await?);
    }
    Ok(command_results)
}

#[tracing::instrument]
#[tauri::command]
pub async fn load_all_account() -> Result<Vec<AccountCommandModel>, String> {
    let accounts = initialization_facades::load_all_account().await?;
    let mut command_results = Vec::new();
    for account in accounts {
        command_results.push(account.to_command_model().await?);
    }
    Ok(command_results)
}
