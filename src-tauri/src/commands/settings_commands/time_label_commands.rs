use crate::models::time_label::TimeLabelCommandModel;
use crate::state::AppState;
use tauri::State;
use tracing::instrument;

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
            .save_settings(&settings)
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
            .save_settings(&settings)
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
            .save_settings(&settings)
            .await
            .map_err(|e| {
                tracing::error!(target: "commands::settings", command = "delete_time_label_setting", error = %e);
                e.to_string()
            })?;
    }

    Ok(())
}
