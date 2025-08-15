use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::Mutex;
use crate::errors::RepositoryError;
use crate::models::setting::{Settings, DueDateButtons};
use super::document_manager::{DocumentManager, DocumentType};

/// Settings用のAutomerge-Repoリポジトリ
pub struct SettingsRepository {
    document_manager: Arc<Mutex<DocumentManager>>,
}

impl SettingsRepository {
    /// 新しいSettingsRepositoryを作成
    pub fn new(base_path: PathBuf) -> Result<Self, RepositoryError> {
        let document_manager = DocumentManager::new(base_path)?;
        Ok(Self {
            document_manager: Arc::new(Mutex::new(document_manager)),
        })
    }

    /// 設定データを読み込み
    pub async fn get_setting(&self) -> Result<Settings, RepositoryError> {
        // Automergeドキュメントから設定を読み込み
        let loaded_settings = {
            let mut manager = self.document_manager.lock().await;
            manager.load_data::<Settings>(&DocumentType::Settings, "settings").await?
        };
        if let Some(settings) = loaded_settings {
            Ok(settings)
        } else {
            // データが存在しない場合はデフォルト値を保存して返す
            let default_settings = Settings {
                theme: "system".to_string(),
                language: "ja".to_string(),
                font: "system-ui".to_string(),
                font_size: 14,
                font_color: "#000000".to_string(),
                background_color: "#ffffff".to_string(),
                week_start: "monday".to_string(),
                timezone: "system".to_string(),
                date_format: "YYYY-MM-DD".to_string(),
                custom_due_days: vec![1, 3, 7, 30],
                custom_date_formats: vec![],
                time_labels: vec![],
                due_date_buttons: DueDateButtons {
                    overdue: true,
                    today: true,
                    tomorrow: true,
                    three_days: true,
                    this_week: true,
                    this_month: false,
                    this_quarter: false,
                    this_year: false,
                    this_year_end: false,
                },
                view_items: vec![],
                selected_account: "".to_string(),
                account_icon: None,
                account_name: "".to_string(),
                email: "".to_string(),
                password: "".to_string(),
                server_url: "".to_string(),
            };
            self.set_setting(&default_settings).await?;
            Ok(default_settings)
        }
    }

    /// 設定データを保存
    pub async fn set_setting(&self, settings: &Settings) -> Result<(), RepositoryError> {
        let settings_clone = settings.clone();
        {
            let mut manager = self.document_manager.lock().await;
            manager.save_data(&DocumentType::Settings, "settings", &settings_clone).await
        }
    }

    /// 特定の設定項目を更新
    pub async fn update_setting(&self, key: &str, value: &str) -> Result<(), RepositoryError> {
        let key_string = key.to_string();
        let value_string = value.to_string();
        {
            let mut manager = self.document_manager.lock().await;
            manager.update_value(&DocumentType::Settings, &key_string, &value_string).await
        }
    }

    /// 時刻ラベルを追加
    pub async fn add_time_label(&self, _id: &str, _name: &str, _time: &str) -> Result<(), RepositoryError> {
        let _doc_handle = {
            let mut manager = self.document_manager.lock().await;
            manager.get_or_create_document(&DocumentType::Settings).await?
        };
        // TODO: Automergeドキュメントの配列に要素を追加する実装
        Ok(())
    }

    /// 時刻ラベルを削除
    pub async fn remove_time_label(&self, _id: &str) -> Result<(), RepositoryError> {
        let _doc_handle = {
            let mut manager = self.document_manager.lock().await;
            manager.get_or_create_document(&DocumentType::Settings).await?
        };
        // TODO: Automergeドキュメントから要素を削除する実装
        Ok(())
    }

    /// 時刻ラベルを更新
    pub async fn update_time_label(&self, _id: &str, _name: Option<&str>, _time: Option<&str>) -> Result<(), RepositoryError> {
        let _doc_handle = {
            let mut manager = self.document_manager.lock().await;
            manager.get_or_create_document(&DocumentType::Settings).await?
        };
        // TODO: Automergeドキュメントの要素を更新する実装
        Ok(())
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

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    #[tokio::test]
    async fn test_settings_repository() {
        let temp_dir = TempDir::new().unwrap();
        let repo = SettingsRepository::new(temp_dir.path().to_path_buf()).unwrap();

        // デフォルト設定を読み込み
        let settings = repo.get_setting().await.unwrap();
        assert_eq!(settings.theme, "system");
        assert_eq!(settings.language, "ja");

        // Settings構造体の完全な保存/読み込みテスト（改良後）
        let mut custom_settings = settings.clone();
        custom_settings.theme = "dark".to_string();
        custom_settings.font_size = 16;
        custom_settings.language = "en".to_string();
        
        println!("Saving custom settings: theme={}, font_size={}, language={}", 
                custom_settings.theme, custom_settings.font_size, custom_settings.language);
        repo.set_setting(&custom_settings).await.unwrap();
        
        println!("Loading settings back...");
        let loaded_settings = repo.get_setting().await.unwrap();
        
        println!("Loaded settings: theme={}, font_size={}, language={}", 
                loaded_settings.theme, loaded_settings.font_size, loaded_settings.language);
        
        // 改良後の実装では実際の値が返されるはず
        assert_eq!(loaded_settings.theme, "dark");
        assert_eq!(loaded_settings.font_size, 16);
        assert_eq!(loaded_settings.language, "en");
        
        // 複雑なフィールドもテスト
        assert_eq!(loaded_settings.custom_due_days, vec![1, 3, 7, 30]);
        assert_eq!(loaded_settings.due_date_buttons.overdue, true);
        assert_eq!(loaded_settings.due_date_buttons.today, true);
        
        // 特定の設定項目を更新テスト
        repo.update_setting("font", "Arial").await.unwrap();
        
        println!("Settings構造体の完全な保存/読み込みテストが成功しました！");
    }
}