//! 設定関連のTauriコマンド
use flequit_core::facades::setting_facades;
use flequit_model::models::ModelConverter;
use crate::models::setting::{
    CustomDateFormatCommand, SettingsCommand, TimeLabelCommand, ViewItemCommand,
};
use crate::models::CommandModelConverter;

// ---------------------------
// Settings (全体設定)
// ---------------------------

/// アプリケーション設定（Settings）をすべて取得します。
#[tracing::instrument]
#[tauri::command]
pub async fn get_all_settings() -> Result<SettingsCommand, String> {
    let result = setting_facades::get_all_settings().await?;
    Ok(result.to_command_model().await?)
}

/// 特定のキーの設定値を保存します。
#[tracing::instrument]
#[tauri::command]
pub async fn set_setting(key: String, value: serde_json::Value) -> Result<(), String> {
    setting_facades::set_setting(&key, value).await
}

// ---------------------------
// Custom Date Formats
// ---------------------------

/// 指定されたIDのカスタム日付フォーマットを取得します。
#[tracing::instrument]
#[tauri::command]
pub async fn get_custom_date_format_setting(
    id: String,
) -> Result<Option<CustomDateFormatCommand>, String> {
    let result = setting_facades::get_custom_date_format(&id).await?;
    match result {
        Some(data) => Ok(Some(data.to_command_model().await?)),
        None => Ok(None),
    }
}

/// すべてのカスタム日付フォーマットを取得します。
#[tracing::instrument]
#[tauri::command]
pub async fn get_all_custom_date_format_settings() -> Result<Vec<CustomDateFormatCommand>, String> {
    let results = setting_facades::get_all_custom_date_formats().await?;
    let mut command_results = Vec::new();
    for item in results {
        command_results.push(item.to_command_model().await?);
    }
    Ok(command_results)
}

/// カスタム日付フォーマットを追加します。
#[tracing::instrument]
#[tauri::command]
pub async fn add_custom_date_format_setting(
    format: CustomDateFormatCommand,
) -> Result<CustomDateFormatCommand, String> {
    let model = format.to_model().await?;
    let result = setting_facades::add_custom_date_format(model).await?;
    Ok(result.to_command_model().await?)
}

/// カスタム日付フォーマットを更新します。
#[tracing::instrument]
#[tauri::command]
pub async fn update_custom_date_format_setting(
    format: CustomDateFormatCommand,
) -> Result<CustomDateFormatCommand, String> {
    let model = format.to_model().await?;
    let result = setting_facades::update_custom_date_format(model).await?;
    Ok(result.to_command_model().await?)
}

/// カスタム日付フォーマットを削除します。
#[tracing::instrument]
#[tauri::command]
pub async fn delete_custom_date_format_setting(id: String) -> Result<(), String> {
    setting_facades::delete_custom_date_format(&id).await
}

// ---------------------------
// Time Labels
// ---------------------------

/// 指定されたIDの時刻ラベルを取得します。
#[tracing::instrument]
#[tauri::command]
pub async fn get_time_label_setting(id: String) -> Result<Option<TimeLabelCommand>, String> {
    let result = setting_facades::get_time_label(&id).await?;
    match result {
        Some(data) => Ok(Some(data.to_command_model().await?)),
        None => Ok(None),
    }
}

/// すべての時刻ラベルを取得します。
#[tracing::instrument]
#[tauri::command]
pub async fn get_all_time_label_settings() -> Result<Vec<TimeLabelCommand>, String> {
    let results = setting_facades::get_all_time_labels().await?;
    let mut command_results = Vec::new();
    for item in results {
        command_results.push(item.to_command_model().await?);
    }
    Ok(command_results)
}

/// 時刻ラベルを追加します。
#[tracing::instrument]
#[tauri::command]
pub async fn add_time_label_setting(label: TimeLabelCommand) -> Result<TimeLabelCommand, String> {
    let model = label.to_model().await?;
    let result = setting_facades::add_time_label(model).await?;
    Ok(result.to_command_model().await?)
}

/// 時刻ラベルを更新します。
#[tracing::instrument]
#[tauri::command]
pub async fn update_time_label_setting(
    label: TimeLabelCommand,
) -> Result<TimeLabelCommand, String> {
    let model = label.to_model().await?;
    let result = setting_facades::update_time_label(model).await?;
    Ok(result.to_command_model().await?)
}

/// 時刻ラベルを削除します。
#[tracing::instrument]
#[tauri::command]
pub async fn delete_time_label_setting(id: String) -> Result<(), String> {
    setting_facades::delete_time_label(&id).await
}

// ---------------------------
// View Items
// ---------------------------

/// 指定されたIDのビューアイテムを取得します。
#[tracing::instrument]
#[tauri::command]
pub async fn get_view_item_setting(id: String) -> Result<Option<ViewItemCommand>, String> {
    let result = setting_facades::get_view_item(&id).await?;
    match result {
        Some(data) => Ok(Some(data.to_command_model().await?)),
        None => Ok(None),
    }
}

/// すべてのビューアイテムを取得します。
#[tracing::instrument]
#[tauri::command]
pub async fn get_all_view_item_settings() -> Result<Vec<ViewItemCommand>, String> {
    let results = setting_facades::get_all_view_items().await?;
    let mut command_results = Vec::new();
    for item in results {
        command_results.push(item.to_command_model().await?);
    }
    Ok(command_results)
}

/// ビューアイテムを追加します。
#[tracing::instrument]
#[tauri::command]
pub async fn add_view_item_setting(item: ViewItemCommand) -> Result<ViewItemCommand, String> {
    let model = item.to_model().await?;
    let result = setting_facades::add_view_item(model).await?;
    Ok(result.to_command_model().await?)
}

/// ビューアイテムを更新します。
#[tracing::instrument]
#[tauri::command]
pub async fn update_view_item_setting(item: ViewItemCommand) -> Result<ViewItemCommand, String> {
    let model = item.to_model().await?;
    let result = setting_facades::update_view_item(model).await?;
    Ok(result.to_command_model().await?)
}

/// ビューアイテムを削除します。
#[tracing::instrument]
#[tauri::command]
pub async fn delete_view_item_setting(id: String) -> Result<(), String> {
    setting_facades::delete_view_item(&id).await
}

/// 特定のキーの設定値を取得します。
#[tracing::instrument]
#[tauri::command]
pub async fn get_setting(key: String) -> Result<Option<String>, String> {
    setting_facades::get_setting(&key).await
}

/// 特定のキーの設定値を更新します。
#[tracing::instrument]
#[tauri::command]
pub async fn update_setting(key: String, value: serde_json::Value) -> Result<(), String> {
    setting_facades::set_setting(&key, value).await
}
