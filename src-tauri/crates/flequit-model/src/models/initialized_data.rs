
use crate::models::{
    account::Account,
    project::Project,
    setting::Settings,
};

pub struct InitializedData {
    pub settings: Settings,
    pub accounts: Vec<Account>,
    pub projects: Vec<Project>,
}

