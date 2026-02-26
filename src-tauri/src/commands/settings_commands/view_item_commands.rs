use crate::models::view_item::ViewItemCommandModel;
use crate::state::AppState;
use tauri::State;
use tracing::instrument;

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
            .save_settings(&settings)
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
            .save_settings(&settings)
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
            .save_settings(&settings)
            .await
            .map_err(|e| e.to_string())?;
    }

    Ok(())
}
