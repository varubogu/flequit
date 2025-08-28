//! タスク管理に関連する型を定義します。
use serde::{Deserialize, Serialize};

/// タスクの状態を示します。
/// Svelte側の状態と一致するように定義されています。
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Default)]
#[serde(rename_all = "snake_case")]
pub enum TaskStatus {
    /// 未着手
    #[default]
    NotStarted,
    /// 実行中
    InProgress,
    /// 待機中
    Waiting,
    /// 完了
    Completed,
    /// 中止
    Cancelled,
}
