use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

/// SubtaskRecurrence用Automergeエンティティ定義
///
/// サブタスク繰り返し設定のAutoMergeデータ構造
/// 分散環境での同期とコンフリクト解決に対応
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct SubtaskRecurrenceDocument {
    /// サブタスクID
    pub subtask_id: String,

    /// 繰り返しルールID
    pub recurrence_rule_id: String,

    /// 作成日時
    pub created_at: DateTime<Utc>,
}

impl SubtaskRecurrenceDocument {
    /// 新しいサブタスク繰り返しドキュメントを作成
    pub fn new(subtask_id: String, recurrence_rule_id: String) -> Self {
        Self {
            subtask_id,
            recurrence_rule_id,
            created_at: chrono::Utc::now(),
        }
    }
}
