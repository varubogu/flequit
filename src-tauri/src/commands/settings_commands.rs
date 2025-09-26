//! 設定関連のTauriコマンド
//!
//! このモジュールは設定、日時フォーマット、個別モデルのTauriコマンドを統合して定義します。

use crate::models::weekday_condition::WeekdayConditionCommandModel;
use crate::models::CommandModelConverter;
use crate::models::{
    date_condition::DateConditionCommandModel, datetime_format::DateTimeFormatCommandModel,
    settings::{SettingsCommandModel, PartialSettingsCommandModel}, time_label::TimeLabelCommandModel,
    view_item::ViewItemCommandModel,
};
use crate::state::AppState;
use chrono::{DateTime, Utc};
use flequit_core::facades::datetime_facades;
use flequit_model::models::ModelConverter;
use flequit_settings::{Settings, PartialSettings};
use tauri::State;
use tracing::instrument;

// ---------------------------
// Settings Commands (flequit-settings crate)
// ---------------------------

/// 新しい設定管理APIで設定を読み込み
///
/// stateから設定を取得します。

#[instrument(level = "info", skip(state))]
#[tauri::command]
pub async fn load_settings(state: State<'_, AppState>) -> Result<SettingsCommandModel, String> {
    let settings = state.settings.read().await.clone();
    Ok(SettingsCommandModel::from(
        settings.to_command_model().await?,
    ))
}

/// 新しい設定管理APIで設定を保存

#[instrument(level = "info", skip(state))]
#[tauri::command]
pub async fn save_settings(
    state: State<'_, AppState>,
    settings: SettingsCommandModel,
) -> Result<(), String> {
    let settings_model = settings.to_model().await?;

    // stateの設定を更新
    {
        let mut state_settings = state.settings.write().await;
        *state_settings = settings_model.clone();
    }

    // ファイルにも保存
    state
        .settings_manager
        .save_settings(&settings_model)
        .await
        .map_err(|e| {
            tracing::error!(target: "commands::settings", command = "save_settings", error = %e);
            format!("設定の保存に失敗: {}", e)
        })?;

    Ok(())
}

/// 設定ファイルが存在するかチェック

#[instrument(level = "info", skip(state))]
#[tauri::command]
pub async fn settings_file_exists(state: State<'_, AppState>) -> Result<bool, String> {
    Ok(state.settings_manager.settings_exists())
}

/// 部分的な設定更新（差分更新）
///
/// PartialSettingsを使って必要な設定のみを更新します。
#[instrument(level = "info", skip(state))]
#[tauri::command]
pub async fn update_settings_partially(
    state: State<'_, AppState>,
    partial_settings: PartialSettingsCommandModel,
) -> Result<SettingsCommandModel, String> {
    let partial_model = partial_settings.to_model().await.map_err(|e| e.to_string())?;

    // 設定管理サービスで差分更新を実行
    let updated_settings = state
        .settings_manager
        .update_settings_partially(&partial_model)
        .await
        .map_err(|e| {
            tracing::error!(target: "commands::settings", command = "update_settings_partially", error = %e);
            format!("部分的な設定更新に失敗: {}", e)
        })?;

    // stateの設定も更新
    {
        let mut state_settings = state.settings.write().await;
        *state_settings = updated_settings.clone();
    }

    // 更新された設定をコマンドモデルとして返す
    Ok(SettingsCommandModel::from(updated_settings.to_command_model().await.map_err(|e| e.to_string())?))
}

/// デフォルト設定で設定ファイルを初期化

#[instrument(level = "info", skip(state))]
#[tauri::command]
pub async fn initialize_settings_with_defaults(state: State<'_, AppState>) -> Result<(), String> {
    state
        .settings_manager
        .initialize_with_defaults()
        .await
        .map_err(|e| {
            tracing::error!(target: "commands::settings", command = "initialize_settings_with_defaults", error = %e);
            format!("設定の初期化に失敗: {}", e)
        })?;

    // stateの設定もデフォルトにリセット
    {
        let mut state_settings = state.settings.write().await;
        *state_settings = Settings::default();
    }

    Ok(())
}

/// 設定ファイルのパスを取得

#[instrument(level = "info", skip(state))]
#[tauri::command]
pub async fn get_settings_file_path(state: State<'_, AppState>) -> Result<String, String> {
    Ok(state
        .settings_manager
        .get_settings_path()
        .display()
        .to_string())
}

