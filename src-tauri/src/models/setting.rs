//! 設定管理モデル
//!
//! このモジュールはアプリケーションの設定情報を管理する構造体を定義します。
//!
//! ## 概要
//!
//! 設定管理では以下3つの主要構造体を提供：
//! - `LocalSettings`: ローカル環境固有の設定（テーマ、言語等）
//! - `Setting`: 汎用的なキー・バリュー型設定
//! - `SettingResponse`: 設定操作のレスポンス用構造体

use serde::{Deserialize, Serialize};

use crate::models::{
    command::setting::{LocalSettingsCommand, SettingCommand},
    CommandModelConverter,
};

/// ローカル環境固有の設定情報を表現する構造体
///
/// アプリケーション初期化時に使用される基本的な環境設定を管理します。
/// ユーザーの環境設定やプリファレンスに関わる情報を含みます。
///
/// # フィールド
///
/// * `theme` - UIテーマ設定（"light", "dark", "system"等）
/// * `language` - 表示言語設定（"ja", "en"等、ISO 639-1形式）
///
/// # 使用場面
///
/// - アプリケーション起動時の初期化
/// - ユーザー設定画面での表示・変更
/// - 設定のローカルファイル保存・読み込み
///
/// # 設計思想
///
/// - **軽量性**: 頻繁にアクセスされる基本設定のみを含む
/// - **初期化特化**: アプリケーション起動時の迅速な読み込み
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LocalSettings {
    /// UIテーマ設定（"light", "dark", "system"等）
    pub theme: String,
    /// 表示言語設定（"ja", "en"等、ISO 639-1形式）
    pub language: String,
}

/// 汎用的なキー・バリュー型設定情報を表現する構造体
///
/// アプリケーションの拡張可能な設定項目を管理します。
/// 文字列ベースで柔軟性を重視した設計となっています。
///
/// # フィールド
///
/// * `id` - 設定項目の一意識別子
/// * `key` - 設定キー（ドット記法推奨："ui.theme", "notification.email"等）
/// * `value` - 設定値（文字列として保存、型変換は利用側で実施）
/// * `data_type` - 値の型情報（"string", "number", "boolean", "json"等）
/// * `created_at` - 設定作成日時（文字列形式）
/// * `updated_at` - 最終更新日時（文字列形式）
///
/// # 型変換について
///
/// `data_type`フィールドにより型情報を保持し、
/// アプリケーション側で適切な型変換を行う設計です。
///
/// # 使用例
///
/// ```rust
/// let setting = Setting {
///     id: "setting_theme".to_string(),
///     key: "ui.theme".to_string(),
///     value: "dark".to_string(),
///     data_type: "string".to_string(),
///     created_at: "2023-12-01T10:30:00Z".to_string(),
///     updated_at: "2023-12-01T10:30:00Z".to_string(),
/// };
/// ```
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Setting {
    /// 設定項目の一意識別子
    pub id: String,
    /// 設定キー（ドット記法推奨："ui.theme", "notification.email"等）
    pub key: String,
    /// 設定値（文字列として保存、型変換は利用側で実施）
    pub value: String,
    /// 値の型情報（"string", "number", "boolean", "json"等）
    pub data_type: String,
    /// 設定作成日時（文字列形式）
    pub created_at: String,
    /// 最終更新日時（文字列形式）
    pub updated_at: String,
}

/// ビューアイテム設定構造体
///
/// タスク表示ビューの個別アイテム設定を管理します。
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ViewItem {
    /// ビューアイテムのID
    pub id: String,
    /// 表示ラベル
    pub label: String,
    /// アイコン
    pub icon: String,
    /// 表示/非表示フラグ
    pub visible: bool,
    /// 表示順序
    pub order: i32,
}

/// カスタム日付フォーマット構造体
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CustomDateFormat {
    /// フォーマットID
    pub id: String,
    /// フォーマット名
    pub name: String,
    /// フォーマット文字列
    pub format: String,
}

/// 時刻ラベル構造体
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TimeLabel {
    /// ラベルID
    pub id: String,
    /// ラベル名
    pub name: String,
    /// 時刻（HH:mm形式）
    pub time: String,
}

