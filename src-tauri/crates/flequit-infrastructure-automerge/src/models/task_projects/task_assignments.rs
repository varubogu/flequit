use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

/// TaskAssignment用Automergeエンティティ定義
///
/// タスクとユーザーの多対多関係を管理するAutoMergeデータ構造
/// 分散環境での同期とコンフリクト解決に対応
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct TaskAssignmentDocument {
    /// タスクID
    pub task_id: String,

    /// ユーザーID
    pub user_id: String,

    /// 作成日時
    pub created_at: DateTime<Utc>,
}

impl TaskAssignmentDocument {
    /// 新しいタスク割り当てドキュメントを作成
    pub fn new(task_id: String, user_id: String) -> Self {
        Self {
            task_id,
            user_id,
            created_at: chrono::Utc::now(),
        }
    }
}