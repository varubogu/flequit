use crate::facades::initialization_facades;
use crate::models::command::account::AccountCommand;
use crate::models::command::initialize::InitializedResult;
use crate::models::command::project::ProjectCommand;
use crate::models::setting::LocalSettings;
use crate::models::CommandModelConverter;

#[tracing::instrument]
#[tauri::command]
pub async fn load_all_data() -> Result<InitializedResult, String> {
    initialization_facades::load_all_data().await
}

#[tracing::instrument]
#[tauri::command]
pub async fn load_local_settings() -> Result<Option<LocalSettings>, String> {
    let settings = initialization_facades::load_local_settings().await?;
    Ok(settings)
}

#[tracing::instrument]
#[tauri::command]
pub async fn load_current_account() -> Result<Option<AccountCommand>, String> {
    let account = initialization_facades::load_current_account().await?;
    match account {
        Some(acc) => Ok(Some(acc.to_command_model().await?)),
        None => Ok(None),
    }
}

#[tracing::instrument]
#[tauri::command]
pub async fn load_all_project_data() -> Result<Vec<ProjectCommand>, String> {
    let projects = initialization_facades::load_all_project_data().await?;
    let mut command_results = Vec::new();
    for project in projects {
        command_results.push(project.to_command_model().await?);
    }
    Ok(command_results)
}

#[tracing::instrument]
#[tauri::command]
pub async fn load_all_account() -> Result<Vec<AccountCommand>, String> {
    let accounts = initialization_facades::load_all_account().await?;
    let mut command_results = Vec::new();
    for account in accounts {
        command_results.push(account.to_command_model().await?);
    }
    Ok(command_results)
}
