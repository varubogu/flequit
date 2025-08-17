//! Settings用SQLiteリポジトリ
//!
//! 設定データのSQLiteベースでのCRUD操作を提供

use super::database_manager::DatabaseManager;
use crate::errors::repository_error::RepositoryError;
use crate::models::setting::Settings;
use crate::models::sqlite::setting::{
    ActiveModel as SettingsActiveModel, Entity as SettingsEntity,
};
use crate::models::sqlite::{DomainToSqliteConverter, SqliteModelConverter};
use sea_orm::{ActiveModelTrait, EntityTrait};
use std::sync::Arc;
use tokio::sync::RwLock;

/// Settings用SQLiteリポジトリ
pub struct SettingsLocalSqliteRepository {
    db_manager: Arc<RwLock<DatabaseManager>>,
}

impl SettingsLocalSqliteRepository {
    /// 新しいSettingsRepositoryを作成
    pub fn new(db_manager: Arc<RwLock<DatabaseManager>>) -> Self {
        Self { db_manager }
    }

    /// 設定を初期化（存在しない場合はデフォルト値で作成）
    pub async fn initialize_settings(&self) -> Result<Settings, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await?;

        // 既存の設定を検索
        if let Some(existing) = SettingsEntity::find().one(db).await? {
            return existing
                .to_domain_model()
                .await
                .map_err(RepositoryError::Conversion);
        }

        // デフォルト設定を作成
        let default_settings = Self::create_default_settings();
        self.save(&default_settings).await
    }

    /// デフォルト設定を作成
    fn create_default_settings() -> Settings {
        use crate::models::setting::{CustomDateFormat, DueDateButtons, TimeLabel, ViewItem};

        Settings {
            theme: "system".to_string(),
            language: "ja".to_string(),
            font: "system-ui".to_string(),
            font_size: 14,
            font_color: "#000000".to_string(),
            background_color: "#ffffff".to_string(),
            week_start: "monday".to_string(),
            timezone: "Asia/Tokyo".to_string(),
            date_format: "YYYY/MM/DD".to_string(),
            custom_due_days: vec![1, 3, 7, 14, 30],
            custom_date_formats: vec![CustomDateFormat {
                id: "format1".to_string(),
                name: "日本語形式".to_string(),
                format: "YYYY年MM月DD日".to_string(),
            }],
            time_labels: vec![
                TimeLabel {
                    id: "morning".to_string(),
                    name: "朝".to_string(),
                    time: "09:00".to_string(),
                },
                TimeLabel {
                    id: "afternoon".to_string(),
                    name: "昼".to_string(),
                    time: "13:00".to_string(),
                },
                TimeLabel {
                    id: "evening".to_string(),
                    name: "夕方".to_string(),
                    time: "18:00".to_string(),
                },
            ],
            due_date_buttons: DueDateButtons {
                overdue: true,
                today: true,
                tomorrow: true,
                three_days: true,
                this_week: true,
                this_month: true,
                this_quarter: false,
                this_year: false,
                this_year_end: false,
            },
            view_items: vec![
                ViewItem {
                    id: "priority".to_string(),
                    label: "優先度".to_string(),
                    icon: "star".to_string(),
                    visible: true,
                    order: 1,
                },
                ViewItem {
                    id: "due_date".to_string(),
                    label: "期限".to_string(),
                    icon: "calendar".to_string(),
                    visible: true,
                    order: 2,
                },
                ViewItem {
                    id: "tags".to_string(),
                    label: "タグ".to_string(),
                    icon: "tag".to_string(),
                    visible: true,
                    order: 3,
                },
            ],
            selected_account: "".to_string(),
            account_icon: None,
            account_name: "".to_string(),
            email: "".to_string(),
            password: "".to_string(),
            server_url: "".to_string(),
        }
    }
}

impl SettingsLocalSqliteRepository {
    async fn save(&self, settings: &Settings) -> Result<Settings, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await?;

        // 既存の設定をチェック
        let existing = SettingsEntity::find().one(db).await?;

        if let Some(existing_model) = existing {
            // 更新
            let mut active_model: SettingsActiveModel = existing_model.into();
            let new_active = settings
                .to_sqlite_model()
                .await
                .map_err(RepositoryError::Conversion)?;

            // 必要なフィールドを更新
            active_model.theme = new_active.theme;
            active_model.language = new_active.language;
            active_model.font = new_active.font;
            active_model.font_size = new_active.font_size;
            active_model.font_color = new_active.font_color;
            active_model.background_color = new_active.background_color;
            active_model.week_start = new_active.week_start;
            active_model.timezone = new_active.timezone;
            active_model.date_format = new_active.date_format;
            active_model.custom_due_days = new_active.custom_due_days;
            active_model.custom_date_formats = new_active.custom_date_formats;
            active_model.time_labels = new_active.time_labels;
            active_model.due_date_buttons = new_active.due_date_buttons;
            active_model.view_items = new_active.view_items;
            active_model.selected_account = new_active.selected_account;
            active_model.account_icon = new_active.account_icon;
            active_model.account_name = new_active.account_name;
            active_model.email = new_active.email;
            active_model.password = new_active.password;
            active_model.server_url = new_active.server_url;
            active_model.updated_at = new_active.updated_at;

            let updated = active_model.update(db).await?;
            updated
                .to_domain_model()
                .await
                .map_err(RepositoryError::Conversion)
        } else {
            // 新規作成
            let active_model = settings
                .to_sqlite_model()
                .await
                .map_err(RepositoryError::Conversion)?;
            let saved = active_model.insert(db).await?;
            saved
                .to_domain_model()
                .await
                .map_err(RepositoryError::Conversion)
        }
    }

    async fn find_by_id(&self, _id: &str) -> Result<Option<Settings>, RepositoryError> {
        // 設定は単一のレコードなので、IDは無視して全体を取得
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await?;

        if let Some(model) = SettingsEntity::find().one(db).await? {
            let settings = model
                .to_domain_model()
                .await
                .map_err(RepositoryError::Conversion)?;
            Ok(Some(settings))
        } else {
            Ok(None)
        }
    }

    async fn update(&self, settings: &Settings) -> Result<Settings, RepositoryError> {
        self.save(settings).await
    }

    async fn delete_by_id(&self, _id: &str) -> Result<bool, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await?;

        let result = SettingsEntity::delete_many().exec(db).await?;
        Ok(result.rows_affected > 0)
    }

    async fn find_all(&self) -> Result<Vec<Settings>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await?;

        let models = SettingsEntity::find().all(db).await?;
        let mut settings_list = Vec::new();

        for model in models {
            let settings = model
                .to_domain_model()
                .await
                .map_err(RepositoryError::Conversion)?;
            settings_list.push(settings);
        }

        Ok(settings_list)
    }
}
