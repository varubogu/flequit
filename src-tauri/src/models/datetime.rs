//! 日時関連コマンドモデル
//!
//! このモジュールは日時フォーマット、カスタム日時フォーマット、
//! 日付条件、曜日条件のTauriコマンドモデルを定義します。

use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};

/// 日時フォーマットコマンド
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DateTimeFormatCommandModel {
    /// フォーマットID
    pub id: String,
    /// フォーマット表示名
    pub name: String,
    /// フォーマット文字列（chrono形式）
    pub format: String,
    /// フォーマットグループ
    pub group: String,
    /// 表示順序
    pub order: i32,
}

/// カスタム日時フォーマットコマンド
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CustomDateTimeFormatCommandModel {
    /// カスタムフォーマットID（UUID）
    pub id: String,
    /// ユーザー定義表示名
    pub name: String,
    /// chrono形式の日時フォーマット文字列
    pub format: String,
    /// フォーマットグループ　
    pub group: String,
    /// 表示順序
    pub order: i32,
}

/// 日付条件コマンド
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DateConditionCommandModel {
    /// 条件ID
    pub id: String,
    /// 基準日との関係性（"before", "after", "same"等）
    pub relation: String,
    /// 比較基準となる日付
    pub reference_date: DateTime<Utc>,
}

/// 曜日条件コマンド
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WeekdayConditionCommandModel {
    /// 条件ID
    pub id: String,
    /// 曜日リスト（日=0, 月=1, ..., 土=6）
    pub weekdays: Vec<u8>,
    /// 条件タイプ（"include", "exclude"等）
    pub condition_type: String,
    /// 条件説明
    pub description: Option<String>,
}
