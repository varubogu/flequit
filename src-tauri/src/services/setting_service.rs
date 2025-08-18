//! 設定関連のビジネスロジック
use crate::errors::service_error::ServiceError;
use crate::models::setting::{CustomDateFormat, Settings, TimeLabel, ViewItem};
use crate::repositories::Repositories;
use crate::repositories::setting_repository_trait::SettingRepositoryTrait;
use uuid::Uuid;

// ---------------------------
// Settings (全体設定)
// ---------------------------

/// すべての設定項目を各リポジトリから取得し、Settings構造体に組み立てて返します。
pub async fn get_all_settings() -> Result<Settings, ServiceError> {
    let repository = Repositories::new().await?;
    let kv_settings = repository.settings.get_all_key_value_settings().await
        .map_err(|e| ServiceError::InternalError(format!("Repository error: {:?}", e)))?;
    let custom_date_formats = repository.settings.get_all_custom_date_formats().await
        .map_err(|e| ServiceError::InternalError(format!("Repository error: {:?}", e)))?;
    let time_labels = repository.settings.get_all_time_labels().await
        .map_err(|e| ServiceError::InternalError(format!("Repository error: {:?}", e)))?;
    let view_items = repository.settings.get_all_view_items().await
        .map_err(|e| ServiceError::InternalError(format!("Repository error: {:?}", e)))?;

    // HashMapからSettings構造体にマッピング
    // `get` は `Option` を返すため、`unwrap_or_else` でデフォルト値を設定
    let settings = Settings {
        theme: kv_settings.get("theme").cloned().unwrap_or_else(|| "system".to_string()),
        language: kv_settings.get("language").cloned().unwrap_or_else(|| "ja".to_string()),
        font: kv_settings.get("font").cloned().unwrap_or_default(),
        font_size: kv_settings.get("fontSize").and_then(|s| s.parse().ok()).unwrap_or(14),
        font_color: kv_settings.get("fontColor").cloned().unwrap_or_default(),
        background_color: kv_settings.get("backgroundColor").cloned().unwrap_or_default(),
        week_start: kv_settings.get("weekStart").cloned().unwrap_or_else(|| "sunday".to_string()),
        timezone: kv_settings.get("timezone").cloned().unwrap_or_default(),
        date_format: kv_settings.get("dateFormat").cloned().unwrap_or_default(),
        custom_due_days: kv_settings.get("customDueDays")
            .and_then(|s| serde_json::from_str(s).ok())
            .unwrap_or_default(),
        due_date_buttons: kv_settings.get("dueDateButtons")
            .and_then(|s| serde_json::from_str(s).ok())
            .unwrap_or_else(Default::default),
        selected_account: kv_settings.get("selectedAccount").cloned().unwrap_or_default(),
        account_icon: kv_settings.get("accountIcon").cloned(),
        account_name: kv_settings.get("accountName").cloned().unwrap_or_default(),
        email: kv_settings.get("email").cloned().unwrap_or_default(),
        password: kv_settings.get("password").cloned().unwrap_or_default(),
        server_url: kv_settings.get("serverUrl").cloned().unwrap_or_default(),

        // List items
        custom_date_formats,
        time_labels,
        view_items,
    };

    Ok(settings)
}

/// 特定のキーの設定値を取得します。
pub async fn get_setting(key: &str) -> Result<Option<String>, ServiceError> {
    let repository = Repositories::new().await?;
    repository.settings.get_setting(key).await
        .map_err(|e| ServiceError::InternalError(format!("Repository error: {:?}", e)))
}

/// 特定のキーの設定値を保存します。
pub async fn set_setting(key: &str, value: serde_json::Value) -> Result<(), ServiceError> {
    let repository = Repositories::new().await?;
    let value_str = value.to_string();
    repository.settings.set_setting(key, &value_str).await
        .map_err(|e| ServiceError::InternalError(format!("Repository error: {:?}", e)))
}

// ---------------------------
// Custom Date Formats
// ---------------------------

pub async fn get_custom_date_format(id: &str) -> Result<Option<CustomDateFormat>, ServiceError> {
    let repository = Repositories::new().await?;
    repository.settings.get_custom_date_format(id).await
        .map_err(|e| ServiceError::InternalError(format!("Repository error: {:?}", e)))
}

