use chrono::{DateTime, Utc};
use flequit_model::models::app_settings::{
    datetime_format::DateTimeFormat,
    settings::Settings,
    due_date_buttons::DueDateButtons,
    time_label::TimeLabel,
    view_item::ViewItem
};
use serde::{Deserialize, Serialize};

/// Settings用Automergeエンティティ定義
///
/// アプリケーション設定のAutoMergeデータ構造
/// 分散環境での同期とコンフリクト解決に対応
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct SettingsDocument {
    /// 設定のプライマリキー (通常は "app_settings")
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

    /// 日時フォーマット
    pub datetime_format: String,

    /// 時刻ラベル (JSON形式)
    pub time_labels: String,

    /// 期限日ボタン設定 (JSON形式)
    pub due_date_buttons: String,

    /// ビューアイテム (JSON形式)
    pub view_items: String,

    /// 最後に選択されたアカウントID
    pub selected_account: String,

    /// 設定作成日時
    pub created_at: DateTime<Utc>,

    /// 設定最終更日時
    pub updated_at: DateTime<Utc>,
}

impl SettingsDocument {
    /// ドメインモデルからAutomergeドキュメントに変換
    pub fn from_domain_model(settings: Settings) -> Result<Self, String> {
        Ok(Self {
            id: "app_settings".to_string(),
            theme: settings.theme,
            language: settings.language,
            font: settings.font,
            font_size: settings.font_size,
            font_color: settings.font_color,
            background_color: settings.background_color,
            week_start: settings.week_start,
            timezone: settings.timezone,
            custom_due_days: serde_json::to_string(&settings.custom_due_days)
                .map_err(|e| format!("Failed to serialize custom_due_days: {}", e))?,
            datetime_format: serde_json::to_string(&settings.datetime_format)
                .map_err(|e| format!("Failed to serialize datetime_format: {}", e))?,
            time_labels: serde_json::to_string(&settings.time_labels)
                .map_err(|e| format!("Failed to serialize time_labels: {}", e))?,
            due_date_buttons: serde_json::to_string(&settings.due_date_buttons)
                .map_err(|e| format!("Failed to serialize due_date_buttons: {}", e))?,
            view_items: serde_json::to_string(&settings.view_items)
                .map_err(|e| format!("Failed to serialize view_items: {}", e))?,
            selected_account: settings.selected_account,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        })
    }

    /// Automergeドキュメントからドメインモデルに変換
    pub fn to_domain_model(&self) -> Result<Settings, String> {
        let custom_due_days: Vec<i32> = serde_json::from_str(&self.custom_due_days)
            .map_err(|e| format!("Failed to parse custom_due_days: {}", e))?;

        let datetime_format: DateTimeFormat = serde_json::from_str(&self.datetime_format)
            .map_err(|e| format!("Failed to parse datetime_format: {}", e))?;

        let time_labels: Vec<TimeLabel> = serde_json::from_str(&self.time_labels)
            .map_err(|e| format!("Failed to parse time_labels: {}", e))?;

        let due_date_buttons: Vec<DueDateButtons> = serde_json::from_str(&self.due_date_buttons)
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
            custom_due_days,
            datetime_format,
            datetime_formats: vec![], // 上位層で別途設定
            time_labels,
            due_date_buttons,
            view_items,
            selected_account: self.selected_account.clone(),
        })
    }
}
