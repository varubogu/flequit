//! カスタム日付フォーマットファサード

use flequit_infrastructure::{InfrastructureRepositories, InfrastructureRepositoriesTrait};
use crate::services::custom_date_format_service;

pub async fn create_custom_date_format(format: crate::commands::custom_date_format_commands::CustomDateFormatCommand) -> Result<bool, String> {
    let repositories = InfrastructureRepositories::instance().await;
    custom_date_format_service::create_custom_date_format(&repositories, format).await
}

pub async fn get_custom_date_format(format_id: String) -> Result<Option<crate::commands::custom_date_format_commands::CustomDateFormatCommand>, String> {
    let repositories = InfrastructureRepositories::instance().await;
    custom_date_format_service::get_custom_date_format(&repositories, format_id).await
}

pub async fn get_all_custom_date_formats() -> Result<Vec<crate::commands::custom_date_format_commands::CustomDateFormatCommand>, String> {
    let repositories = InfrastructureRepositories::instance().await;
    custom_date_format_service::get_all_custom_date_formats(&repositories).await
}

pub async fn update_custom_date_format(format: crate::commands::custom_date_format_commands::CustomDateFormatCommand) -> Result<bool, String> {
    let repositories = InfrastructureRepositories::instance().await;
    custom_date_format_service::update_custom_date_format(&repositories, format).await
}

pub async fn delete_custom_date_format(format_id: String) -> Result<bool, String> {
    let repositories = InfrastructureRepositories::instance().await;
    custom_date_format_service::delete_custom_date_format(&repositories, format_id).await
}