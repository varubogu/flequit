use super::document_manager::{DocumentManager, DocumentType};
use crate::errors::repository_error::RepositoryError;
use crate::models::setting::{Settings, ViewItem, CustomDateFormat, TimeLabel, DueDateButtons};
use crate::repositories::settings_repository_trait::{SettingsRepository, SettingsValidator, SettingsValidationError};
use async_trait::async_trait;
use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::Mutex;

/// Settings用のAutomerge-Repoリポジトリ
#[derive(Debug)]
pub struct SettingsLocalAutomergeRepository {
    document_manager: Arc<Mutex<DocumentManager>>,
}

impl SettingsLocalAutomergeRepository {
    /// 新しいSettingsRepositoryを作成
    pub fn new(base_path: PathBuf) -> Result<Self, RepositoryError> {
        let document_manager = DocumentManager::new(base_path)?;
        Ok(Self {
            document_manager: Arc::new(Mutex::new(document_manager)),
        })
    }

    /// 設定データの部分更新を内部的に処理
    async fn update_partial<F>(&self, updater: F) -> Result<(), RepositoryError>
    where
        F: FnOnce(&mut Settings),
    {
        let mut current_settings = self.load().await?;
        updater(&mut current_settings);
        self.save_with_validation(&current_settings).await
    }

    /// 設定のバックアップを作成
    pub fn backup_settings(&self, _backup_path: &str) -> Result<(), RepositoryError> {
        // TODO: ドキュメントファイルをバックアップパスにコピーする実装
        Ok(())
    }

    /// バックアップから設定を復元
    pub async fn restore_settings(&self, _backup_path: &str) -> Result<(), RepositoryError> {
        // TODO: バックアップファイルからドキュメントを復元する実装
        Ok(())
    }
}

#[async_trait]
impl SettingsRepository for SettingsLocalAutomergeRepository {
    async fn load(&self) -> Result<Settings, RepositoryError> {
        // Automergeドキュメントから設定を読み込み
        let loaded_settings = {
            let mut manager = self.document_manager.lock().await;
            manager
                .load_data::<Settings>(&DocumentType::Settings, "settings")
                .await?
        };
        if let Some(settings) = loaded_settings {
            Ok(settings)
        } else {
            // データが存在しない場合はデフォルト値を保存して返す
            let default_settings = SettingsValidator::create_default();
            self.save(&default_settings).await?;
            Ok(default_settings)
        }
    }

    async fn save(&self, settings: &Settings) -> Result<(), RepositoryError> {
        let settings_clone = settings.clone();
        let mut manager = self.document_manager.lock().await;
        manager
            .save_data(&DocumentType::Settings, "settings", &settings_clone)
            .await
    }

    async fn save_with_validation(&self, settings: &Settings) -> Result<(), RepositoryError> {
        let validation_errors = self.validate(settings);
        if !validation_errors.is_empty() {
            let error_messages: Vec<String> = validation_errors
                .iter()
                .map(|e| format!("{}: {}", e.field, e.message))
                .collect();
            return Err(RepositoryError::ValidationError(error_messages.join(", ")));
        }

        self.save(settings).await
    }

    async fn reset_to_default(&self) -> Result<Settings, RepositoryError> {
        let default_settings = SettingsValidator::create_default();
        self.save(&default_settings).await?;
        Ok(default_settings)
    }

    fn validate(&self, settings: &Settings) -> Vec<SettingsValidationError> {
        SettingsValidator::validate(settings)
    }

    async fn update_theme(&self, theme: String) -> Result<(), RepositoryError> {
        self.update_partial(|settings| {
            settings.theme = theme;
        }).await
    }

    async fn update_language(&self, language: String) -> Result<(), RepositoryError> {
        self.update_partial(|settings| {
            settings.language = language;
        }).await
    }

    async fn update_custom_date_formats(&self, formats: Vec<CustomDateFormat>) -> Result<(), RepositoryError> {
        self.update_partial(|settings| {
            settings.custom_date_formats = formats;
        }).await
    }

