
use crate::models::{
    accounts::account::Account,
    task_projects::project::Project,
};

pub struct InitializedData {
    pub accounts: Vec<Account>,
    pub projects: Vec<Project>,
}
