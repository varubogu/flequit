//! 時刻ラベルモデル
//!
//! このモジュールは時刻ラベルを管理する構造体を定義します。

use partially::Partial;
use serde::{Deserialize, Serialize};

/// 時刻ラベル構造体
#[derive(Debug, Clone, Serialize, Deserialize, Partial)]
#[partially(derive(Debug, Clone, Serialize, Deserialize, Default))]
pub struct TimeLabel {
    /// ラベルID
    pub id: String,
    /// ラベル名
    pub name: String,
    /// 時刻（HH:mm形式）
    pub time: String,
    /// 色
    pub color: String,
    /// 順番
    pub order: i32,
}
