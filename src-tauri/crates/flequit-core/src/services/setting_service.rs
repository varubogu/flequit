//! 設定関連のビジネスロジック
use flequit_types::errors::service_error::ServiceError;
use flequit_repository::repositories::base_repository_trait::Repository;
use flequit_repository::repositories::app_settings::settings_repository_trait::SettingsRepositoryTrait;
use flequit_infrastructure::InfrastructureRepositoriesTrait;
use flequit_model::models::app_settings::{datetime_format::DateTimeFormat, settings::Settings, time_label::TimeLabel, view_item::ViewItem};
use uuid::Uuid;

// ---------------------------
// Settings (全体設定)
// ---------------------------

/// すべての設定項目を各リポジトリから取得し、Settings構造体として返します。
pub async fn get_all_settings(repositories: &dyn InfrastructureRepositoriesTrait) -> Result<Settings, ServiceError> {

    // メインの設定を取得
    let base_settings = repositories
        .settings()
        .get_settings()
        .await
        .map_err(|e| ServiceError::InternalError(format!("Repository error: {:?}", e)))?
        .unwrap_or_default(); // デフォルト設定を使用

    // 関連データを取得 (実装待ち)
    // let time_labels = repository.settings().get_all_time_labels().await
    //     .map_err(|e| ServiceError::InternalError(format!("Repository error: {:?}", e)))?;
    // let view_items = repository.settings().get_all_view_items().await
    //     .map_err(|e| ServiceError::InternalError(format!("Repository error: {:?}", e)))?;
    
    // 一時的な仮実装
    let time_labels = Vec::new();
    let view_items = Vec::new();

    // Settings構造体を組み立て
    let settings = Settings {
        time_labels,
        view_items,
        ..base_settings
    };

    Ok(settings)
}

/// 設定を保存します。
pub async fn save_settings(repositories: &dyn InfrastructureRepositoriesTrait, settings: &Settings) -> Result<(), ServiceError> {
    repositories
        .settings()
        .save(settings)
        .await
        .map_err(|e| ServiceError::InternalError(format!("Repository error: {:?}", e)))
}

/// 特定のキーの設定値を保存します（レガシー対応）。
pub async fn set_setting(repositories: &dyn InfrastructureRepositoriesTrait, key: &str, value: serde_json::Value) -> Result<(), ServiceError> {
    // 現在の設定を取得
    let mut current_settings = get_all_settings(repositories).await?;

    // 指定されたキーの値を更新
    match key {
        "theme" => current_settings.theme = value.as_str().unwrap_or_default().to_string(),
        "language" => current_settings.language = value.as_str().unwrap_or_default().to_string(),
        "font" => current_settings.font = value.as_str().unwrap_or_default().to_string(),
        "font_size" => current_settings.font_size = value.as_i64().unwrap_or_default() as i32,
        "font_color" => {
            current_settings.font_color = value.as_str().unwrap_or_default().to_string()
        }
        "background_color" => {
            current_settings.background_color = value.as_str().unwrap_or_default().to_string()
        }
        "week_start" => {
            current_settings.week_start = value.as_str().unwrap_or_default().to_string()
        }
        "timezone" => current_settings.timezone = value.as_str().unwrap_or_default().to_string(),
        "date_format" => {
            // DateTimeFormat構造体に値を設定（簡単な例）
            if let Ok(format_data) = serde_json::from_value::<DateTimeFormat>(value) {
                current_settings.date_format = format_data;
            }
        }
        "last_selected_account" => {
            current_settings.last_selected_account = value.as_str().unwrap_or_default().to_string()
        }
        // JSONフィールドの場合
        "custom_due_days" => {
            if let Ok(days) = serde_json::from_value(value) {
                current_settings.custom_due_days = days;
            }
        }
        "due_date_buttons" => {
            if let Ok(buttons) = serde_json::from_value(value) {
                current_settings.due_date_buttons = buttons;
            }
        }
        _ => {
            return Err(ServiceError::InvalidArgument(format!(
                "Unknown setting key: {}",
                key
            )))
        }
    }

    // 更新された設定を保存
    save_settings(repositories, &current_settings).await
}

// ---------------------------
// Note: CustomDateFormat型は現在のモデルには存在しないため、
// これらの関数は一時的に削除されています。
// 必要に応じて適切な型での実装を行ってください。
// ---------------------------