/// 期日ボタン表示設定構造体
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct DueDateButtons {
    /// 期限切れ
    pub overdue: bool,
    /// 今日
    pub today: bool,
    /// 明日
    pub tomorrow: bool,
    /// 3日以内
    pub three_days: bool,
    /// 今週
    pub this_week: bool,
    /// 今月
    pub this_month: bool,
    /// 今四半期
    pub this_quarter: bool,
    /// 今年
    pub this_year: bool,
    /// 年末
    pub this_year_end: bool,
}

/// 統合設定構造体（フラット構造）
///
/// アプリケーションの全設定項目を単一の構造体で管理します。
/// フロントエンドのSettings型に対応しています。
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Settings {
    /// 設定ID（通常は固定値"app_settings"）
    pub id: crate::types::id_types::SettingsId,
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
    /// 日付フォーマット
    pub date_format: String,
    /// カスタム期日日数
    pub custom_due_days: Vec<i32>,
    /// カスタム日付フォーマット
    pub custom_date_formats: Vec<CustomDateFormat>,
    /// 時刻ラベル
    pub time_labels: Vec<TimeLabel>,

    // 表示設定
    /// 期日ボタンの表示設定
    pub due_date_buttons: DueDateButtons,
    /// ビューアイテム設定
    pub view_items: Vec<ViewItem>,

    // アカウント設定
    /// 選択中のアカウント
    pub selected_account: String,
    /// アカウントアイコン
    pub account_icon: Option<String>,
    /// アカウント名
    pub account_name: String,
    /// メールアドレス
    pub email: String,
    /// パスワード
    pub password: String,
    /// サーバーURL
    pub server_url: String,
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            id: crate::types::id_types::SettingsId::from("app_settings"),
            theme: "system".to_string(),
            language: "ja".to_string(),
            font: "system".to_string(),
            font_size: 14,
            font_color: "#000000".to_string(),
            background_color: "#FFFFFF".to_string(),
            week_start: "monday".to_string(),
            timezone: "Asia/Tokyo".to_string(),
            date_format: "YYYY-MM-DD".to_string(),
            custom_due_days: vec![1, 3, 7, 14, 30],
            custom_date_formats: vec![],
            time_labels: vec![],
            due_date_buttons: DueDateButtons::default(),
            view_items: vec![],
            selected_account: String::new(),
            account_icon: None,
            account_name: String::new(),
            email: String::new(),
            password: String::new(),
            server_url: String::new(),
        }
    }
}

/// 設定操作のレスポンス用構造体
///
/// 設定の取得・更新・削除操作の結果を統一的に返すための構造体です。
/// 成功・失敗の状態とともに、データやメッセージを含みます。
///
/// # フィールド
///
/// * `success` - 操作の成功・失敗フラグ
/// * `data` - 取得または更新された設定データ（操作に応じてOptional）
/// * `message` - エラー情報や追加メッセージ（Optional）
///
/// # 使用場面
///
/// - 設定取得APIのレスポンス
/// - 設定更新操作の結果通知
/// - エラーハンドリング用のメッセージ返却
#[derive(Debug, Serialize, Deserialize)]
pub struct SettingResponse {
    /// 操作の成功・失敗フラグ
    pub success: bool,
    /// 取得または更新された設定データ（操作に応じてOptional）
    pub data: Option<Setting>,
    /// エラー情報や追加メッセージ
    pub message: Option<String>,
}

impl CommandModelConverter<LocalSettingsCommand> for LocalSettings {
    async fn to_command_model(&self) -> Result<LocalSettingsCommand, String> {
        Ok(LocalSettingsCommand {
            theme: self.theme.clone(),
            language: self.language.clone(),
        })
    }
}

impl CommandModelConverter<SettingCommand> for Setting {
    async fn to_command_model(&self) -> Result<SettingCommand, String> {
        Ok(SettingCommand {
            id: self.id.clone(),
            key: self.key.clone(),
            value: self.value.clone(),
            data_type: self.data_type.clone(),
            created_at: self.created_at.clone(),
            updated_at: self.updated_at.clone(),
        })
    }
}
