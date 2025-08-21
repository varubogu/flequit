use crate::models::{
    account::Account, command::initialize::InitializedResult, project::{Project, ProjectTree}, setting::Settings,
    CommandModelConverter, TreeCommandConverter,
};

pub struct InitializedData {
    pub settings: Settings,
    pub accounts: Vec<Account>,
    pub projects: Vec<Project>,
}

impl CommandModelConverter<InitializedResult> for InitializedData {
    async fn to_command_model(&self) -> Result<InitializedResult, String> {
        // ProjectからProjectTreeに変換（task_listsは空）
        let project_trees: Vec<ProjectTree> = self.projects.iter().map(|project| ProjectTree {
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
        }).collect();
        
        // ProjectTreeをProjectTreeCommandに変換
        let mut project_tree_commands = Vec::new();
        for project_tree in project_trees {
            project_tree_commands.push(project_tree.to_command_model().await?);
        }
        
        Ok(InitializedResult {
            settings: self.settings.clone(),
            accounts: self.accounts.clone(),
            projects: project_tree_commands,
        })
    }
}
