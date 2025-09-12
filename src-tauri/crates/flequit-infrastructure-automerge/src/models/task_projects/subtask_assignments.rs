use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

/// SubtaskAssignment用Automergeエンティティ定義
///
/// サブタスクとユーザーの多対多関係を管理するAutoMergeデータ構造
/// 分散環境での同期とコンフリクト解決に対応
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct SubtaskAssignmentDocument {
    /// サブタスクID
    pub subtask_id: String,

    /// ユーザーID
    pub user_id: String,

    /// 作成日時
    pub created_at: DateTime<Utc>,
}

impl SubtaskAssignmentDocument {
    /// 新しいサブタスク割り当てドキュメントを作成
    pub fn new(subtask_id: String, user_id: String) -> Self {
        Self {
            subtask_id,
            user_id,
            created_at: chrono::Utc::now(),
        }
    }
}
