//! 日時関連コマンドモデル
//!
//! このモジュールは日時フォーマット、カスタム日時フォーマット、
//! 日付条件、曜日条件のTauriコマンドモデルを定義します。

use serde::{Deserialize, Serialize};

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
