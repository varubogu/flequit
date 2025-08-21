//! 設定関連のビジネスロジック
use crate::errors::service_error::ServiceError;
use crate::models::setting::{CustomDateFormat, Settings, TimeLabel, ViewItem};
use crate::repositories::setting_repository_trait::SettingRepositoryTrait;
use crate::repositories::Repositories;
use uuid::Uuid;

// ---------------------------
// Settings (全体設定)
// ---------------------------

/// すべての設定項目を各リポジトリから取得し、Settings構造体として返します。
pub async fn get_all_settings() -> Result<Settings, ServiceError> {
    let repository = Repositories::new().await?;
    
    // メインの設定を取得
    let base_settings = repository
        .settings
        .get_settings()
        .await
        .map_err(|e| ServiceError::InternalError(format!("Repository error: {:?}", e)))?
        .unwrap_or_default(); // デフォルト設定を使用
        
    // 関連データを取得
    let custom_date_formats = repository
        .settings
        .get_all_custom_date_formats()
        .await
        .map_err(|e| ServiceError::InternalError(format!("Repository error: {:?}", e)))?;
    let time_labels = repository
        .settings
        .get_all_time_labels()
        .await
        .map_err(|e| ServiceError::InternalError(format!("Repository error: {:?}", e)))?;
    let view_items = repository
        .settings
        .get_all_view_items()
        .await
        .map_err(|e| ServiceError::InternalError(format!("Repository error: {:?}", e)))?;

    // Settings構造体を組み立て
    let settings = Settings {
        custom_date_formats,
        time_labels,
        view_items,
        ..base_settings
    };

    Ok(settings)
}

/// 設定を保存します。
pub async fn save_settings(settings: &Settings) -> Result<(), ServiceError> {
    let repository = Repositories::new().await?;
    repository
        .settings
        .save_settings(settings)
        .await
        .map_err(|e| ServiceError::InternalError(format!("Repository error: {:?}", e)))
}

/// 特定のキーの設定値を保存します（レガシー対応）。
pub async fn set_setting(key: &str, value: serde_json::Value) -> Result<(), ServiceError> {
    // 現在の設定を取得
    let mut current_settings = get_all_settings().await?;
    
    // 指定されたキーの値を更新
    match key {
        "theme" => current_settings.theme = value.as_str().unwrap_or_default().to_string(),
        "language" => current_settings.language = value.as_str().unwrap_or_default().to_string(),
        "font" => current_settings.font = value.as_str().unwrap_or_default().to_string(),
        "font_size" => current_settings.font_size = value.as_i64().unwrap_or_default() as i32,
        "font_color" => current_settings.font_color = value.as_str().unwrap_or_default().to_string(),
        "background_color" => current_settings.background_color = value.as_str().unwrap_or_default().to_string(),
        "week_start" => current_settings.week_start = value.as_str().unwrap_or_default().to_string(),
        "timezone" => current_settings.timezone = value.as_str().unwrap_or_default().to_string(),
        "date_format" => current_settings.date_format = value.as_str().unwrap_or_default().to_string(),
        "selected_account" => current_settings.selected_account = value.as_str().unwrap_or_default().to_string(),
        "account_name" => current_settings.account_name = value.as_str().unwrap_or_default().to_string(),
        "email" => current_settings.email = value.as_str().unwrap_or_default().to_string(),
        "password" => current_settings.password = value.as_str().unwrap_or_default().to_string(),
        "server_url" => current_settings.server_url = value.as_str().unwrap_or_default().to_string(),
        "account_icon" => current_settings.account_icon = value.as_str().map(|s| s.to_string()),
        // JSONフィールドの場合
        "custom_due_days" => {
            if let Ok(days) = serde_json::from_value(value) {
                current_settings.custom_due_days = days;
            }
        },
        "due_date_buttons" => {
            if let Ok(buttons) = serde_json::from_value(value) {
                current_settings.due_date_buttons = buttons;
            }
        },
        _ => return Err(ServiceError::InvalidArgument(format!("Unknown setting key: {}", key))),
    }
    
    // 更新された設定を保存
    save_settings(&current_settings).await
}

// ---------------------------
// Custom Date Formats
// ---------------------------

pub async fn get_custom_date_format(id: &str) -> Result<Option<CustomDateFormat>, ServiceError> {
    let repository = Repositories::new().await?;
    repository
        .settings
        .get_custom_date_format(id)
        .await
        .map_err(|e| ServiceError::InternalError(format!("Repository error: {:?}", e)))
}

