use crate::models::settings::{PartialSettingsCommandModel, SettingsCommandModel};
use crate::models::CommandModelConverter;
use crate::state::AppState;
use flequit_model::models::ModelConverter;
use flequit_settings::{PartialSettings, Settings};
use tauri::State;
use tracing::instrument;

/// 新しい設定管理APIで設定を読み込み
///
/// stateから設定を取得します。
#[instrument(level = "info", skip(state))]
#[tauri::command]
pub async fn load_settings(state: State<'_, AppState>) -> Result<SettingsCommandModel, String> {
    let settings = state.settings.read().await.clone();
    settings.to_command_model().await
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
    let partial_model = partial_settings
        .to_model()
        .await
        .map_err(|e| e.to_string())?;

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
    updated_settings
        .to_command_model()
        .await
        .map_err(|e| e.to_string())
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
        .save_settings(&settings)
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
            .save_settings(&settings)
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
        .save_settings(&settings)
        .await
        .map_err(|e| {
            tracing::error!(target: "commands::settings", command = "delete_custom_due_day", error = %e);
            e.to_string()
        })?;
    Ok(())
}
