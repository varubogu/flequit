use flequit_core::facades::initialization_facades;
use crate::models::account::AccountCommandModel;
use crate::models::project::ProjectTreeCommandModel;
use crate::models::CommandModelConverter;
use flequit_model::models::app_settings::settings::Settings;
use crate::state::AppState;
use tauri::State;

#[tracing::instrument]
#[tauri::command]
pub async fn load_local_settings(
    state: State<'_, AppState>,
) -> Result<Option<Settings>, String> {
    let repositories = state.repositories.read().await;
    
    let settings = initialization_facades::load_local_settings(&*repositories).await?;
    Ok(settings)
}

#[tracing::instrument]
#[tauri::command]
pub async fn load_current_account(
    state: State<'_, AppState>,
) -> Result<Option<AccountCommandModel>, String> {
    let repositories = state.repositories.read().await;
    
    let account = initialization_facades::load_current_account(&*repositories).await?;
    match account {
        Some(acc) => Ok(Option::from(acc.to_command_model().await?)),
        None => Ok(None),
    }
}

#[tracing::instrument]
#[tauri::command]
pub async fn load_all_project_data(
    state: State<'_, AppState>,
) -> Result<Vec<ProjectTreeCommandModel>, String> {
    let repositories = state.repositories.read().await;
    
    let project_trees = initialization_facades::load_all_project_trees(&*repositories).await?;
    let mut command_results = Vec::new();
    for project_tree in project_trees {
        command_results.push(project_tree.to_command_model().await?);
    }
    Ok(command_results)
}

#[tracing::instrument]
#[tauri::command]
pub async fn load_all_account(
    state: State<'_, AppState>,
) -> Result<Vec<AccountCommandModel>, String> {
    let repositories = state.repositories.read().await;
    
    let accounts = initialization_facades::load_all_account(&*repositories).await?;
    let mut command_results = Vec::new();
    for account in accounts {
        command_results.push(account.to_command_model().await?);
    }
    Ok(command_results)
}