// ---------------------------
// Legacy Settings (flequit-core facades)
// ---------------------------

/// アプリケーション設定（Settings）をすべて取得します。

#[instrument(level = "info", skip(state))]
#[tauri::command]
pub async fn get_all_settings(state: State<'_, AppState>) -> Result<SettingsCommandModel, String> {
    let settings = state.settings.read().await;
    settings.to_command_model().await.map_err(|e| {
        tracing::error!(target: "commands::settings", command = "get_all_settings", error = %e);
        e.to_string()
    })
}

/// 特定のキーの設定値を保存します。

#[tauri::command]
pub async fn set_setting(
    state: State<'_, AppState>,
    key: String,
    value: serde_json::Value,
) -> Result<(), String> {
    let _repositories = state.repositories.read().await;

    // TODO: setting_facadesの実装完了後に有効化
    // setting_facades::set_setting(&*repositories, &key, value).await
    let _ = (key, value); // 未使用警告を回避
    Ok(())
}

// ---------------------------
// Date Formats
// ---------------------------

// NOTE: Custom Date Format機能は一時的に無効化されています
// setting_facades::get_custom_date_formatが実装されていないため
/// 指定されたIDのカスタム日付フォーマットを取得します。

#[instrument(level = "info", skip(_state))]
#[tauri::command]
pub async fn get_custom_date_format_setting(
    _state: State<'_, AppState>,
    id: String,
) -> Result<Option<DateTimeFormatCommandModel>, String> {
    // TODO: setting_facadesでの実装完了後に有効化
    let _ = id; // 未使用警告を回避
    Ok(None)
}

/// すべてのカスタム日付フォーマットを取得します。

#[instrument(level = "info", skip(_state))]
#[tauri::command]
pub async fn get_all_custom_date_format_settings(
    _state: State<'_, AppState>,
) -> Result<Vec<DateTimeFormatCommandModel>, String>
{
    // TODO: setting_facadesでの実装完了後に有効化
    Ok(Vec::new())
}

/// カスタム日付フォーマットを追加します。

#[instrument(level = "info", skip(_state))]
#[tauri::command]
pub async fn add_custom_date_format_setting(
    _state: State<'_, AppState>,
    format: DateTimeFormatCommandModel,
) -> Result<DateTimeFormatCommandModel, String> {
    // TODO: setting_facadesでの実装完了後に有効化
    Ok(format)
}

/// カスタム日付フォーマットを更新します。

#[instrument(level = "info", skip(_state))]
#[tauri::command]
pub async fn update_custom_date_format_setting(
    _state: State<'_, AppState>,
    format: DateTimeFormatCommandModel,
) -> Result<DateTimeFormatCommandModel, String> {
    // TODO: datetime_facadesでの実装完了後に有効化
    // datetime_facades::update_datetime_format(&*repositories, model).await
    Ok(format)
}

/// カスタム日付フォーマットを削除します。

#[instrument(level = "info", skip(_state))]
#[tauri::command]
pub async fn delete_custom_date_format_setting(
    _state: State<'_, AppState>,
    id: String,
) -> Result<(), String> {
    // TODO: datetime_facadesでの実装完了後に有効化
    // datetime_facades::delete_datetime_format(&*repositories, format_id).await
    let _ = id; // 未使用警告を回避
    Ok(())
}

// ---------------------------
// Time Labels
// ---------------------------

/// 指定されたIDの時刻ラベルを取得します。

#[instrument(level = "info", skip(state))]
#[tauri::command]
pub async fn get_time_label_setting(
    state: State<'_, AppState>,
    id: String,
) -> Result<Option<TimeLabelCommandModel>, String> {
    let settings = state.settings.read().await;

    // 設定から時刻ラベルを検索
    let time_label = settings.time_labels.iter().find(|label| label.id == id);

    match time_label {
        Some(label) => {
            // flequit-settingsのTimeLabelをCommandModelに変換
            Ok(Some(TimeLabelCommandModel {
                id: label.id.clone(),
                name: label.name.clone(),
                time: label.time.clone(),
                color: label.color.clone(),
                order: label.order,
            }))
        }
        None => Ok(None),
    }
}

/// すべての時刻ラベルを取得します。

