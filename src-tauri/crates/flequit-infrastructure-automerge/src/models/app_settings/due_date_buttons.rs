//! 期限日ボタン設定モデル用Automergeエンティティ

use chrono::{DateTime, Utc};
use flequit_model::models::app_settings::due_date_buttons::DueDateButtons;
use serde::{Deserialize, Serialize};

/// DueDateButtons用Automergeエンティティ
///
/// 期限日入力UIのボタン設定を管理する構造体のAutomerge版
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DueDateButtonsAutomerge {
    /// ボタンの一意識別子
    pub id: String,

    /// ボタンの表示名
    pub name: String,

    /// 表示/非表示フラグ
    pub is_visible: bool,

    /// 表示順序
    pub display_order: i32,

    /// 作成日時
    pub created_at: DateTime<Utc>,

    /// 更新日時
    pub updated_at: DateTime<Utc>,
}

impl DueDateButtonsAutomerge {
    /// ドメインモデルから変換
    pub fn from_domain(domain: DueDateButtons) -> Self {
        Self {
            id: domain.id,
            name: domain.name,
            is_visible: domain.is_visible,
            display_order: domain.display_order,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        }
    }

    /// ドメインモデルに変換
    pub fn to_domain(self) -> Result<DueDateButtons, String> {
        Ok(DueDateButtons {
            id: self.id,
            name: self.name,
            is_visible: self.is_visible,
            display_order: self.display_order,
        })
    }
}