//! 日付条件ファサード

use flequit_infrastructure::{InfrastructureRepositories, InfrastructureRepositoriesTrait};
use crate::services::date_condition_service;

pub async fn create_date_condition(condition: crate::commands::date_condition_commands::DateConditionCommand) -> Result<bool, String> {
    let repositories = InfrastructureRepositories::instance().await;
    date_condition_service::create_date_condition(&repositories, condition).await
}

pub async fn get_date_condition(condition_id: String) -> Result<Option<crate::commands::date_condition_commands::DateConditionCommand>, String> {
    let repositories = InfrastructureRepositories::instance().await;
    date_condition_service::get_date_condition(&repositories, condition_id).await
}

pub async fn get_all_date_conditions() -> Result<Vec<crate::commands::date_condition_commands::DateConditionCommand>, String> {
    let repositories = InfrastructureRepositories::instance().await;
    date_condition_service::get_all_date_conditions(&repositories).await
}

pub async fn update_date_condition(condition: crate::commands::date_condition_commands::DateConditionCommand) -> Result<bool, String> {
    let repositories = InfrastructureRepositories::instance().await;
    date_condition_service::update_date_condition(&repositories, condition).await
}

pub async fn delete_date_condition(condition_id: String) -> Result<bool, String> {
    let repositories = InfrastructureRepositories::instance().await;
    date_condition_service::delete_date_condition(&repositories, condition_id).await
}