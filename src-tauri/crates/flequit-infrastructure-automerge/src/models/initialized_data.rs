use flequit_model::models::accounts::account::Account;
use flequit_model::models::task_projects::project::Project;
use flequit_model::models::app_settings::settings::Settings;

pub struct InitializedData {
    pub settings: Settings,
    pub accounts: Vec<Account>,
    pub projects: Vec<Project>,
}
