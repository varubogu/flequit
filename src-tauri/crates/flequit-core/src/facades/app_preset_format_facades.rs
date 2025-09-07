//! アプリプリセットフォーマットファサード

use flequit_infrastructure::{InfrastructureRepositories, InfrastructureRepositoriesTrait};
use crate::services::app_preset_format_service;

pub async fn create_app_preset_format(preset: crate::commands::app_preset_format_commands::AppPresetFormatCommand) -> Result<bool, String> {
    let repositories = InfrastructureRepositories::instance().await;
    app_preset_format_service::create_app_preset_format(&repositories, preset).await
}

pub async fn get_app_preset_format(preset_id: String) -> Result<Option<crate::commands::app_preset_format_commands::AppPresetFormatCommand>, String> {
    let repositories = InfrastructureRepositories::instance().await;
    app_preset_format_service::get_app_preset_format(&repositories, preset_id).await
}

pub async fn get_all_app_preset_formats() -> Result<Vec<crate::commands::app_preset_format_commands::AppPresetFormatCommand>, String> {
    let repositories = InfrastructureRepositories::instance().await;
    app_preset_format_service::get_all_app_preset_formats(&repositories).await
}

pub async fn update_app_preset_format(preset: crate::commands::app_preset_format_commands::AppPresetFormatCommand) -> Result<bool, String> {
    let repositories = InfrastructureRepositories::instance().await;
    app_preset_format_service::update_app_preset_format(&repositories, preset).await
}

pub async fn delete_app_preset_format(preset_id: String) -> Result<bool, String> {
    let repositories = InfrastructureRepositories::instance().await;
    app_preset_format_service::delete_app_preset_format(&repositories, preset_id).await
}