//! 個別モデルコマンド
//!
//! このモジュールは個別モデルのTauriコマンドモデルを定義します。

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

/// アプリプリセットフォーマットコマンド
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppPresetFormatCommand {
    /// プリセットID
    pub id: String,
    /// プリセット名
    pub name: String,
    /// カテゴリ
    pub category: String,
    /// フォーマット文字列
    pub format_string: String,
    /// 表示順序
    pub sort_order: i32,
    /// 有効フラグ
    pub is_enabled: bool,
}

/// 期日ボタン設定コマンド
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DueDateButtonsCommand {
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

/// ローカル設定コマンド
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LocalSettingsCommand {
    /// UIテーマ設定
    pub theme: String,
    /// 表示言語設定
    pub language: String,
}

/// メンバーコマンド
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MemberCommand {
    /// メンバーID
    pub id: String,
    /// メンバー名
    pub name: String,
    /// メールアドレス
    pub email: Option<String>,
    /// 役割
    pub role: String,
    /// アクティブフラグ
    pub is_active: bool,
    /// 作成日時
    pub created_at: DateTime<Utc>,
    /// 更新日時
    pub updated_at: DateTime<Utc>,
}

/// 検索コマンド
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SearchCommand {
    /// 検索ID
    pub id: String,
    /// 検索クエリ
    pub query: String,
    /// 検索タイプ
    pub search_type: String,
    /// フィルター条件
    pub filters: Option<String>,
    /// ソート順序
    pub sort_order: Option<String>,
    /// 作成日時
    pub created_at: DateTime<Utc>,
}

/// 設定レスポンスコマンド
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SettingResponseCommand {
    /// レスポンスID
    pub id: String,
    /// 設定キー
    pub setting_key: String,
    /// 設定値
    pub setting_value: String,
    /// メタデータ
    pub metadata: Option<String>,
    /// ステータス
    pub status: String,
    /// 作成日時
    pub created_at: DateTime<Utc>,
}
