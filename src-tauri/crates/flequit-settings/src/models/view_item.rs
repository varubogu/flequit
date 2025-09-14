//! ビューアイテム設定モデル
//!
//! このモジュールはタスク表示ビューのアイテム設定を管理する構造体を定義します。

use partially::Partial;
use serde::{Deserialize, Serialize};

/// ビューアイテム設定構造体
///
/// タスク表示ビューの個別アイテム設定を管理します。
#[derive(Debug, Clone, Serialize, Deserialize, Partial)]
#[partially(derive(Debug, Clone, Serialize, Deserialize, Default))]
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
