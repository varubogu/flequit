use crate::models::datetime_format::DateTimeFormatCommandModel;
use crate::state::AppState;
use flequit_model::models::ModelConverter;
use tauri::State;
use tracing::instrument;

// ---------------------------
// Custom Date Format commands
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
) -> Result<Vec<DateTimeFormatCommandModel>, String> {
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
// Settings: datetime_formats 配列 要素CRUD（state直更新）
// =============================================================================

/// datetime_formats に要素を追加（id重複はエラー）
#[instrument(level = "info", skip(state, format))]
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
        .save_settings(&settings)
        .await
        .map_err(|e| {
            tracing::error!(target: "commands::settings", command = "add_datetime_format_setting", error = %e);
            e.to_string()
        })?;
    Ok(format)
}

/// datetime_formats の要素を上書き（id一致で置換、なければ追加）
#[instrument(level = "info", skip(state, format))]
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
        .save_settings(&settings)
        .await
        .map_err(|e| {
            tracing::error!(target: "commands::settings", command = "upsert_datetime_format_setting", error = %e);
            e.to_string()
        })?;
    Ok(format)
}

/// datetime_formats から要素を削除（id指定）
#[instrument(level = "info", skip(state), fields(id = %id))]
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
        .save_settings(&settings)
        .await
        .map_err(|e| {
            tracing::error!(target: "commands::settings", command = "delete_datetime_format_setting", error = %e);
            e.to_string()
        })?;
    Ok(())
}
