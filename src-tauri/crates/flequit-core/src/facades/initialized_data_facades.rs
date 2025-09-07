//! 初期化データファサード

use flequit_infrastructure::{InfrastructureRepositories, InfrastructureRepositoriesTrait};
use crate::services::initialized_data_service;

pub async fn create_initialized_data(data: crate::commands::initialized_data_commands::InitializedDataCommand) -> Result<bool, String> {
    let repositories = InfrastructureRepositories::instance().await;
    initialized_data_service::create_initialized_data(&repositories, data).await
}

pub async fn get_initialized_data(data_id: String) -> Result<Option<crate::commands::initialized_data_commands::InitializedDataCommand>, String> {
    let repositories = InfrastructureRepositories::instance().await;
    initialized_data_service::get_initialized_data(&repositories, data_id).await
}

pub async fn get_all_initialized_data() -> Result<Vec<crate::commands::initialized_data_commands::InitializedDataCommand>, String> {
    let repositories = InfrastructureRepositories::instance().await;
    initialized_data_service::get_all_initialized_data(&repositories).await
}

pub async fn update_initialized_data(data: crate::commands::initialized_data_commands::InitializedDataCommand) -> Result<bool, String> {
    let repositories = InfrastructureRepositories::instance().await;
    initialized_data_service::update_initialized_data(&repositories, data).await
}

pub async fn delete_initialized_data(data_id: String) -> Result<bool, String> {
    let repositories = InfrastructureRepositories::instance().await;
    initialized_data_service::delete_initialized_data(&repositories, data_id).await
}