#[instrument(level = "info", skip(state))]
#[tauri::command]
pub async fn get_all_time_label_settings(
    state: State<'_, AppState>,
) -> Result<Vec<TimeLabelCommandModel>, String> {
    let settings = state.settings.read().await;

    let mut command_results = Vec::new();
    for label in &settings.time_labels {
        command_results.push(TimeLabelCommandModel {
            id: label.id.clone(),
            name: label.name.clone(),
            time: label.time.clone(),
            color: label.color.clone(),
            order: label.order,
        });
    }
    Ok(command_results)
}

/// 時刻ラベルを追加します。

#[instrument(level = "info", skip(state))]
#[tauri::command]
pub async fn add_time_label_setting(
    state: State<'_, AppState>,
    label: TimeLabelCommandModel,
) -> Result<TimeLabelCommandModel, String> {
    // flequit-settingsのTimeLabelに変換
    let time_label = flequit_settings::TimeLabel {
        id: label.id.clone(),
        name: label.name.clone(),
        time: label.time.clone(),
        color: label.color.clone(),
        order: label.order,
    };

    // stateの設定を更新
    {
        let mut settings = state.settings.write().await;
        settings.time_labels.push(time_label.clone());

        // ファイルにも保存
    state
            .settings_manager
            .save_settings(&*settings)
            .await
            .map_err(|e| {
                tracing::error!(target: "commands::settings", command = "add_time_label_setting", error = %e);
                e.to_string()
            })?;
    }

    Ok(label)
}

/// 時刻ラベルを更新します。

#[instrument(level = "info", skip(state))]
#[tauri::command]
pub async fn update_time_label_setting(
    state: State<'_, AppState>,
    label: TimeLabelCommandModel,
) -> Result<TimeLabelCommandModel, String> {
    // flequit-settingsのTimeLabelに変換
    let time_label = flequit_settings::TimeLabel {
        id: label.id.clone(),
        name: label.name.clone(),
        time: label.time.clone(),
        color: label.color.clone(),
        order: label.order,
    };

    // stateの設定を更新
    {
        let mut settings = state.settings.write().await;

        // 既存の時刻ラベルを検索して更新
        if let Some(existing_label) = settings.time_labels.iter_mut().find(|l| l.id == label.id) {
            *existing_label = time_label.clone();
        } else {
            // 見つからない場合は追加
            settings.time_labels.push(time_label.clone());
        }

        // ファイルにも保存
        state
            .settings_manager
            .save_settings(&*settings)
            .await
            .map_err(|e| {
                tracing::error!(target: "commands::settings", command = "update_time_label_setting", error = %e);
                e.to_string()
            })?;
    }

    Ok(label)
}

/// 時刻ラベルを削除します。

#[instrument(level = "info", skip(state))]
#[tauri::command]
pub async fn delete_time_label_setting(
    state: State<'_, AppState>,
    id: String,
) -> Result<(), String> {
    // stateの設定を更新
    {
        let mut settings = state.settings.write().await;

        // 指定されたIDの時刻ラベルを削除
        settings.time_labels.retain(|label| label.id != id);

        // ファイルにも保存
        state
            .settings_manager
            .save_settings(&*settings)
            .await
            .map_err(|e| {
                tracing::error!(target: "commands::settings", command = "delete_time_label_setting", error = %e);
                e.to_string()
            })?;
    }

    Ok(())
}

// ---------------------------
// View Items
// ---------------------------

/// 指定されたIDのビューアイテムを取得します。

#[instrument(level = "info", skip(state))]
#[tauri::command]
pub async fn get_view_item_setting(
    state: State<'_, AppState>,
    id: String,
) -> Result<Option<ViewItemCommandModel>, String> {
    let settings = state.settings.read().await;

    // 設定からビューアイテムを検索
    let view_item = settings.view_items.iter().find(|item| item.id == id);

    match view_item {
        Some(item) => {
            // flequit-settingsのViewItemをCommandModelに変換
            Ok(Some(ViewItemCommandModel {
                id: item.id.clone(),
                label: item.label.clone(),
                icon: item.icon.clone(),
                visible: item.visible,
                order: item.order,
            }))
        }
        None => Ok(None),
    }
}

/// すべてのビューアイテムを取得します。

