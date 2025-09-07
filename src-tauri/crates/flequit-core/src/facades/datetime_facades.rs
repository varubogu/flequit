//! 日時関連ファサード
//!
//! このモジュールは日時フォーマット、カスタム日時フォーマット、
//! 日付条件、曜日条件のService層とのインターフェースを提供します。

use flequit_model::models::task_projects::{weekday_condition::WeekdayCondition};
use flequit_model::models::task_projects::date_condition::DateCondition;
use flequit_model::models::app_settings::datetime_format::DateTimeFormat;
use flequit_types::errors::service_error::ServiceError;
use flequit_infrastructure::InfrastructureRepositories;
use crate::services::datetime_service;
use chrono::{DateTime, Utc};

// Commandモデルをインポート
// Command型は削除 - flequit-coreでは使用しない

// =============================================================================
// 日時フォーマット関連ファサード
// =============================================================================

#[tracing::instrument(level = "trace")]
pub async fn create_datetime_format(format: DateTimeFormat) -> Result<bool, String> {
    let repositories = InfrastructureRepositories::instance().await;
    match datetime_service::create_datetime_format(&repositories, format).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to create datetime format: {:?}", e)),
    }
}

#[tracing::instrument(level = "trace")]
pub async fn get_datetime_format(format_id: String) -> Result<Option<DateTimeFormat>, String> {
    let repositories = InfrastructureRepositories::instance().await;
    match datetime_service::get_datetime_format(&repositories, &format_id).await {
        Ok(format) => Ok(format),
        Err(e) => Err(format!("Failed to get datetime format: {:?}", e)),
    }
}

#[tracing::instrument(level = "trace")]
pub async fn get_all_datetime_formats() -> Result<Vec<DateTimeFormat>, String> {
    let repositories = InfrastructureRepositories::instance().await;
    match datetime_service::get_all_datetime_formats(&repositories).await {
        Ok(formats) => Ok(formats),
        Err(e) => Err(format!("Failed to get all datetime formats: {:?}", e)),
    }
}

#[tracing::instrument(level = "trace")]
pub async fn update_datetime_format(format: DateTimeFormat) -> Result<bool, String> {
    let repositories = InfrastructureRepositories::instance().await;
    match datetime_service::update_datetime_format(&repositories, format).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to update datetime format: {:?}", e)),
    }
}

#[tracing::instrument(level = "trace")]
pub async fn delete_datetime_format(format_id: String) -> Result<bool, String> {
    let repositories = InfrastructureRepositories::instance().await;
    match datetime_service::delete_datetime_format(&repositories, &format_id).await {
        Ok(_) => Ok(true),
        Err(e) => Err(format!("Failed to delete datetime format: {:?}", e)),
    }
}

// =============================================================================
// 日付条件関連ファサード
// =============================================================================

#[tracing::instrument(level = "trace")]
pub async fn create_date_condition(condition: DateCondition) -> Result<bool, String> {
    let repositories = InfrastructureRepositories::instance().await;
    match datetime_service::create_date_condition(&repositories, condition).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to create date condition: {:?}", e)),
    }
}

#[tracing::instrument(level = "trace")]
pub async fn get_date_condition(condition_id: String) -> Result<Option<DateCondition>, String> {
    let repositories = InfrastructureRepositories::instance().await;
    match datetime_service::get_date_condition(&repositories, &condition_id).await {
        Ok(condition) => Ok(condition),
        Err(e) => Err(format!("Failed to get date condition: {:?}", e)),
    }
}

#[tracing::instrument(level = "trace")]
pub async fn get_all_date_conditions() -> Result<Vec<DateCondition>, String> {
    let repositories = InfrastructureRepositories::instance().await;
    match datetime_service::get_all_date_conditions(&repositories).await {
        Ok(conditions) => Ok(conditions),
        Err(e) => Err(format!("Failed to get all date conditions: {:?}", e)),
    }
}

#[tracing::instrument(level = "trace")]
pub async fn update_date_condition(condition: DateCondition) -> Result<bool, String> {
    let repositories = InfrastructureRepositories::instance().await;
    match datetime_service::update_date_condition(&repositories, condition).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to update date condition: {:?}", e)),
    }
}

#[tracing::instrument(level = "trace")]
pub async fn delete_date_condition(condition_id: String) -> Result<bool, String> {
    let repositories = InfrastructureRepositories::instance().await;
    match datetime_service::delete_date_condition(&repositories, &condition_id).await {
        Ok(_) => Ok(true),
        Err(e) => Err(format!("Failed to delete date condition: {:?}", e)),
    }
}

#[tracing::instrument(level = "trace")]
pub async fn evaluate_date_condition(condition_id: String, target_date: DateTime<Utc>) -> Result<bool, String> {
    let repositories = InfrastructureRepositories::instance().await;
    match datetime_service::evaluate_date_condition(&repositories, &condition_id, target_date).await {
        Ok(result) => Ok(result),
        Err(e) => Err(format!("Failed to evaluate date condition: {:?}", e)),
    }
}

// =============================================================================
// 曜日条件関連ファサード
// =============================================================================

#[tracing::instrument(level = "trace")]
pub async fn create_weekday_condition(condition: WeekdayCondition) -> Result<bool, String> {
    let repositories = InfrastructureRepositories::instance().await;
    match datetime_service::create_weekday_condition(&repositories, condition).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to create weekday condition: {:?}", e)),
    }
}

#[tracing::instrument(level = "trace")]
pub async fn get_weekday_condition(condition_id: String) -> Result<Option<WeekdayCondition>, String> {
    let repositories = InfrastructureRepositories::instance().await;
    match datetime_service::get_weekday_condition(&repositories, &condition_id).await {
        Ok(condition) => Ok(condition),
        Err(e) => Err(format!("Failed to get weekday condition: {:?}", e)),
    }
}

#[tracing::instrument(level = "trace")]
pub async fn get_all_weekday_conditions() -> Result<Vec<WeekdayCondition>, String> {
    let repositories = InfrastructureRepositories::instance().await;
    match datetime_service::get_all_weekday_conditions(&repositories).await {
        Ok(conditions) => Ok(conditions),
        Err(e) => Err(format!("Failed to get all weekday conditions: {:?}", e)),
    }
}

#[tracing::instrument(level = "trace")]
pub async fn update_weekday_condition(condition: WeekdayCondition) -> Result<bool, String> {
    let repositories = InfrastructureRepositories::instance().await;
    match datetime_service::update_weekday_condition(&repositories, condition).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to update weekday condition: {:?}", e)),
    }
}

#[tracing::instrument(level = "trace")]
pub async fn delete_weekday_condition(condition_id: String) -> Result<bool, String> {
    let repositories = InfrastructureRepositories::instance().await;
    match datetime_service::delete_weekday_condition(&repositories, &condition_id).await {
        Ok(_) => Ok(true),
        Err(e) => Err(format!("Failed to delete weekday condition: {:?}", e)),
    }
}

#[tracing::instrument(level = "trace")]
pub async fn evaluate_weekday_condition(condition_id: String, target_date: DateTime<Utc>) -> Result<bool, String> {
    let repositories = InfrastructureRepositories::instance().await;
    match datetime_service::evaluate_weekday_condition(&repositories, &condition_id, target_date).await {
        Ok(result) => Ok(result),
        Err(e) => Err(format!("Failed to evaluate weekday condition: {:?}", e)),
    }
}