pub async fn get_all_custom_date_formats() -> Result<Vec<CustomDateFormat>, ServiceError> {
    let repository = Repositories::new().await?;
    repository.settings.get_all_custom_date_formats().await
        .map_err(|e| ServiceError::InternalError(format!("Repository error: {:?}", e)))
}

pub async fn add_custom_date_format(mut format: CustomDateFormat) -> Result<CustomDateFormat, ServiceError> {
    if format.id.is_empty() {
        format.id = Uuid::new_v4().to_string();
    }
    let repository = Repositories::new().await?;
    repository.settings.add_custom_date_format(&format).await
        .map_err(|e| ServiceError::InternalError(format!("Repository error: {:?}", e)))?;
    Ok(format)
}

pub async fn update_custom_date_format(format: CustomDateFormat) -> Result<CustomDateFormat, ServiceError> {
    let repository = Repositories::new().await?;
    repository.settings.update_custom_date_format(&format).await
        .map_err(|e| ServiceError::InternalError(format!("Repository error: {:?}", e)))?;
    Ok(format)
}

pub async fn delete_custom_date_format(id: &str) -> Result<(), ServiceError> {
    let repository = Repositories::new().await?;
    repository.settings.delete_custom_date_format(id).await
        .map_err(|e| ServiceError::InternalError(format!("Repository error: {:?}", e)))
}

// ---------------------------
// Time Labels
// ---------------------------

pub async fn get_time_label(id: &str) -> Result<Option<TimeLabel>, ServiceError> {
    let repository = Repositories::new().await?;
    repository.settings.get_time_label(id).await
        .map_err(|e| ServiceError::InternalError(format!("Repository error: {:?}", e)))
}

pub async fn get_all_time_labels() -> Result<Vec<TimeLabel>, ServiceError> {
    let repository = Repositories::new().await?;
    repository.settings.get_all_time_labels().await
        .map_err(|e| ServiceError::InternalError(format!("Repository error: {:?}", e)))
}

pub async fn add_time_label(mut label: TimeLabel) -> Result<TimeLabel, ServiceError> {
    if label.id.is_empty() {
        label.id = Uuid::new_v4().to_string();
    }
    let repository = Repositories::new().await?;
    repository.settings.add_time_label(&label).await
        .map_err(|e| ServiceError::InternalError(format!("Repository error: {:?}", e)))?;
    Ok(label)
}

pub async fn update_time_label(label: TimeLabel) -> Result<TimeLabel, ServiceError> {
    let repository = Repositories::new().await?;
    repository.settings.update_time_label(&label).await
        .map_err(|e| ServiceError::InternalError(format!("Repository error: {:?}", e)))?;
    Ok(label)
}

pub async fn delete_time_label(id: &str) -> Result<(), ServiceError> {
    let repository = Repositories::new().await?;
    repository.settings.delete_time_label(id).await
        .map_err(|e| ServiceError::InternalError(format!("Repository error: {:?}", e)))
}

// ---------------------------
// View Items
// ---------------------------

pub async fn get_view_item(id: &str) -> Result<Option<ViewItem>, ServiceError> {
    let repository = Repositories::new().await?;
    repository.settings.get_view_item(id).await
        .map_err(|e| ServiceError::InternalError(format!("Repository error: {:?}", e)))
}

pub async fn get_all_view_items() -> Result<Vec<ViewItem>, ServiceError> {
    let repository = Repositories::new().await?;
    repository.settings.get_all_view_items().await
        .map_err(|e| ServiceError::InternalError(format!("Repository error: {:?}", e)))
}

pub async fn add_view_item(mut item: ViewItem) -> Result<ViewItem, ServiceError> {
    if item.id.is_empty() {
        item.id = Uuid::new_v4().to_string();
    }
    let repository = Repositories::new().await?;
    repository.settings.add_view_item(&item).await
        .map_err(|e| ServiceError::InternalError(format!("Repository error: {:?}", e)))?;
    Ok(item)
}

pub async fn update_view_item(item: ViewItem) -> Result<ViewItem, ServiceError> {
    let repository = Repositories::new().await?;
    repository.settings.update_view_item(&item).await
        .map_err(|e| ServiceError::InternalError(format!("Repository error: {:?}", e)))?;
    Ok(item)
}

pub async fn delete_view_item(id: &str) -> Result<(), ServiceError> {
    let repository = Repositories::new().await?;
    repository.settings.delete_view_item(id).await
        .map_err(|e| ServiceError::InternalError(format!("Repository error: {:?}", e)))
}
