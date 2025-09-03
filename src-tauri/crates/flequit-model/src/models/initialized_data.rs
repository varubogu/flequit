
use crate::models::{
    accounts::account::Account,
    task_projects::project::Project,
    app_settings::settings::Settings,
};

pub struct InitializedData {
    pub settings: Settings,
    pub accounts: Vec<Account>,
    pub projects: Vec<Project>,
}
