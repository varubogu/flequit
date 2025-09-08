//! 設定関連のTauriコマンド
//! 
//! このモジュールは設定、日時フォーマット、個別モデルのTauriコマンドを統合して定義します。

use flequit_core::facades::{setting_facades};
use flequit_model::models::ModelConverter;
use crate::models::{
    // datetime::{
    //     DateTimeFormatCommandModel,
    //     DateConditionCommandModel, WeekdayConditionCommandModel // 一時的にコメントアウト
    // },
    datetime_format::CustomDateFormatCommandModel,
    settings::SettingsCommandModel,
    time_label::TimeLabelCommandModel,
    view_item::ViewItemCommandModel,
};
use crate::models::CommandModelConverter;
// use chrono::{DateTime, Utc}; // 一時的にコメントアウト

// ---------------------------
// Settings (全体設定)
// ---------------------------

/// アプリケーション設定（Settings）をすべて取得します。
#[tracing::instrument]
#[tauri::command]
pub async fn get_all_settings() -> Result<SettingsCommandModel, String> {
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

// NOTE: Custom Date Format機能は一時的に無効化されています
// setting_facades::get_custom_date_formatが実装されていないため
/// 指定されたIDのカスタム日付フォーマットを取得します。
#[tracing::instrument]
#[tauri::command]
pub async fn get_custom_date_format_setting(
    id: String,
) -> Result<Option<CustomDateFormatCommandModel>, String> {
    // TODO: setting_facadesでの実装完了後に有効化
    let _ = id; // 未使用警告を回避
    Ok(None)
}

/// すべてのカスタム日付フォーマットを取得します。
#[tracing::instrument]
#[tauri::command]
pub async fn get_all_custom_date_format_settings() -> Result<Vec<CustomDateFormatCommandModel>, String> {
    // TODO: setting_facadesでの実装完了後に有効化
    Ok(Vec::new())
}

/// カスタム日付フォーマットを追加します。
#[tracing::instrument]
#[tauri::command]
pub async fn add_custom_date_format_setting(
    format: CustomDateFormatCommandModel,
) -> Result<CustomDateFormatCommandModel, String> {
    // TODO: setting_facadesでの実装完了後に有効化
    Ok(format)
}

/// カスタム日付フォーマットを更新します。
#[tracing::instrument]
#[tauri::command]
pub async fn update_custom_date_format_setting(
    format: CustomDateFormatCommandModel,
) -> Result<CustomDateFormatCommandModel, String> {
    // TODO: setting_facadesでの実装完了後に有効化
    Ok(format)
}

/// カスタム日付フォーマットを削除します。
#[tracing::instrument]
#[tauri::command]
pub async fn delete_custom_date_format_setting(id: String) -> Result<(), String> {
    // TODO: setting_facadesでの実装完了後に有効化
    let _ = id; // 未使用警告を回避
    Ok(())
}

// ---------------------------
// Time Labels
// ---------------------------

/// 指定されたIDの時刻ラベルを取得します。
#[tracing::instrument]
#[tauri::command]
pub async fn get_time_label_setting(id: String) -> Result<Option<TimeLabelCommandModel>, String> {
    let result = setting_facades::get_time_label(&id).await?;
    match result {
        Some(data) => Ok(Some(data.to_command_model().await?)),
        None => Ok(None),
    }
}

/// すべての時刻ラベルを取得します。
#[tracing::instrument]
#[tauri::command]
pub async fn get_all_time_label_settings() -> Result<Vec<TimeLabelCommandModel>, String> {
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
pub async fn add_time_label_setting(label: TimeLabelCommandModel) -> Result<TimeLabelCommandModel, String> {
    let model = label.to_model().await?;
    let result = setting_facades::add_time_label(model).await?;
    Ok(result.to_command_model().await?)
}

/// 時刻ラベルを更新します。
#[tracing::instrument]
#[tauri::command]
pub async fn update_time_label_setting(
    label: TimeLabelCommandModel,
) -> Result<TimeLabelCommandModel, String> {
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
pub async fn get_view_item_setting(id: String) -> Result<Option<ViewItemCommandModel>, String> {
    let result = setting_facades::get_view_item(&id).await?;
    match result {
        Some(data) => Ok(Some(data.to_command_model().await?)),
        None => Ok(None),
    }
}

/// すべてのビューアイテムを取得します。
#[tracing::instrument]
#[tauri::command]
pub async fn get_all_view_item_settings() -> Result<Vec<ViewItemCommandModel>, String> {
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
pub async fn add_view_item_setting(item: ViewItemCommandModel) -> Result<ViewItemCommandModel, String> {
    let model = item.to_model().await?;
    let result = setting_facades::add_view_item(model).await?;
    Ok(result.to_command_model().await?)
}

/// ビューアイテムを更新します。
#[tracing::instrument]
#[tauri::command]
pub async fn update_view_item_setting(item: ViewItemCommandModel) -> Result<ViewItemCommandModel, String> {
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

// =============================================================================
// 日時フォーマット関連コマンド（型変換メソッド未実装のため一時的にコメントアウト）
// =============================================================================

// NOTE: DateTimeFormatに対する型変換メソッド（to_model/to_command_model）が
// 未実装のため、これらの関数は一時的にコメントアウトしています。
// 必要に応じて型変換メソッドの実装後に有効化してください。

/*
/// 日時フォーマットを作成します。
#[tracing::instrument]
#[tauri::command]
pub async fn create_datetime_format(format: DateTimeFormatCommandModel) -> Result<bool, String> {
    let model = format.to_model().await?;
    datetime_facades::create_datetime_format(model).await
}

/// 日時フォーマットを取得します。
#[tracing::instrument]
#[tauri::command]
pub async fn get_datetime_format(format_id: String) -> Result<Option<DateTimeFormatCommandModel>, String> {
    let result = datetime_facades::get_datetime_format(format_id).await?;
    match result {
        Some(data) => Ok(Some(data.to_command_model().await?)),
        None => Ok(None),
    }
}

/// すべての日時フォーマットを取得します。
#[tracing::instrument]
#[tauri::command]
pub async fn get_all_datetime_formats() -> Result<Vec<DateTimeFormatCommandModel>, String> {
    let results = datetime_facades::get_all_datetime_formats().await?;
    let mut command_results = Vec::new();
    for item in results {
        command_results.push(item.to_command_model().await?);
    }
    Ok(command_results)
}

/// 日時フォーマットを更新します。
#[tracing::instrument]
#[tauri::command]
pub async fn update_datetime_format(format: DateTimeFormatCommandModel) -> Result<bool, String> {
    let model = format.to_model().await?;
    datetime_facades::update_datetime_format(model).await
}

/// 日時フォーマットを削除します。
#[tracing::instrument]
#[tauri::command]
pub async fn delete_datetime_format(format_id: String) -> Result<bool, String> {
    datetime_facades::delete_datetime_format(format_id).await
}
*/

// =============================================================================
// 日付条件・曜日条件関連コマンド（型変換メソッド未実装のため一時的にコメントアウト）
// =============================================================================

// NOTE: DateConditionとWeekdayConditionに対する型変換メソッド（to_model/to_command_model）が
// 未実装のため、これらの関数は一時的にコメントアウトしています。
// 必要に応じて型変換メソッドの実装後に有効化してください。

/*
/// 日付条件を作成します。
#[tracing::instrument]
#[tauri::command]
pub async fn create_date_condition(condition: DateConditionCommandModel) -> Result<bool, String> {
    let model = condition.to_model().await?;
    datetime_facades::create_date_condition(model).await
}

/// 日付条件を取得します。
#[tracing::instrument]
#[tauri::command]
pub async fn get_date_condition(condition_id: String) -> Result<Option<DateConditionCommandModel>, String> {
    let result = datetime_facades::get_date_condition(condition_id).await?;
    match result {
        Some(data) => Ok(Some(data.to_command_model().await?)),
        None => Ok(None),
    }
}

/// すべての日付条件を取得します。
#[tracing::instrument]
#[tauri::command]
pub async fn get_all_date_conditions() -> Result<Vec<DateConditionCommandModel>, String> {
    let results = datetime_facades::get_all_date_conditions().await?;
    let mut command_results = Vec::new();
    for item in results {
        command_results.push(item.to_command_model().await?);
    }
    Ok(command_results)
}

/// 日付条件を更新します。
#[tracing::instrument]
#[tauri::command]
pub async fn update_date_condition(condition: DateConditionCommandModel) -> Result<bool, String> {
    let model = condition.to_model().await?;
    datetime_facades::update_date_condition(model).await
}

/// 日付条件を削除します。
#[tracing::instrument]
#[tauri::command]
pub async fn delete_date_condition(condition_id: String) -> Result<bool, String> {
    datetime_facades::delete_date_condition(condition_id).await
}

/// 日付条件を評価します。
#[tracing::instrument]
#[tauri::command]
pub async fn evaluate_date_condition(condition_id: String, target_date: DateTime<Utc>) -> Result<bool, String> {
    datetime_facades::evaluate_date_condition(condition_id, target_date).await
}

/// 曜日条件を作成します。
#[tracing::instrument]
#[tauri::command]
pub async fn create_weekday_condition(condition: WeekdayConditionCommandModel) -> Result<bool, String> {
    let model = condition.to_model().await?;
    datetime_facades::create_weekday_condition(model).await
}

/// 曜日条件を取得します。
#[tracing::instrument]
#[tauri::command]
pub async fn get_weekday_condition(condition_id: String) -> Result<Option<WeekdayConditionCommandModel>, String> {
    let result = datetime_facades::get_weekday_condition(condition_id).await?;
    match result {
        Some(data) => Ok(Some(data.to_command_model().await?)),
        None => Ok(None),
    }
}

/// すべての曜日条件を取得します。
#[tracing::instrument]
#[tauri::command]
pub async fn get_all_weekday_conditions() -> Result<Vec<WeekdayConditionCommandModel>, String> {
    let results = datetime_facades::get_all_weekday_conditions().await?;
    let mut command_results = Vec::new();
    for item in results {
        command_results.push(item.to_command_model().await?);
    }
    Ok(command_results)
}

/// 曜日条件を更新します。
#[tracing::instrument]
#[tauri::command]
pub async fn update_weekday_condition(condition: WeekdayConditionCommandModel) -> Result<bool, String> {
    let model = condition.to_model().await?;
    datetime_facades::update_weekday_condition(model).await
}

/// 曜日条件を削除します。
#[tracing::instrument]
#[tauri::command]
pub async fn delete_weekday_condition(condition_id: String) -> Result<bool, String> {
    datetime_facades::delete_weekday_condition(condition_id).await
}

/// 曜日条件を評価します。
#[tracing::instrument]
#[tauri::command]
pub async fn evaluate_weekday_condition(condition_id: String, target_date: DateTime<Utc>) -> Result<bool, String> {
    datetime_facades::evaluate_weekday_condition(condition_id, target_date).await
}
*/

// =============================================================================
// 注意事項: individual_commands.rsの関数について
// =============================================================================
// individual_facades モジュールが存在しないため、以下の関数群は統合を保留しています:
// - アプリプリセットフォーマット関連 (AppPresetFormat)
// - 期日ボタン設定関連 (DueDateButtons) 
// - ローカル設定関連 (LocalSettings)
// - メンバー関連 (Member)
// - 検索関連 (Search)
// - 設定レスポンス関連 (SettingResponse)
//
// これらの機能が必要な場合は、対応するfacadeを実装してから統合してください。