// ---------------------------
// Time Labels (実装待ち - 一時的な仮実装)
// ---------------------------

pub async fn get_time_label(repositories: &dyn InfrastructureRepositoriesTrait, _id: &str) -> Result<Option<TimeLabel>, ServiceError> {
    // let repository = InfrastructureRepositories::instance().await;
    // repository.settings().get_time_label(id).await
    //     .map_err(|e| ServiceError::InternalError(format!("Repository error: {:?}", e)))
    Ok(None)
}

pub async fn get_all_time_labels(repositories: &dyn InfrastructureRepositoriesTrait) -> Result<Vec<TimeLabel>, ServiceError> {
    // let repository = InfrastructureRepositories::instance().await;
    // repository.settings().get_all_time_labels().await
    //     .map_err(|e| ServiceError::InternalError(format!("Repository error: {:?}", e)))
    Ok(Vec::new())
}

pub async fn add_time_label(repositories: &dyn InfrastructureRepositoriesTrait, mut label: TimeLabel) -> Result<TimeLabel, ServiceError> {
    if label.id.is_empty() {
        label.id = Uuid::new_v4().to_string();
    }
    // let repository = InfrastructureRepositories::instance().await;
    // repository.settings().add_time_label(&label).await
    //     .map_err(|e| ServiceError::InternalError(format!("Repository error: {:?}", e)))?;
    Ok(label)
}

pub async fn update_time_label(repositories: &dyn InfrastructureRepositoriesTrait, label: TimeLabel) -> Result<TimeLabel, ServiceError> {
    // let repository = InfrastructureRepositories::instance().await;
    // repository.settings().update_time_label(&label).await
    //     .map_err(|e| ServiceError::InternalError(format!("Repository error: {:?}", e)))?;
    Ok(label)
}

pub async fn delete_time_label(repositories: &dyn InfrastructureRepositoriesTrait, _id: &str) -> Result<(), ServiceError> {
    // let repository = InfrastructureRepositories::instance().await;
    // repository.settings().delete_time_label(id).await
    //     .map_err(|e| ServiceError::InternalError(format!("Repository error: {:?}", e)))
    Ok(())
}

// ---------------------------
// View Items (実装待ち - 一時的な仮実装)
// ---------------------------

pub async fn get_view_item(repositories: &dyn InfrastructureRepositoriesTrait, _id: &str) -> Result<Option<ViewItem>, ServiceError> {
    // let repository = InfrastructureRepositories::instance().await;
    // repository.settings().get_view_item(id).await
    //     .map_err(|e| ServiceError::InternalError(format!("Repository error: {:?}", e)))
    Ok(None)
}

pub async fn get_all_view_items(repositories: &dyn InfrastructureRepositoriesTrait) -> Result<Vec<ViewItem>, ServiceError> {
    // let repository = InfrastructureRepositories::instance().await;
    // repository.settings().get_all_view_items().await
    //     .map_err(|e| ServiceError::InternalError(format!("Repository error: {:?}", e)))
    Ok(Vec::new())
}

pub async fn add_view_item(repositories: &dyn InfrastructureRepositoriesTrait, mut item: ViewItem) -> Result<ViewItem, ServiceError> {
    if item.id.is_empty() {
        item.id = Uuid::new_v4().to_string();
    }
    // let repository = InfrastructureRepositories::instance().await;
    // repository.settings().add_view_item(&item).await
    //     .map_err(|e| ServiceError::InternalError(format!("Repository error: {:?}", e)))?;
    Ok(item)
}

pub async fn update_view_item(repositories: &dyn InfrastructureRepositoriesTrait, item: ViewItem) -> Result<ViewItem, ServiceError> {
    // let repository = InfrastructureRepositories::instance().await;
    // repository.settings().update_view_item(&item).await
    //     .map_err(|e| ServiceError::InternalError(format!("Repository error: {:?}", e)))?;
    Ok(item)
}

pub async fn delete_view_item(repositories: &dyn InfrastructureRepositoriesTrait, _id: &str) -> Result<(), ServiceError> {
    // let repository = InfrastructureRepositories::instance().await;
    // repository.settings().delete_view_item(id).await
    //     .map_err(|e| ServiceError::InternalError(format!("Repository error: {:?}", e)))
    Ok(())
}
