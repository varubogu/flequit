//! 設定関連のFacade
use flequit_types::errors::service_error::ServiceError;
use flequit_model::models::app_settings::{settings::Settings, time_label::TimeLabel, view_item::ViewItem};
use flequit_infrastructure::InfrastructureRepositoriesTrait;
use crate::services::setting_service;

// エラー変換のヘルパー関数
fn handle_service_error<T>(result: Result<T, ServiceError>) -> Result<T, String> {
    result.map_err(|e| format!("{:?}", e))
}

// ---------------------------
// Settings (全体設定)
// ---------------------------

#[tracing::instrument]
pub async fn get_all_settings<R>(repositories: &R) -> Result<Settings, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    handle_service_error(setting_service::get_all_settings(repositories).await)
}

#[tracing::instrument]
pub async fn set_setting<R>(repositories: &R, key: &str, value: serde_json::Value) -> Result<(), String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    handle_service_error(setting_service::set_setting(repositories, key, value).await)
}

// ---------------------------
// Custom Date Formats (一時的に無効化)
// ---------------------------

// NOTE: これらの関数はsetting_service.rsに実装されていないため、一時的にコメントアウト
// TODO: setting_serviceでの実装が完了したら有効化する

// #[tracing::instrument]
// pub async fn get_custom_date_format(id: &str) -> Result<Option<DateTimeFormat>, String> {
//     let repositories = InfrastructureRepositories::instance().await;
//     handle_service_error(setting_service::get_custom_date_format(&repositories, id).await)
// }

// #[tracing::instrument]
// pub async fn get_all_custom_date_formats() -> Result<Vec<DateTimeFormat>, String> {
//     let repositories = InfrastructureRepositories::instance().await;
//     handle_service_error(setting_service::get_all_custom_date_formats(&repositories).await)
// }

// #[tracing::instrument]
// pub async fn add_custom_date_format(format: DateTimeFormat) -> Result<DateTimeFormat, String> {
//     let repositories = InfrastructureRepositories::instance().await;
//     handle_service_error(setting_service::add_custom_date_format(&repositories, format).await)
// }

// #[tracing::instrument]
// pub async fn update_custom_date_format(
//     format: DateTimeFormat,
// ) -> Result<DateTimeFormat, String> {
//     let repositories = InfrastructureRepositories::instance().await;
//     handle_service_error(setting_service::update_custom_date_format(&repositories, format).await)
// }

// #[tracing::instrument]
// pub async fn delete_custom_date_format(id: &str) -> Result<(), String> {
//     let repositories = InfrastructureRepositories::instance().await;
//     handle_service_error(setting_service::delete_custom_date_format(&repositories, id).await)
// }

// ---------------------------
// Time Labels
// ---------------------------

#[tracing::instrument]
pub async fn get_time_label<R>(repositories: &R, id: &str) -> Result<Option<TimeLabel>, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    handle_service_error(setting_service::get_time_label(repositories, id).await)
}

#[tracing::instrument]
pub async fn get_all_time_labels<R>(repositories: &R) -> Result<Vec<TimeLabel>, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    handle_service_error(setting_service::get_all_time_labels(repositories).await)
}

#[tracing::instrument]
pub async fn add_time_label<R>(repositories: &R, label: TimeLabel) -> Result<TimeLabel, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    handle_service_error(setting_service::add_time_label(repositories, label).await)
}

#[tracing::instrument]
pub async fn update_time_label<R>(repositories: &R, label: TimeLabel) -> Result<TimeLabel, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    handle_service_error(setting_service::update_time_label(repositories, label).await)
}

#[tracing::instrument]
pub async fn delete_time_label<R>(repositories: &R, id: &str) -> Result<(), String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    handle_service_error(setting_service::delete_time_label(repositories, id).await)
}

// ---------------------------
// View Items
// ---------------------------

#[tracing::instrument]
pub async fn get_view_item<R>(repositories: &R, id: &str) -> Result<Option<ViewItem>, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    handle_service_error(setting_service::get_view_item(repositories, id).await)
}

#[tracing::instrument]
pub async fn get_all_view_items<R>(repositories: &R) -> Result<Vec<ViewItem>, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    handle_service_error(setting_service::get_all_view_items(repositories).await)
}

#[tracing::instrument]
pub async fn add_view_item<R>(repositories: &R, item: ViewItem) -> Result<ViewItem, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    handle_service_error(setting_service::add_view_item(repositories, item).await)
}

#[tracing::instrument]
pub async fn update_view_item<R>(repositories: &R, item: ViewItem) -> Result<ViewItem, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    handle_service_error(setting_service::update_view_item(repositories, item).await)
}

#[tracing::instrument]
pub async fn delete_view_item<R>(repositories: &R, id: &str) -> Result<(), String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    handle_service_error(setting_service::delete_view_item(repositories, id).await)
}

// ---------------------------
// Settings (個別キー - レガシー対応)
// ---------------------------

#[tracing::instrument]
pub async fn get_setting<R>(repositories: &R, key: &str) -> Result<Option<String>, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    // 構造体から特定フィールドの値を文字列として返す（レガシー対応）
    let settings = setting_service::get_all_settings(repositories)
        .await
        .map_err(|e| format!("{:?}", e))?;

    let value = match key {
        "theme" => Some(settings.theme),
        "language" => Some(settings.language),
        "font" => Some(settings.font),
        "font_size" => Some(settings.font_size.to_string()),
        "font_color" => Some(settings.font_color),
        "background_color" => Some(settings.background_color),
        "week_start" => Some(settings.week_start),
        "timezone" => Some(settings.timezone),
        "date_format" => {
            // DateTimeFormat構造体を文字列に変換
            Some(serde_json::to_string(&settings.datetime_format).unwrap_or_default())
        },
        "last_selected_account" => Some(settings.selected_account),
        _ => None,
    };

    Ok(value)
}
