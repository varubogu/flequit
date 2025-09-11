//! 期日ボタン設定モデル

use serde::{Deserialize, Serialize};

/// 期日ボタン設定構造体
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct DueDateButtons {
    /// ボタンID
    pub id: String,
    /// ボタン表示名
    pub name: String,
    /// 表示/非表示フラグ
    pub is_visible: bool,
    /// 表示順序
    pub display_order: i32,
}

impl DueDateButtons {
    pub fn new(id: String, name: String, is_visible: bool, display_order: i32) -> Self {
        Self {
            id,
            name,
            is_visible,
            display_order,
        }
    }

    pub fn with_default_visibility(id: String, name: String, display_order: i32) -> Self {
        Self::new(id, name, true, display_order)
    }
}

impl Default for DueDateButtons {
    fn default() -> Self {
        Self {
            id: String::new(),
            name: String::new(),
            is_visible: true,
            display_order: 0,
        }
    }
}