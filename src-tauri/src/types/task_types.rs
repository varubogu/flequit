use serde::{Deserialize, Serialize};
// TaskStatusをSvelte側に合わせて修正
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum TaskStatus {
    NotStarted,
    InProgress,
    Waiting,
    Completed,
    Cancelled,
}

