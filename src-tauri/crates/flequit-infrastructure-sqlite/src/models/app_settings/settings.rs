use async_trait::async_trait;
use chrono::{DateTime, Utc};
use flequit_model::models::app_settings::{
    due_date_buttons::DueDateButtons,
    settings::Settings,
    time_label::TimeLabel,
    view_item::ViewItem
};
use sea_orm::{entity::prelude::*, Set};
use serde::{Deserialize, Serialize};

use super::{DomainToSqliteConverter, SqliteModelConverter};

/// Settings用SQLiteエンティティ定義
///
/// パフォーマンス最適化のため、設定データを正規化せずJSON形式で保存
/// 読み取り頻度が高く、部分更新が少ない特性を活用
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "settings")]
pub struct Model {
    /// 設定のプライマリキー (通常は "app_settings")
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: String,

    /// テーマ設定
    pub theme: String,

    /// 言語設定
    pub language: String,

    /// フォント設定
    pub font: String,

    /// フォントサイズ
    pub font_size: i32,

    /// フォント色
    pub font_color: String,

    /// 背景色
    pub background_color: String,

    /// 週の開始曜日
    pub week_start: String,

    /// タイムゾーン
    pub timezone: String,

    /// カスタム期限日数 (JSON形式)
    pub custom_due_days: String,

    /// カスタム日付フォーマット (JSON形式)
    pub datetime_format: String,

    /// 時刻ラベル (JSON形式)
    pub time_labels: String,

    /// 期限日ボタン設定 (JSON形式)
    pub due_date_buttons: String,

    /// ビューアイテム (JSON形式)
    pub view_items: String,

    /// 最後に選択されたアカウントID
    pub selected_account: String,

    /// 作成日時
    pub created_at: DateTime<Utc>,

    /// 更新日時
    pub updated_at: DateTime<Utc>,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}

/// SQLiteモデルからドメインモデルへの変換
#[async_trait]
impl SqliteModelConverter<Settings> for Model {
    async fn to_domain_model(&self) -> Result<Settings, String> {
        // JSON文字列をパース
        let custom_due_days: Vec<i32> = serde_json::from_str(&self.custom_due_days)
            .map_err(|e| format!("Failed to parse custom_due_days: {}", e))?;

        let time_labels: Vec<TimeLabel> = serde_json::from_str(&self.time_labels)
            .map_err(|e| format!("Failed to parse time_labels: {}", e))?;

        let due_date_buttons: DueDateButtons = serde_json::from_str(&self.due_date_buttons)
            .map_err(|e| format!("Failed to parse due_date_buttons: {}", e))?;

        let view_items: Vec<ViewItem> = serde_json::from_str(&self.view_items)
            .map_err(|e| format!("Failed to parse view_items: {}", e))?;

        Ok(Settings {
            theme: self.theme.clone(),
            language: self.language.clone(),
            font: self.font.clone(),
            font_size: self.font_size,
            font_color: self.font_color.clone(),
            background_color: self.background_color.clone(),
            week_start: self.week_start.clone(),
            timezone: self.timezone.clone(),
            datetime_format: serde_json::from_str(&self.datetime_format)
                .unwrap_or_default(),
            datetime_formats: vec![],
            custom_due_days,
            time_labels,
            due_date_buttons: vec![due_date_buttons],
            view_items,
            selected_account: self.selected_account.clone(),
        })
    }
}

/// ドメインモデルからSQLiteモデルへの変換
#[async_trait]
impl DomainToSqliteConverter<ActiveModel> for Settings {
    async fn to_sqlite_model(&self) -> Result<ActiveModel, String> {
        // JSON文字列にシリアライズ
        let custom_due_days_json = serde_json::to_string(&self.custom_due_days)
            .map_err(|e| format!("Failed to serialize custom_due_days: {}", e))?;

        let datetime_formats_json = serde_json::to_string(&self.datetime_format)
            .map_err(|e| format!("Failed to serialize date_format: {}", e))?;

        let time_labels_json = serde_json::to_string(&self.time_labels)
            .map_err(|e| format!("Failed to serialize time_labels: {}", e))?;

        let due_date_buttons_json = serde_json::to_string(&self.due_date_buttons)
            .map_err(|e| format!("Failed to serialize due_date_buttons: {}", e))?;

        let view_items_json = serde_json::to_string(&self.view_items)
            .map_err(|e| format!("Failed to serialize view_items: {}", e))?;

        Ok(ActiveModel {
            id: Set("app_settings".to_string()),
            theme: Set(self.theme.clone()),
            language: Set(self.language.clone()),
            font: Set(self.font.clone()),
            font_size: Set(self.font_size),
            font_color: Set(self.font_color.clone()),
            background_color: Set(self.background_color.clone()),
            week_start: Set(self.week_start.clone()),
            timezone: Set(self.timezone.clone()),
            custom_due_days: Set(custom_due_days_json),
            datetime_format: Set(datetime_formats_json),
            time_labels: Set(time_labels_json),
            due_date_buttons: Set(due_date_buttons_json),
            view_items: Set(view_items_json),
            selected_account: Set(self.selected_account.clone()),
            created_at: Set(Utc::now()),
            updated_at: Set(Utc::now()),
        })
    }
}

// レガシー対応の別形式は必要に応じて別モジュールで実装可能
