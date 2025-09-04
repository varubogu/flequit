use chrono::{DateTime, Utc};
use flequit_model::models::app_settings::settings::Settings;
use flequit_model::types::id_types::SettingsId;
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


    /// 設定作成日時
    pub created_at: DateTime<Utc>,

    /// 設定最終更新日時
    pub updated_at: DateTime<Utc>,
}

impl SettingsDocument {
    /// ドメインモデルからAutomergeドキュメントに変換
    pub fn from_domain_model(settings: Settings) -> Self {
        Self {
            id: settings.id.to_string(),
            theme: settings.theme,
            language: settings.language,
            font: settings.font,
            font_size: settings.font_size,
            font_color: settings.font_color,
            background_color: settings.background_color,
            week_start: settings.week_start,
            timezone: settings.timezone,
            // domain の Settings には作成/更新日時や上のレガシーフィールドが存在しないため
            // Automerge 側のドキュメント生成時に現在時刻を設定する
            created_at: Utc::now(),
            updated_at: Utc::now(),
        }
    }

    /// Automergeドキュメントからドメインモデルに変換
    pub fn to_domain_model(&self) -> Result<Settings, String> {
        Ok(Settings {
            id: SettingsId::try_from_str(&self.id).map_err(|e| e.to_string())?,
            theme: self.theme.clone(),
            language: self.language.clone(),
            font: self.font.clone(),
            font_size: self.font_size,
            font_color: self.font_color.clone(),
            background_color: self.background_color.clone(),
            week_start: self.week_start.clone(),
            timezone: self.timezone.clone(),
            custom_due_days: vec![],
            date_format: Default::default(),
            time_labels: vec![],
            due_date_buttons: vec![],
            view_items: vec![],
            last_selected_account: String::new(),
        })
    }
}