#[instrument(level = "info", skip(state))]
#[tauri::command]
pub async fn get_all_view_item_settings(
    state: State<'_, AppState>,
) -> Result<Vec<ViewItemCommandModel>, String> {
    let settings = state.settings.read().await;

    let mut command_results = Vec::new();
    for item in &settings.view_items {
        command_results.push(ViewItemCommandModel {
            id: item.id.clone(),
            label: item.label.clone(),
            icon: item.icon.clone(),
            visible: item.visible,
            order: item.order,
        });
    }
    Ok(command_results)
}

/// ビューアイテムを追加します。

#[instrument(level = "info", skip(state))]
#[tauri::command]
pub async fn add_view_item_setting(
    state: State<'_, AppState>,
    item: ViewItemCommandModel,
) -> Result<ViewItemCommandModel, String> {
    // flequit-settingsのViewItemに変換
    let view_item = flequit_settings::ViewItem {
        id: item.id.clone(),
        label: item.label.clone(),
        icon: item.icon.clone(),
        visible: item.visible,
        order: item.order,
    };

    // stateの設定を更新
    {
        let mut settings = state.settings.write().await;
        settings.view_items.push(view_item.clone());

        // ファイルにも保存
        state
            .settings_manager
            .save_settings(&*settings)
            .await
            .map_err(|e| e.to_string())?;
    }

    Ok(item)
}

/// ビューアイテムを更新します。

#[instrument(level = "info", skip(state))]
#[tauri::command]
pub async fn update_view_item_setting(
    state: State<'_, AppState>,
    item: ViewItemCommandModel,
) -> Result<ViewItemCommandModel, String> {
    // flequit-settingsのViewItemに変換
    let view_item = flequit_settings::ViewItem {
        id: item.id.clone(),
        label: item.label.clone(),
        icon: item.icon.clone(),
        visible: item.visible,
        order: item.order,
    };

    // stateの設定を更新
    {
        let mut settings = state.settings.write().await;

        // 既存のビューアイテムを検索して更新
        if let Some(existing_item) = settings.view_items.iter_mut().find(|i| i.id == item.id) {
            *existing_item = view_item.clone();
        } else {
            // 見つからない場合は追加
            settings.view_items.push(view_item.clone());
        }

        // ファイルにも保存
        state
            .settings_manager
            .save_settings(&*settings)
            .await
            .map_err(|e| e.to_string())?;
    }

    Ok(item)
}

/// ビューアイテムを削除します。

#[instrument(level = "info", skip(state))]
#[tauri::command]
pub async fn delete_view_item_setting(
    state: State<'_, AppState>,
    id: String,
) -> Result<(), String> {
    // stateの設定を更新
    {
        let mut settings = state.settings.write().await;

        // 指定されたIDのビューアイテムを削除
        settings.view_items.retain(|item| item.id != id);

        // ファイルにも保存
        state
            .settings_manager
            .save_settings(&*settings)
            .await
            .map_err(|e| e.to_string())?;
    }

    Ok(())
}

/// 特定のキーの設定値を取得します。

#[instrument(level = "info", skip(state))]
#[tauri::command]
pub async fn get_setting(
    state: State<'_, AppState>,
    key: String,
) -> Result<Option<String>, String> {
    let settings = state.settings.read().await;

    // 基本的な設定値を取得
    match key.as_str() {
        "theme" => Ok(Some(settings.theme.clone())),
        "language" => Ok(Some(settings.language.clone())),
        "font" => Ok(Some(settings.font.clone())),
        "font_size" => Ok(Some(settings.font_size.to_string())),
        "font_color" => Ok(Some(settings.font_color.clone())),
        "background_color" => Ok(Some(settings.background_color.clone())),
        "week_start" => Ok(Some(settings.week_start.clone())),
        "timezone" => Ok(Some(settings.timezone.clone())),
        // 選択中の日時フォーマット（スカラー扱い）
        "datetime_format" => Ok(Some(settings.datetime_format.format.clone())),
        "custom_due_days" => Ok(Some(
            serde_json::to_string(&settings.custom_due_days).unwrap_or_default(),
        )),
        _ => Ok(None),
    }
}

/// 特定のキーの設定値を更新します。

