//! 日時関連ファサード
//!
//! このモジュールは日付条件、曜日条件のService層とのインターフェースを提供します。

use crate::services::datetime_service;
use chrono::{DateTime, Utc};
use flequit_infrastructure::InfrastructureRepositoriesTrait;
use flequit_model::models::task_projects::date_condition::DateCondition;
use flequit_model::models::task_projects::weekday_condition::WeekdayCondition;
use flequit_types::errors::service_error::ServiceError;

// =============================================================================
// 日付条件関連ファサード
// =============================================================================

pub async fn create_date_condition<R>(
    repositories: &R,
    condition: DateCondition,
) -> Result<bool, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match datetime_service::create_date_condition(repositories, condition).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to create date condition: {:?}", e)),
    }
}

pub async fn get_date_condition<R>(
    repositories: &R,
    condition_id: String,
) -> Result<Option<DateCondition>, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match datetime_service::get_date_condition(repositories, &condition_id).await {
        Ok(condition) => Ok(condition),
        Err(e) => Err(format!("Failed to get date condition: {:?}", e)),
    }
}

pub async fn get_all_date_conditions<R>(repositories: &R) -> Result<Vec<DateCondition>, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match datetime_service::get_all_date_conditions(repositories).await {
        Ok(conditions) => Ok(conditions),
        Err(e) => Err(format!("Failed to get all date conditions: {:?}", e)),
    }
}

pub async fn update_date_condition<R>(
    repositories: &R,
    condition: DateCondition,
) -> Result<bool, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match datetime_service::update_date_condition(repositories, condition).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to update date condition: {:?}", e)),
    }
}

pub async fn delete_date_condition<R>(
    repositories: &R,
    condition_id: String,
) -> Result<bool, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match datetime_service::delete_date_condition(repositories, &condition_id).await {
        Ok(_) => Ok(true),
        Err(e) => Err(format!("Failed to delete date condition: {:?}", e)),
    }
}

pub async fn evaluate_date_condition<R>(
    repositories: &R,
    condition_id: String,
    target_date: DateTime<Utc>,
) -> Result<bool, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match datetime_service::evaluate_date_condition(repositories, &condition_id, target_date).await
    {
        Ok(result) => Ok(result),
        Err(e) => Err(format!("Failed to evaluate date condition: {:?}", e)),
    }
}

// =============================================================================
// 曜日条件関連ファサード
// =============================================================================

pub async fn create_weekday_condition<R>(
    repositories: &R,
    condition: WeekdayCondition,
) -> Result<bool, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match datetime_service::create_weekday_condition(repositories, condition).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to create weekday condition: {:?}", e)),
    }
}

pub async fn get_weekday_condition<R>(
    repositories: &R,
    condition_id: String,
) -> Result<Option<WeekdayCondition>, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match datetime_service::get_weekday_condition(repositories, &condition_id).await {
        Ok(condition) => Ok(condition),
        Err(e) => Err(format!("Failed to get weekday condition: {:?}", e)),
    }
}

pub async fn get_all_weekday_conditions<R>(
    repositories: &R,
) -> Result<Vec<WeekdayCondition>, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match datetime_service::get_all_weekday_conditions(repositories).await {
        Ok(conditions) => Ok(conditions),
        Err(e) => Err(format!("Failed to get all weekday conditions: {:?}", e)),
    }
}

pub async fn update_weekday_condition<R>(
    repositories: &R,
    condition: WeekdayCondition,
) -> Result<bool, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match datetime_service::update_weekday_condition(repositories, condition).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to update weekday condition: {:?}", e)),
    }
}

pub async fn delete_weekday_condition<R>(
    repositories: &R,
    condition_id: String,
) -> Result<bool, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match datetime_service::delete_weekday_condition(repositories, &condition_id).await {
        Ok(_) => Ok(true),
        Err(e) => Err(format!("Failed to delete weekday condition: {:?}", e)),
    }
}

pub async fn evaluate_weekday_condition<R>(
    repositories: &R,
    condition_id: String,
    target_date: DateTime<Utc>,
) -> Result<bool, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match datetime_service::evaluate_weekday_condition(repositories, &condition_id, target_date)
        .await
    {
        Ok(result) => Ok(result),
        Err(e) => Err(format!("Failed to evaluate weekday condition: {:?}", e)),
    }
}
