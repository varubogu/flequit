//! 繰り返し詳細ファサード

use flequit_infrastructure::{InfrastructureRepositories, InfrastructureRepositoriesTrait};
use crate::services::recurrence_details_service;

pub async fn create_recurrence_details(details: crate::commands::recurrence_details_commands::RecurrenceDetailsCommand) -> Result<bool, String> {
    let repositories = InfrastructureRepositories::instance().await;
    recurrence_details_service::create_recurrence_details(&repositories, details).await
}

pub async fn get_recurrence_details(details_id: String) -> Result<Option<crate::commands::recurrence_details_commands::RecurrenceDetailsCommand>, String> {
    let repositories = InfrastructureRepositories::instance().await;
    recurrence_details_service::get_recurrence_details(&repositories, details_id).await
}

pub async fn get_all_recurrence_details() -> Result<Vec<crate::commands::recurrence_details_commands::RecurrenceDetailsCommand>, String> {
    let repositories = InfrastructureRepositories::instance().await;
    recurrence_details_service::get_all_recurrence_details(&repositories).await
}

pub async fn update_recurrence_details(details: crate::commands::recurrence_details_commands::RecurrenceDetailsCommand) -> Result<bool, String> {
    let repositories = InfrastructureRepositories::instance().await;
    recurrence_details_service::update_recurrence_details(&repositories, details).await
}

pub async fn delete_recurrence_details(details_id: String) -> Result<bool, String> {
    let repositories = InfrastructureRepositories::instance().await;
    recurrence_details_service::delete_recurrence_details(&repositories, details_id).await
}