    async fn update_time_labels(&self, labels: Vec<TimeLabel>) -> Result<(), RepositoryError> {
        self.update_partial(|settings| {
            settings.time_labels = labels;
        }).await
    }

    async fn update_view_items(&self, items: Vec<ViewItem>) -> Result<(), RepositoryError> {
        self.update_partial(|settings| {
            settings.view_items = items;
        }).await
    }

    async fn update_due_date_buttons(&self, buttons: DueDateButtons) -> Result<(), RepositoryError> {
        self.update_partial(|settings| {
            settings.due_date_buttons = buttons;
        }).await
    }

    async fn add_custom_date_format(&self, format: CustomDateFormat) -> Result<(), RepositoryError> {
        self.update_partial(|settings| {
            settings.custom_date_formats.push(format);
        }).await
    }

    async fn remove_custom_date_format(&self, format_id: &str) -> Result<(), RepositoryError> {
        self.update_partial(|settings| {
            settings.custom_date_formats.retain(|f| f.id != format_id);
        }).await
    }

    async fn add_time_label(&self, label: TimeLabel) -> Result<(), RepositoryError> {
        self.update_partial(|settings| {
            settings.time_labels.push(label);
        }).await
    }

    async fn remove_time_label(&self, label_id: &str) -> Result<(), RepositoryError> {
        self.update_partial(|settings| {
            settings.time_labels.retain(|l| l.id != label_id);
        }).await
    }

    async fn add_view_item(&self, item: ViewItem) -> Result<(), RepositoryError> {
        self.update_partial(|settings| {
            settings.view_items.push(item);
        }).await
    }

    async fn remove_view_item(&self, item_id: &str) -> Result<(), RepositoryError> {
        self.update_partial(|settings| {
            settings.view_items.retain(|i| i.id != item_id);
        }).await
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    #[tokio::test]
    async fn test_settings_repository() {
        let temp_dir = TempDir::new().unwrap();
        let repo = SettingsLocalAutomergeRepository::new(temp_dir.path().to_path_buf()).unwrap();

        // デフォルト設定を読み込み
        let settings = repo.load().await.unwrap();
        assert_eq!(settings.theme, "system");
        assert_eq!(settings.language, "ja");

        // Settings構造体の完全な保存/読み込みテスト（改良後）
        let mut custom_settings = settings.clone();
        custom_settings.theme = "dark".to_string();
        custom_settings.font_size = 16;
        custom_settings.language = "en".to_string();

        println!(
            "Saving custom settings: theme={}, font_size={}, language={}",
            custom_settings.theme, custom_settings.font_size, custom_settings.language
        );
        repo.save(&custom_settings).await.unwrap();

        println!("Loading settings back...");
        let loaded_settings = repo.load().await.unwrap();

        println!(
            "Loaded settings: theme={}, font_size={}, language={}",
            loaded_settings.theme, loaded_settings.font_size, loaded_settings.language
        );

        // 改良後の実装では実際の値が返されるはず
        assert_eq!(loaded_settings.theme, "dark");
        assert_eq!(loaded_settings.font_size, 16);
        assert_eq!(loaded_settings.language, "en");

        // 複雑なフィールドもテスト
        assert_eq!(loaded_settings.custom_due_days, vec![1, 3, 7, 14, 30]);
        assert_eq!(loaded_settings.due_date_buttons.overdue, true);
        assert_eq!(loaded_settings.due_date_buttons.today, true);

        // 部分更新テスト
        repo.update_theme("light".to_string()).await.unwrap();
        let updated_settings = repo.load().await.unwrap();
        assert_eq!(updated_settings.theme, "light");

        // バリデーションテスト
        let mut invalid_settings = settings.clone();
        invalid_settings.theme = "invalid_theme".to_string();
        let result = repo.save_with_validation(&invalid_settings).await;
        assert!(result.is_err());

        println!("Settings構造体の完全な保存/読み込みテストが成功しました！");
    }
}