#[instrument(level = "info", skip(state, value))]
#[tauri::command]
pub async fn update_setting(
    state: State<'_, AppState>,
    key: String,
    value: serde_json::Value,
) -> Result<(), String> {
    // PartialSettingsを作成して差分更新を使用
    let mut partial = PartialSettings::default();

    // キーに応じて適切なフィールドを設定
    match key.as_str() {
        "theme" => {
            if let Some(v) = value.as_str() {
                partial.theme = Some(v.to_string());
            }
        }
        "language" => {
            if let Some(v) = value.as_str() {
                partial.language = Some(v.to_string());
            }
        }
        "font" => {
            if let Some(v) = value.as_str() {
                partial.font = Some(v.to_string());
            }
        }
        "font_size" => {
            if let Some(v) = value.as_i64() {
                partial.font_size = Some(v as i32);
            }
        }
        "font_color" => {
            if let Some(v) = value.as_str() {
                partial.font_color = Some(v.to_string());
            }
        }
        "background_color" => {
            if let Some(v) = value.as_str() {
                partial.background_color = Some(v.to_string());
            }
        }
        "week_start" => {
            if let Some(v) = value.as_str() {
                partial.week_start = Some(v.to_string());
            }
        }
        "timezone" => {
            if let Some(v) = value.as_str() {
                partial.timezone = Some(v.to_string());
            }
        }
        "custom_due_days" => {
            if let Ok(v) = serde_json::from_value::<Vec<i32>>(value) {
                partial.custom_due_days = Some(v);
            }
        }
        _ => {
            return Err(format!("Unknown setting key: {}", key));
        }
    }

    // 設定管理サービスで差分更新を実行
    let updated_settings = state
        .settings_manager
        .update_settings_partially(&partial)
        .await
        .map_err(|e| {
            tracing::error!(target: "commands::settings", command = "update_setting", key = %key, error = %e);
            format!("設定の更新に失敗: {}", e)
        })?;

    // stateの設定も更新
    {
        let mut state_settings = state.settings.write().await;
        *state_settings = updated_settings;
    }

    Ok(())
}

// =============================================================================
// 日時フォーマット関連コマンド
// =============================================================================

/// 日時フォーマットを作成します。
#[allow(dead_code)]

#[instrument(level = "info", skip(state, format))]
#[tauri::command]
pub async fn create_datetime_format(
    state: State<'_, AppState>,
    format: DateTimeFormatCommandModel,
) -> Result<bool, String> {
    let _ = (state, format);
    Err("Not implemented: datetime_facades::create_datetime_format".to_string())
}

/// 日時フォーマットを取得します。
#[allow(dead_code)]

#[instrument(level = "info", skip(state))]
#[tauri::command]
pub async fn get_datetime_format(
    state: State<'_, AppState>,
    format_id: String,
) -> Result<Option<DateTimeFormatCommandModel>, String> {
    let _ = (state, format_id);
    Err("Not implemented: datetime_facades::get_datetime_format".to_string())
}

/// すべての日時フォーマットを取得します。
#[allow(dead_code)]

#[instrument(level = "info", skip(state))]
#[tauri::command]
pub async fn get_all_datetime_formats(
    state: State<'_, AppState>,
) -> Result<Vec<DateTimeFormatCommandModel>, String> {
    let _ = state;
    Err("Not implemented: datetime_facades::get_all_datetime_formats".to_string())
}

/// 日時フォーマットを更新します。
#[allow(dead_code)]

#[instrument(level = "info", skip(state, format))]
#[tauri::command]
pub async fn update_datetime_format(
    state: State<'_, AppState>,
    format: DateTimeFormatCommandModel,
) -> Result<bool, String> {
    let _ = (state, format);
    Err("Not implemented: datetime_facades::update_datetime_format".to_string())
}

/// 日時フォーマットを削除します。
#[allow(dead_code)]

#[instrument(level = "info", skip(state, format_id))]
#[tauri::command]
pub async fn delete_datetime_format(
    state: State<'_, AppState>,
    format_id: String,
) -> Result<bool, String> {
    let _ = (state, format_id);
    Err("Not implemented: datetime_facades::delete_datetime_format".to_string())
}

// =============================================================================
// Settings: custom_due_days 配列 要素CRUD
// =============================================================================

/// custom_due_days に要素を追加

