use crate::models::account::AccountCommandModel;
use crate::models::project::ProjectTreeCommandModel;
use crate::models::CommandModelConverter;
use crate::state::AppState;
use flequit_core::facades::initialization_facades;
use tauri::State;


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


#[tauri::command]
pub async fn load_all_project_data(
    state: State<'_, AppState>,
) -> Result<Vec<ProjectTreeCommandModel>, String> {
    let repositories = state.repositories.read().await;

    let project_trees = initialization_facades::load_all_project_trees(&*repositories).await?;
    let mut command_results = Vec::new();
    
    for project_tree in project_trees {
        // プロジェクト内の全タグを取得
        use flequit_core::services::tag_service;
        let all_tags = tag_service::list_tags(&*repositories, &project_tree.id).await
            .map_err(|e| e.to_string())?;
        
        // タグをCommandModelに変換
        let mut tag_commands = Vec::new();
        for tag in all_tags {
            tag_commands.push(tag.to_command_model().await?);
        }
        
        // ProjectTreeCommandModelを手動で構築（タグ付き）
        let mut task_list_commands = Vec::new();
        for task_list in &project_tree.task_lists {
            task_list_commands.push(task_list.to_command_model().await?);
        }
        
        let project_tree_command = ProjectTreeCommandModel {
            id: project_tree.id.to_string(),
            name: project_tree.name,
            description: project_tree.description,
            color: project_tree.color,
            order_index: project_tree.order_index,
            is_archived: project_tree.is_archived,
            status: project_tree.status,
            owner_id: project_tree.owner_id.map(|id| id.to_string()),
            created_at: project_tree.created_at.to_rfc3339(),
            updated_at: project_tree.updated_at.to_rfc3339(),
            task_lists: task_list_commands,
            all_tags: tag_commands,
        };
        
        command_results.push(project_tree_command);
    }
    Ok(command_results)
}


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
