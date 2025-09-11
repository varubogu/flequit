use flequit_model::models::accounts::account::Account;
use flequit_model::models::task_projects::project::Project;

pub struct InitializedData {
    pub accounts: Vec<Account>,
    pub projects: Vec<Project>,
}
