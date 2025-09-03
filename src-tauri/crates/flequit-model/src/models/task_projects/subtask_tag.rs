//! サブタスクタグ付け関係モデル
//!
//! このモジュールは、サブタスクとタグ間の関連付けを管理する
//! モデルを定義します。

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

use crate::types::id_types::{SubTaskId, TagId};

/// サブタスクとタグの関連付けを表現するモデル
///
/// サブタスクに対するタグの紐づけ関係を管理します。
/// 一つのサブタスクに複数のタグを関連付け可能（多対多の関係）
///
/// # フィールド
///
/// * `subtask_id` - タグ付け対象のサブタスクID
/// * `tag_id` - 関連付けるタグID
/// * `created_at` - タグ付け作成日時
///
/// # 使用例
///
/// ```rust,no_run
/// # use flequit_model::models::subtask_tag::SubtaskTag;
/// # use flequit_model::types::id_types::{SubTaskId, TagId};
/// # use chrono::Utc;
///
/// let subtask_tag = SubtaskTag {
///     subtask_id: SubTaskId::from("subtask_123".to_string()),
///     tag_id: TagId::from("tag_456".to_string()),
///     created_at: Utc::now(),
/// };
/// ```
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct SubTaskTag {
    /// タグ付け対象のサブタスクID
    pub subtask_id: SubTaskId,
    /// 関連付けるタグID
    pub tag_id: TagId,
    /// タグ付け作成日時
    pub created_at: DateTime<Utc>,
}
