//! アプリケーション設定構造体
//!
//! このモジュールはアプリケーションの全設定項目を管理する構造体を定義します。

use serde::{Deserialize, Serialize};

use super::datetime_format::DateTimeFormat;
use super::time_label::TimeLabel;
use super::due_date_buttons::DueDateButtons;
use super::view_item::ViewItem;

/// アプリケーション設定構造体（フラット構造）
///
/// アプリケーションの全設定項目を単一の構造体で管理します。
/// フロントエンドのSettings型に対応しています。
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Settings {
    // テーマ・外観設定
    /// UIテーマ（"system", "light", "dark"）
    pub theme: String,
    /// 言語設定（ISO 639-1形式）
    pub language: String,
    /// フォント名
    pub font: String,
    /// フォントサイズ
    pub font_size: i32,
    /// フォント色
    pub font_color: String,
    /// 背景色
    pub background_color: String,

    // 基本設定
    /// 週の開始曜日（"sunday", "monday"）
    pub week_start: String,
    /// タイムゾーン
    pub timezone: String,
    /// カスタム期日日数
    pub custom_due_days: Vec<i32>,
    /// 選択した日時フォーマット
    pub datetime_format: DateTimeFormat,
    /// 日時フォーマット一覧
    pub datetime_formats: Vec<DateTimeFormat>,
    /// 時刻ラベル
    pub time_labels: Vec<TimeLabel>,

    // 表示設定
    /// 期日ボタンの表示設定
    pub due_date_buttons: Vec<DueDateButtons>,
    /// ビューアイテム設定
    pub view_items: Vec<ViewItem>,

}

impl Default for Settings {
    fn default() -> Self {
        Self {
            theme: "system".to_string(),
            language: "ja".to_string(),
            font: "system".to_string(),
            font_size: 14,
            font_color: "#000000".to_string(),
            background_color: "#FFFFFF".to_string(),
            week_start: "monday".to_string(),
            timezone: "Asia/Tokyo".to_string(),
            custom_due_days: vec![1, 3, 7, 14, 30],
            datetime_format: DateTimeFormat::default(),
            datetime_formats: vec![],
            time_labels: vec![],
            due_date_buttons: vec![],
            view_items: vec![],
        }
    }
}
