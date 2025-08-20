use crate::models::{
    account::Account, command::initialize::InitializedResult, project::Project, setting::Settings,
    CommandModelConverter,
};

pub struct InitializedData {
    pub settings: Settings,
    pub accounts: Vec<Account>,
    pub projects: Vec<Project>,
}

impl CommandModelConverter<InitializedResult> for InitializedData {
    async fn to_command_model(&self) -> Result<InitializedResult, String> {
        Ok(InitializedResult {
            settings: self.settings.clone(),
            accounts: self.accounts.clone(),
            projects: self.projects.clone(),
        })
    }
}
