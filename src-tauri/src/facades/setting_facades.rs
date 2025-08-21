//! 設定関連のFacade
use crate::errors::service_error::ServiceError;
use crate::models::setting::{CustomDateFormat, Settings, TimeLabel, ViewItem};
use crate::services::setting_service;

// エラー変換のヘルパー関数
fn handle_service_error<T>(result: Result<T, ServiceError>) -> Result<T, String> {
    result.map_err(|e| format!("{:?}", e))
}

// ---------------------------
// Settings (全体設定)
// ---------------------------

pub async fn get_all_settings() -> Result<Settings, String> {
    handle_service_error(setting_service::get_all_settings().await)
}

pub async fn set_setting(key: &str, value: serde_json::Value) -> Result<(), String> {
    handle_service_error(setting_service::set_setting(key, value).await)
}

// ---------------------------
// Custom Date Formats
// ---------------------------

pub async fn get_custom_date_format(id: &str) -> Result<Option<CustomDateFormat>, String> {
    handle_service_error(setting_service::get_custom_date_format(id).await)
}

pub async fn get_all_custom_date_formats() -> Result<Vec<CustomDateFormat>, String> {
    handle_service_error(setting_service::get_all_custom_date_formats().await)
}

pub async fn add_custom_date_format(format: CustomDateFormat) -> Result<CustomDateFormat, String> {
    handle_service_error(setting_service::add_custom_date_format(format).await)
}

pub async fn update_custom_date_format(
    format: CustomDateFormat,
) -> Result<CustomDateFormat, String> {
    handle_service_error(setting_service::update_custom_date_format(format).await)
}

pub async fn delete_custom_date_format(id: &str) -> Result<(), String> {
    handle_service_error(setting_service::delete_custom_date_format(id).await)
}

// ---------------------------
// Time Labels
// ---------------------------

pub async fn get_time_label(id: &str) -> Result<Option<TimeLabel>, String> {
    handle_service_error(setting_service::get_time_label(id).await)
}

pub async fn get_all_time_labels() -> Result<Vec<TimeLabel>, String> {
    handle_service_error(setting_service::get_all_time_labels().await)
}

pub async fn add_time_label(label: TimeLabel) -> Result<TimeLabel, String> {
    handle_service_error(setting_service::add_time_label(label).await)
}

pub async fn update_time_label(label: TimeLabel) -> Result<TimeLabel, String> {
    handle_service_error(setting_service::update_time_label(label).await)
}

pub async fn delete_time_label(id: &str) -> Result<(), String> {
    handle_service_error(setting_service::delete_time_label(id).await)
}

// ---------------------------
// View Items
// ---------------------------

pub async fn get_view_item(id: &str) -> Result<Option<ViewItem>, String> {
    handle_service_error(setting_service::get_view_item(id).await)
}

pub async fn get_all_view_items() -> Result<Vec<ViewItem>, String> {
    handle_service_error(setting_service::get_all_view_items().await)
}

pub async fn add_view_item(item: ViewItem) -> Result<ViewItem, String> {
    handle_service_error(setting_service::add_view_item(item).await)
}

pub async fn update_view_item(item: ViewItem) -> Result<ViewItem, String> {
    handle_service_error(setting_service::update_view_item(item).await)
}

pub async fn delete_view_item(id: &str) -> Result<(), String> {
    handle_service_error(setting_service::delete_view_item(id).await)
}

// ---------------------------
// Settings (個別キー - レガシー対応)
// ---------------------------

pub async fn get_setting(key: &str) -> Result<Option<String>, String> {
    // 構造体から特定フィールドの値を文字列として返す（レガシー対応）
    let settings = setting_service::get_all_settings().await.map_err(|e| format!("{:?}", e))?;
    
    let value = match key {
        "theme" => Some(settings.theme),
        "language" => Some(settings.language),
        "font" => Some(settings.font),
        "font_size" => Some(settings.font_size.to_string()),
        "font_color" => Some(settings.font_color),
        "background_color" => Some(settings.background_color),
        "week_start" => Some(settings.week_start),
        "timezone" => Some(settings.timezone),
        "date_format" => Some(settings.date_format),
        "selected_account" => Some(settings.selected_account),
        "account_name" => Some(settings.account_name),
        "email" => Some(settings.email),
        "password" => Some(settings.password),
        "server_url" => Some(settings.server_url),
        "account_icon" => settings.account_icon,
        _ => None,
    };
    
    Ok(value)
}
