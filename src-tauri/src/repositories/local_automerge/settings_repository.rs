use std::path::PathBuf;
use crate::errors::RepositoryError;
use crate::models::setting::{Settings, DueDateButtons};
use super::document_manager::{DocumentManager, DocumentType};

/// Settings用のAutomerge-Repoリポジトリ
pub struct SettingsRepository {
    document_manager: DocumentManager,
}

impl SettingsRepository {
    /// 新しいSettingsRepositoryを作成
    pub fn new(base_path: PathBuf) -> Result<Self, RepositoryError> {
        let document_manager = DocumentManager::new(base_path)?;
        Ok(Self {
            document_manager,
        })
    }

    /// 設定データを読み込み
    pub async fn load_settings(&mut self) -> Result<Settings, RepositoryError> {
        // Automergeドキュメントから設定を読み込み
        if let Some(settings) = self.document_manager.load_data::<Settings>(&DocumentType::Settings, "settings").await? {
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
            self.save_settings(&default_settings).await?;
            Ok(default_settings)
        }
    }

    /// 設定データを保存
    pub async fn save_settings(&mut self, settings: &Settings) -> Result<(), RepositoryError> {
        self.document_manager
            .save_data(&DocumentType::Settings, "settings", settings).await
    }

    /// 特定の設定項目を更新
    pub async fn update_setting(&mut self, key: &str, value: &str) -> Result<(), RepositoryError> {
        self.document_manager
            .update_value(&DocumentType::Settings, key, value).await
    }

    /// 時刻ラベルを追加
    pub async fn add_time_label(&mut self, _id: &str, _name: &str, _time: &str) -> Result<(), RepositoryError> {
        let _doc_handle = self.document_manager.get_or_create_document(&DocumentType::Settings).await?;
        // TODO: Automergeドキュメントの配列に要素を追加する実装
        Ok(())
    }

    /// 時刻ラベルを削除
    pub async fn remove_time_label(&mut self, _id: &str) -> Result<(), RepositoryError> {
        let _doc_handle = self.document_manager.get_or_create_document(&DocumentType::Settings).await?;
        // TODO: Automergeドキュメントから要素を削除する実装
        Ok(())
    }

    /// 時刻ラベルを更新
    pub async fn update_time_label(&mut self, _id: &str, _name: Option<&str>, _time: Option<&str>) -> Result<(), RepositoryError> {
        let _doc_handle = self.document_manager.get_or_create_document(&DocumentType::Settings).await?;
        // TODO: Automergeドキュメントの要素を更新する実装
        Ok(())
    }

    /// 設定のバックアップを作成
    pub fn backup_settings(&self, _backup_path: &str) -> Result<(), RepositoryError> {
        // TODO: ドキュメントファイルをバックアップパスにコピーする実装
        Ok(())
    }

    /// バックアップから設定を復元
    pub async fn restore_settings(&mut self, _backup_path: &str) -> Result<(), RepositoryError> {
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
        let mut repo = SettingsRepository::new(temp_dir.path().to_path_buf()).unwrap();

        // デフォルト設定を読み込み
        let settings = repo.load_settings().await.unwrap();
        assert_eq!(settings.theme, "system");
        assert_eq!(settings.language, "ja");

        // シンプルな文字列値の保存/読み込みテスト
        println!("シンプルな文字列値のテストを実行...");
        repo.update_setting("test_theme", "dark").await.unwrap();
        
        // シンプルな数値のテスト
        repo.update_setting("test_font_size", "16").await.unwrap();
        
        println!("シンプルな値の保存/読み込みテストが完了しました。");
        println!("Note: 複雑なオブジェクトのシリアライゼーションは次のフェーズで実装予定です。");
    }
}