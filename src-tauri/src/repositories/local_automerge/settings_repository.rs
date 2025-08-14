// TODO: 実装をautomerge-repoベースに変更する必要があります
// 現在の実装は一時的にコメントアウトしています

use std::path::PathBuf;
use crate::errors::RepositoryError;
use crate::models::setting::{Settings, DueDateButtons};

/// Settings用のAutomerge-Repoリポジトリ
pub struct SettingsRepository {
    // TODO: automerge-repo::RepoHandle を使用
    _base_path: PathBuf,
}

impl SettingsRepository {
    /// 新しいSettingsRepositoryを作成
    pub fn new(base_path: PathBuf) -> Result<Self, RepositoryError> {
        Ok(Self {
            _base_path: base_path,
        })
    }

    /// 設定データを読み込み
    pub fn load_settings(&mut self) -> Result<Settings, RepositoryError> {
        // TODO: automerge-repoを使用した実装
        // デフォルト値を返す
        Ok(Settings {
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
        })
    }

    /// 設定データを保存
    pub fn save_settings(&mut self, _settings: &Settings) -> Result<(), RepositoryError> {
        // TODO: automerge-repoを使用した実装
        Ok(())
    }

    /// 特定の設定項目を更新
    pub fn update_setting(&mut self, _key: &str, _value: &str) -> Result<(), RepositoryError> {
        // TODO: automerge-repoを使用した実装
        Ok(())
    }

    /// 時刻ラベルを追加
    pub fn add_time_label(&mut self, _id: &str, _name: &str, _time: &str) -> Result<(), RepositoryError> {
        // TODO: automerge-repoを使用した実装
        Ok(())
    }

    /// 時刻ラベルを削除
    pub fn remove_time_label(&mut self, _id: &str) -> Result<(), RepositoryError> {
        // TODO: automerge-repoを使用した実装
        Ok(())
    }

    /// 時刻ラベルを更新
    pub fn update_time_label(&mut self, _id: &str, _name: Option<&str>, _time: Option<&str>) -> Result<(), RepositoryError> {
        // TODO: automerge-repoを使用した実装
        Ok(())
    }

    /// 設定のバックアップを作成
    pub fn backup_settings(&self, _backup_path: &str) -> Result<(), RepositoryError> {
        // TODO: automerge-repoを使用した実装
        Ok(())
    }

    /// バックアップから設定を復元
    pub fn restore_settings(&mut self, _backup_path: &str) -> Result<(), RepositoryError> {
        // TODO: automerge-repoを使用した実装
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
        let settings = repo.load_settings().unwrap();
        assert_eq!(settings.theme, "system");
        assert_eq!(settings.language, "ja");

        // TODO: 実装完了後にテストを有効化
        // repo.update_setting("general.theme", "dark").unwrap();
        // let updated_settings = repo.load_settings().unwrap();
        // assert_eq!(updated_settings.theme, "dark");
    }
}