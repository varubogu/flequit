//! 繰り返し調整ファサード

use flequit_infrastructure::{InfrastructureRepositories, InfrastructureRepositoriesTrait};
use crate::services::recurrence_adjustment_service;

pub async fn create_recurrence_adjustment(adjustment: crate::commands::recurrence_adjustment_commands::RecurrenceAdjustmentCommand) -> Result<bool, String> {
    let repositories = InfrastructureRepositories::instance().await;
    recurrence_adjustment_service::create_recurrence_adjustment(&repositories, adjustment).await
}

pub async fn get_recurrence_adjustment(adjustment_id: String) -> Result<Option<crate::commands::recurrence_adjustment_commands::RecurrenceAdjustmentCommand>, String> {
    let repositories = InfrastructureRepositories::instance().await;
    recurrence_adjustment_service::get_recurrence_adjustment(&repositories, adjustment_id).await
}

pub async fn get_all_recurrence_adjustments() -> Result<Vec<crate::commands::recurrence_adjustment_commands::RecurrenceAdjustmentCommand>, String> {
    let repositories = InfrastructureRepositories::instance().await;
    recurrence_adjustment_service::get_all_recurrence_adjustments(&repositories).await
}

pub async fn update_recurrence_adjustment(adjustment: crate::commands::recurrence_adjustment_commands::RecurrenceAdjustmentCommand) -> Result<bool, String> {
    let repositories = InfrastructureRepositories::instance().await;
    recurrence_adjustment_service::update_recurrence_adjustment(&repositories, adjustment).await
}

pub async fn delete_recurrence_adjustment(adjustment_id: String) -> Result<bool, String> {
    let repositories = InfrastructureRepositories::instance().await;
    recurrence_adjustment_service::delete_recurrence_adjustment(&repositories, adjustment_id).await
}