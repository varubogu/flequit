//! カスタム日時フォーマットファサード

use flequit_infrastructure::{InfrastructureRepositories, InfrastructureRepositoriesTrait};
use crate::services::custom_datetime_format_service;

pub async fn create_custom_datetime_format(format: crate::commands::custom_datetime_format_commands::CustomDatetimeFormatCommand) -> Result<bool, String> {
    let repositories = InfrastructureRepositories::instance().await;
    custom_datetime_format_service::create_custom_datetime_format(&repositories, format).await
}

pub async fn get_custom_datetime_format(format_id: String) -> Result<Option<crate::commands::custom_datetime_format_commands::CustomDatetimeFormatCommand>, String> {
    let repositories = InfrastructureRepositories::instance().await;
    custom_datetime_format_service::get_custom_datetime_format(&repositories, format_id).await
}

pub async fn get_all_custom_datetime_formats() -> Result<Vec<crate::commands::custom_datetime_format_commands::CustomDatetimeFormatCommand>, String> {
    let repositories = InfrastructureRepositories::instance().await;
    custom_datetime_format_service::get_all_custom_datetime_formats(&repositories).await
}

pub async fn update_custom_datetime_format(format: crate::commands::custom_datetime_format_commands::CustomDatetimeFormatCommand) -> Result<bool, String> {
    let repositories = InfrastructureRepositories::instance().await;
    custom_datetime_format_service::update_custom_datetime_format(&repositories, format).await
}

pub async fn delete_custom_datetime_format(format_id: String) -> Result<bool, String> {
    let repositories = InfrastructureRepositories::instance().await;
    custom_datetime_format_service::delete_custom_datetime_format(&repositories, format_id).await
}