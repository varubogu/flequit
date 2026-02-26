//! 設定関連のTauriコマンド
//!
//! このモジュールは設定関連コマンドを責務別サブモジュールに分割して公開します。

mod datetime_format_commands;
mod settings_file_commands;
mod time_label_commands;
mod view_item_commands;

pub use datetime_format_commands::*;
pub use settings_file_commands::*;
pub use time_label_commands::*;
pub use view_item_commands::*;

use crate::models::weekday_condition::WeekdayConditionCommandModel;
use crate::models::CommandModelConverter;
use crate::models::date_condition::DateConditionCommandModel;
use crate::state::AppState;
use chrono::{DateTime, Utc};
use flequit_core::facades::datetime_facades;
use flequit_model::models::ModelConverter;
use tauri::State;
use tracing::instrument;

// =============================================================================
// 日付条件・曜日条件関連コマンド
// =============================================================================

/// 日付条件を作成します。
#[allow(dead_code)]
#[instrument(level = "info", skip(state, condition))]
#[tauri::command]
pub async fn create_date_condition(
    state: State<'_, AppState>,
    condition: DateConditionCommandModel,
) -> Result<bool, String> {
    let model = condition.to_model().await?;
    let repositories = state.repositories.read().await;
    datetime_facades::create_date_condition(&*repositories, model).await
}

/// 日付条件を取得します。
#[allow(dead_code)]
#[instrument(level = "info", skip(state, condition_id))]
#[tauri::command]
pub async fn get_date_condition(
    state: State<'_, AppState>,
    condition_id: String,
) -> Result<Option<DateConditionCommandModel>, String> {
    let repositories = state.repositories.read().await;
    let result = datetime_facades::get_date_condition(&*repositories, condition_id).await?;
    match result {
        Some(data) => Ok(Some(data.to_command_model().await?)),
        None => Ok(None),
    }
}

/// すべての日付条件を取得します。
#[allow(dead_code)]
#[instrument(level = "info", skip(state))]
#[tauri::command]
pub async fn get_all_date_conditions(
    state: State<'_, AppState>,
) -> Result<Vec<DateConditionCommandModel>, String> {
    let repositories = state.repositories.read().await;
    let results = datetime_facades::get_all_date_conditions(&*repositories).await?;
    let mut command_results = Vec::new();
    for item in results {
        command_results.push(item.to_command_model().await?);
    }
    Ok(command_results)
}

/// 日付条件を更新します。
#[allow(dead_code)]
#[instrument(level = "info", skip(state, condition))]
#[tauri::command]
pub async fn update_date_condition(
    state: State<'_, AppState>,
    condition: DateConditionCommandModel,
) -> Result<bool, String> {
    let model = condition.to_model().await?;
    let repositories = state.repositories.read().await;
    datetime_facades::update_date_condition(&*repositories, model).await
}

/// 日付条件を削除します。
#[allow(dead_code)]
#[instrument(level = "info", skip(state, condition_id))]
#[tauri::command]
pub async fn delete_date_condition(
    state: State<'_, AppState>,
    condition_id: String,
) -> Result<bool, String> {
    let repositories = state.repositories.read().await;
    datetime_facades::delete_date_condition(&*repositories, condition_id).await
}

/// 日付条件を評価します。
#[allow(dead_code)]
#[instrument(level = "info", skip(state, condition_id, target_date))]
#[tauri::command]
pub async fn evaluate_date_condition(
    state: State<'_, AppState>,
    condition_id: String,
    target_date: DateTime<Utc>,
) -> Result<bool, String> {
    let repositories = state.repositories.read().await;
    datetime_facades::evaluate_date_condition(&*repositories, condition_id, target_date).await
}

/// 曜日条件を作成します。
#[allow(dead_code)]
#[instrument(level = "info", skip(state, condition))]
#[tauri::command]
pub async fn create_weekday_condition(
    state: State<'_, AppState>,
    condition: WeekdayConditionCommandModel,
) -> Result<bool, String> {
    let model = condition.to_model().await?;
    let repositories = state.repositories.read().await;
    datetime_facades::create_weekday_condition(&*repositories, model).await
}

/// 曜日条件を取得します。
#[allow(dead_code)]
#[instrument(level = "info", skip(state, condition_id))]
#[tauri::command]
pub async fn get_weekday_condition(
    state: State<'_, AppState>,
    condition_id: String,
) -> Result<Option<WeekdayConditionCommandModel>, String> {
    let repositories = state.repositories.read().await;
    let result = datetime_facades::get_weekday_condition(&*repositories, condition_id).await?;
    match result {
        Some(data) => Ok(Some(data.to_command_model().await?)),
        None => Ok(None),
    }
}

/// すべての曜日条件を取得します。
#[allow(dead_code)]
#[instrument(level = "info", skip(state))]
#[tauri::command]
pub async fn get_all_weekday_conditions(
    state: State<'_, AppState>,
) -> Result<Vec<WeekdayConditionCommandModel>, String> {
    let repositories = state.repositories.read().await;
    let results = datetime_facades::get_all_weekday_conditions(&*repositories).await?;
    let mut command_results = Vec::new();
    for item in results {
        command_results.push(item.to_command_model().await?);
    }
    Ok(command_results)
}

/// 曜日条件を更新します。
#[allow(dead_code)]
#[instrument(level = "info", skip(state, condition))]
#[tauri::command]
pub async fn update_weekday_condition(
    state: State<'_, AppState>,
    condition: WeekdayConditionCommandModel,
) -> Result<bool, String> {
    let model = condition.to_model().await?;
    let repositories = state.repositories.read().await;
    datetime_facades::update_weekday_condition(&*repositories, model).await
}

/// 曜日条件を削除します。
#[allow(dead_code)]
#[instrument(level = "info", skip(state, condition_id))]
#[tauri::command]
pub async fn delete_weekday_condition(
    state: State<'_, AppState>,
    condition_id: String,
) -> Result<bool, String> {
    let repositories = state.repositories.read().await;
    datetime_facades::delete_weekday_condition(&*repositories, condition_id).await
}

/// 曜日条件を評価します。
#[allow(dead_code)]
#[instrument(level = "info", skip(state, condition_id, target_date))]
#[tauri::command]
pub async fn evaluate_weekday_condition(
    state: State<'_, AppState>,
    condition_id: String,
    target_date: DateTime<Utc>,
) -> Result<bool, String> {
    let repositories = state.repositories.read().await;
    datetime_facades::evaluate_weekday_condition(&*repositories, condition_id, target_date).await
}

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