#[instrument(level = "info", skip(state))]
#[tauri::command]
pub async fn add_custom_due_day(state: State<'_, AppState>, day: i32) -> Result<(), String> {
    let mut settings = state.settings.write().await;
    if !settings.custom_due_days.contains(&day) {
        settings.custom_due_days.push(day);
        settings.custom_due_days.sort();
    }
    state
        .settings_manager
        .save_settings(&*settings)
        .await
        .map_err(|e| {
            tracing::error!(target: "commands::settings", command = "add_custom_due_day", error = %e);
            e.to_string()
        })?;
    Ok(())
}

/// custom_due_days の既存要素を新しい値で置換

#[instrument(level = "info", skip(state))]
#[tauri::command]
pub async fn update_custom_due_day(
    state: State<'_, AppState>,
    old_day: i32,
    new_day: i32,
) -> Result<(), String> {
    let mut settings = state.settings.write().await;
    if let Some(pos) = settings.custom_due_days.iter().position(|d| *d == old_day) {
        settings.custom_due_days[pos] = new_day;
        settings.custom_due_days.sort();
        settings.custom_due_days.dedup();
        state
            .settings_manager
            .save_settings(&*settings)
            .await
            .map_err(|e| {
                tracing::error!(target: "commands::settings", command = "update_custom_due_day", error = %e);
                e.to_string()
            })?;
        return Ok(());
    }
    Err(format!("custom_due_days not found: {}", old_day))
}

/// custom_due_days から要素を削除

#[instrument(level = "info", skip(state))]
#[tauri::command]
pub async fn delete_custom_due_day(state: State<'_, AppState>, day: i32) -> Result<(), String> {
    let mut settings = state.settings.write().await;
    let before_len = settings.custom_due_days.len();
    settings.custom_due_days.retain(|d| *d != day);
    if settings.custom_due_days.len() == before_len {
        return Err(format!("custom_due_days not found: {}", day));
    }
    state
        .settings_manager
        .save_settings(&*settings)
        .await
        .map_err(|e| {
            tracing::error!(target: "commands::settings", command = "delete_custom_due_day", error = %e);
            e.to_string()
        })?;
    Ok(())
}

// =============================================================================
// Settings: datetime_formats 配列 要素CRUD（state直更新）
// =============================================================================

/// datetime_formats に要素を追加（id重複はエラー）

#[tauri::command]
pub async fn add_datetime_format_setting(
    state: State<'_, AppState>,
    format: DateTimeFormatCommandModel,
) -> Result<DateTimeFormatCommandModel, String> {
    let model = format.to_model().await?;
    let mut settings = state.settings.write().await;
    if settings.datetime_formats.iter().any(|f| f.id == model.id) {
        return Err(format!("datetime_format id already exists: {}", model.id));
    }
    settings.datetime_formats.push(model);
    state
        .settings_manager
        .save_settings(&*settings)
        .await
        .map_err(|e| {
            tracing::error!(target: "commands::settings", command = "add_datetime_format_setting", error = %e);
            e.to_string()
        })?;
    Ok(format)
}

/// datetime_formats の要素を上書き（id一致で置換、なければ追加）

#[tauri::command]
pub async fn upsert_datetime_format_setting(
    state: State<'_, AppState>,
    format: DateTimeFormatCommandModel,
) -> Result<DateTimeFormatCommandModel, String> {
    let model = format.to_model().await?;
    let mut settings = state.settings.write().await;
    if let Some(existing) = settings
        .datetime_formats
        .iter_mut()
        .find(|f| f.id == model.id)
    {
        *existing = model;
    } else {
        settings.datetime_formats.push(model);
    }
    state
        .settings_manager
        .save_settings(&*settings)
        .await
        .map_err(|e| {
            tracing::error!(target: "commands::settings", command = "upsert_datetime_format_setting", error = %e);
            e.to_string()
        })?;
    Ok(format)
}

/// datetime_formats から要素を削除（id指定）

#[tauri::command]
pub async fn delete_datetime_format_setting(
    state: State<'_, AppState>,
    id: String,
) -> Result<(), String> {
    let mut settings = state.settings.write().await;
    let before_len = settings.datetime_formats.len();
    settings.datetime_formats.retain(|f| f.id != id);
    if settings.datetime_formats.len() == before_len {
        return Err("datetime_format id not found".to_string());
    }
    state
        .settings_manager
        .save_settings(&*settings)
        .await
        .map_err(|e| {
            tracing::error!(target: "commands::settings", command = "delete_datetime_format_setting", error = %e);
            e.to_string()
        })?;
    Ok(())
}

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
