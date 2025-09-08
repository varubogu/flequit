use async_trait::async_trait;
use flequit_model::models::ModelConverter;
use crate::models::{project::ProjectTreeCommandModel, CommandModelConverter};
use crate::models::account::AccountCommandModel;
use crate::models::settings::SettingsCommandModel;
use flequit_model::models::initialized_data::InitializedData;
use flequit_model::models::task_projects::project::ProjectTree;
use serde::{Deserialize, Serialize};

/// Tauriコマンド戻り値用の初期化結果構造体（日時フィールドはString）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InitializedResult {
    pub settings: SettingsCommandModel,
    pub accounts: Vec<AccountCommandModel>,
    pub projects: Vec<ProjectTreeCommandModel>,
}

#[async_trait]
impl ModelConverter<InitializedData> for InitializedResult {
    /// ドメインデータからコマンドモデルに変換
    async fn to_model(&self) -> Result<InitializedData, String> {
        let settings = self.settings.clone().to_model().await?;

        let mut accounts = Vec::new();
        for account in &self.accounts {
            accounts.push(account.to_model().await?);
        }

        // ProjectTreeCommandからProjectTreeに変換してからProjectに変換
        let mut projects = Vec::new();
        for project in &self.projects {
            let project_tree = project.to_model().await?;
            // ProjectTreeからProjectに変換（task_listsフィールドは無視）
            let project = project_tree.to_model().await?;
            projects.push(project);
        }

        Ok(InitializedData {
            settings,
            accounts,
            projects,
        })
    }
}

#[async_trait]
impl CommandModelConverter<InitializedResult> for InitializedData {
    async fn to_command_model(&self) -> Result<InitializedResult, String> {

        let settings = self.settings.clone().to_command_model().await?;

        // ProjectからProjectTreeに変換（task_listsは空）
        let project_trees: Vec<ProjectTree> = self
            .projects
            .iter()
            .map(|project| ProjectTree {
                id: project.id.clone(),
                name: project.name.clone(),
                description: project.description.clone(),
                color: project.color.clone(),
                order_index: project.order_index,
                is_archived: project.is_archived,
                status: project.status.clone(),
                owner_id: project.owner_id.clone(),
                created_at: project.created_at,
                updated_at: project.updated_at,
                task_lists: Vec::new(), // 空のタスクリスト
            })
            .collect();


        // ProjectTreeをProjectTreeCommandに変換
        let mut project_tree_commands = Vec::new();
        for project_tree in project_trees {
            project_tree_commands.push(project_tree.to_command_model().await?);
        }

        // AccountをAccountCommandに変換
        let mut account_commands = Vec::new();
        for account in &self.accounts {
            account_commands.push(account.to_command_model().await?);
        }

        Ok(InitializedResult {
            settings,
            accounts: account_commands,
            projects: project_tree_commands,
        })
    }
}