pub async fn get_all_custom_date_formats() -> Result<Vec<CustomDateFormat>, ServiceError> {
    let repository = Repositories::new().await?;
    repository
        .settings
        .get_all_custom_date_formats()
        .await
        .map_err(|e| ServiceError::InternalError(format!("Repository error: {:?}", e)))
}

pub async fn add_custom_date_format(
    mut format: CustomDateFormat,
) -> Result<CustomDateFormat, ServiceError> {
    if format.id.is_empty() {
        format.id = Uuid::new_v4().to_string();
    }
    let repository = Repositories::new().await?;
    repository
        .settings
        .add_custom_date_format(&format)
        .await
        .map_err(|e| ServiceError::InternalError(format!("Repository error: {:?}", e)))?;
    Ok(format)
}

pub async fn update_custom_date_format(
    format: CustomDateFormat,
) -> Result<CustomDateFormat, ServiceError> {
    let repository = Repositories::new().await?;
    repository
        .settings
        .update_custom_date_format(&format)
        .await
        .map_err(|e| ServiceError::InternalError(format!("Repository error: {:?}", e)))?;
    Ok(format)
}

pub async fn delete_custom_date_format(id: &str) -> Result<(), ServiceError> {
    let repository = Repositories::new().await?;
    repository
        .settings
        .delete_custom_date_format(id)
        .await
        .map_err(|e| ServiceError::InternalError(format!("Repository error: {:?}", e)))
}

// ---------------------------
// Time Labels
// ---------------------------

pub async fn get_time_label(id: &str) -> Result<Option<TimeLabel>, ServiceError> {
    let repository = Repositories::new().await?;
    repository
        .settings
        .get_time_label(id)
        .await
        .map_err(|e| ServiceError::InternalError(format!("Repository error: {:?}", e)))
}

pub async fn get_all_time_labels() -> Result<Vec<TimeLabel>, ServiceError> {
    let repository = Repositories::new().await?;
    repository
        .settings
        .get_all_time_labels()
        .await
        .map_err(|e| ServiceError::InternalError(format!("Repository error: {:?}", e)))
}

pub async fn add_time_label(mut label: TimeLabel) -> Result<TimeLabel, ServiceError> {
    if label.id.is_empty() {
        label.id = Uuid::new_v4().to_string();
    }
    let repository = Repositories::new().await?;
    repository
        .settings
        .add_time_label(&label)
        .await
        .map_err(|e| ServiceError::InternalError(format!("Repository error: {:?}", e)))?;
    Ok(label)
}

pub async fn update_time_label(label: TimeLabel) -> Result<TimeLabel, ServiceError> {
    let repository = Repositories::new().await?;
    repository
        .settings
        .update_time_label(&label)
        .await
        .map_err(|e| ServiceError::InternalError(format!("Repository error: {:?}", e)))?;
    Ok(label)
}

pub async fn delete_time_label(id: &str) -> Result<(), ServiceError> {
    let repository = Repositories::new().await?;
    repository
        .settings
        .delete_time_label(id)
        .await
        .map_err(|e| ServiceError::InternalError(format!("Repository error: {:?}", e)))
}

// ---------------------------
// View Items
// ---------------------------

pub async fn get_view_item(id: &str) -> Result<Option<ViewItem>, ServiceError> {
    let repository = Repositories::new().await?;
    repository
        .settings
        .get_view_item(id)
        .await
        .map_err(|e| ServiceError::InternalError(format!("Repository error: {:?}", e)))
}

pub async fn get_all_view_items() -> Result<Vec<ViewItem>, ServiceError> {
    let repository = Repositories::new().await?;
    repository
        .settings
        .get_all_view_items()
        .await
        .map_err(|e| ServiceError::InternalError(format!("Repository error: {:?}", e)))
}

pub async fn add_view_item(mut item: ViewItem) -> Result<ViewItem, ServiceError> {
    if item.id.is_empty() {
        item.id = Uuid::new_v4().to_string();
    }
    let repository = Repositories::new().await?;
    repository
        .settings
        .add_view_item(&item)
        .await
        .map_err(|e| ServiceError::InternalError(format!("Repository error: {:?}", e)))?;
    Ok(item)
}

pub async fn update_view_item(item: ViewItem) -> Result<ViewItem, ServiceError> {
    let repository = Repositories::new().await?;
    repository
        .settings
        .update_view_item(&item)
        .await
        .map_err(|e| ServiceError::InternalError(format!("Repository error: {:?}", e)))?;
    Ok(item)
}

pub async fn delete_view_item(id: &str) -> Result<(), ServiceError> {
    let repository = Repositories::new().await?;
    repository
        .settings
        .delete_view_item(id)
        .await
        .map_err(|e| ServiceError::InternalError(format!("Repository error: {:?}", e)))
}
