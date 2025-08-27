use crate::models::command::ModelConverter;
use crate::models::datetime_calendar::RecurrenceRule;
use crate::models::subtask::SubTask;
use crate::types::task_types::TaskStatus;
use serde::{Deserialize, Serialize};

/// Tauriコマンド引数用のSubtask構造体（日時フィールドはString）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubtaskCommand {
    pub id: String,
    pub task_id: String,
    pub title: String,
    pub description: Option<String>,
    pub status: TaskStatus,
    pub priority: Option<i32>,
    pub start_date: Option<String>,
    pub end_date: Option<String>,
    pub is_range_date: Option<bool>,
    pub recurrence_rule: Option<RecurrenceRule>,
    pub assigned_user_ids: Vec<String>,
    pub tag_ids: Vec<String>,
    pub order_index: i32,
    pub completed: bool,
    pub created_at: String,
    pub updated_at: String,
}

impl ModelConverter<SubTask> for SubtaskCommand {
    /// コマンド引数用（SubtaskCommand）から内部モデル（Subtask）に変換
    async fn to_model(&self) -> Result<crate::models::subtask::SubTask, String> {
        use chrono::{DateTime, Utc};

        let created_at = self
            .created_at
            .parse::<DateTime<Utc>>()
            .map_err(|e| format!("Invalid created_at format: {}", e))?;
        let updated_at = self
            .updated_at
            .parse::<DateTime<Utc>>()
            .map_err(|e| format!("Invalid updated_at format: {}", e))?;

        let start_date = if let Some(ref date_str) = self.start_date {
            Some(
                date_str
                    .parse::<DateTime<Utc>>()
                    .map_err(|e| format!("Invalid start_date format: {}", e))?,
            )
        } else {
            None
        };

        let end_date = if let Some(ref date_str) = self.end_date {
            Some(
                date_str
                    .parse::<DateTime<Utc>>()
                    .map_err(|e| format!("Invalid end_date format: {}", e))?,
            )
        } else {
            None
        };

        use crate::types::id_types::{SubTaskId, TagId, TaskId, UserId};

        Ok(crate::models::subtask::SubTask {
            id: SubTaskId::from(self.id.clone()),
            task_id: TaskId::from(self.task_id.clone()),
            title: self.title.clone(),
            description: self.description.clone(),
            status: self.status.clone(),
            priority: self.priority,
            plan_start_date: start_date,
            plan_end_date: end_date,
            do_start_date: None,
            do_end_date: None,
            is_range_date: self.is_range_date,
            recurrence_rule: self.recurrence_rule.clone(),
            assigned_user_ids: self
                .assigned_user_ids
                .iter()
                .map(|id| UserId::from(id.clone()))
                .collect(),
            tag_ids: self
                .tag_ids
                .iter()
                .map(|id| TagId::from(id.clone()))
                .collect(),
            tags: vec![],
            order_index: self.order_index,
            completed: self.completed,
            created_at,
            updated_at,
        })
    }
}

/// Tauriコマンド戻り値用のSubTaskTree構造体（日時フィールドはString、階層構造含む）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubTaskTreeCommand {
    pub id: String,
    pub task_id: String,
    pub title: String,
    pub description: Option<String>,
    pub status: TaskStatus,
    pub priority: Option<i32>,
    pub start_date: Option<String>,
    pub end_date: Option<String>,
    pub is_range_date: Option<bool>,
    pub recurrence_rule: Option<RecurrenceRule>,
    pub assigned_user_ids: Vec<String>,
    pub order_index: i32,
    pub completed: bool,
    pub created_at: String,
    pub updated_at: String,
    pub tags: Vec<super::tag::TagCommand>,
}

/// Tauriコマンド引数用のSubtaskSearchRequest構造体
#[derive(Debug, Serialize, Deserialize)]
pub struct SubtaskSearchRequest {
    pub task_id: Option<String>,
    pub title: Option<String>,
    pub description: Option<String>,
    pub status: Option<TaskStatus>,
    pub completed: Option<bool>,
    pub created_from: Option<String>,
    pub created_to: Option<String>,
    pub limit: Option<usize>,
    pub offset: Option<usize>,
}
