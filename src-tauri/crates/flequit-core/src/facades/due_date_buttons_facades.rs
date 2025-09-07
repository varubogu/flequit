//! 期日ボタンファサード

use flequit_infrastructure::{InfrastructureRepositories, InfrastructureRepositoriesTrait};
use crate::services::due_date_buttons_service;

pub async fn get_due_date_buttons() -> Result<Option<crate::commands::due_date_buttons_commands::DueDateButtonsCommand>, String> {
    let repositories = InfrastructureRepositories::instance().await;
    due_date_buttons_service::get_due_date_buttons(&repositories).await
}

pub async fn save_due_date_buttons(buttons: crate::commands::due_date_buttons_commands::DueDateButtonsCommand) -> Result<bool, String> {
    let repositories = InfrastructureRepositories::instance().await;
    due_date_buttons_service::save_due_date_buttons(&repositories, buttons).await
}

pub async fn reset_due_date_buttons() -> Result<bool, String> {
    let repositories = InfrastructureRepositories::instance().await;
    due_date_buttons_service::reset_due_date_buttons(&repositories).await
}