use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

/// TaskRecurrence用Automergeエンティティ定義
///
/// タスク繰り返し設定のAutoMergeデータ構造
/// 分散環境での同期とコンフリクト解決に対応
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct TaskRecurrenceDocument {
    /// タスクID
    pub task_id: String,

    /// 繰り返しルールID
    pub recurrence_rule_id: String,

    /// 作成日時
    pub created_at: DateTime<Utc>,
}

impl TaskRecurrenceDocument {
    /// 新しいタスク繰り返しドキュメントを作成
    pub fn new(task_id: String, recurrence_rule_id: String) -> Self {
        Self {
            task_id,
            recurrence_rule_id,
            created_at: chrono::Utc::now(),
        }
    }
}
