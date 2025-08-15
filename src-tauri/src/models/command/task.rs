use serde::{Serialize, Deserialize};
use crate::types::task_types::TaskStatus;
use crate::models::datetime_calendar::RecurrenceRule;

use crate::models::task::Task;
use crate::models::command::ModelConverter;

/// Tauriコマンド引数用のTask構造体（日時フィールドはString）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskCommand {
    pub id: String,
    pub sub_task_id: Option<String>,
    pub project_id: String,
    pub list_id: String,
    pub title: String,
    pub description: Option<String>,
    pub status: TaskStatus,
    pub priority: i32,
    pub start_date: Option<String>,
    pub end_date: Option<String>,
    pub is_range_date: Option<bool>,
    pub recurrence_rule: Option<RecurrenceRule>,
    pub assigned_user_ids: Vec<String>,
    pub tag_ids: Vec<String>,
    pub order_index: i32,
    pub is_archived: bool,
    pub created_at: String,
    pub updated_at: String,
}

impl ModelConverter<Task> for TaskCommand {
    /// コマンド引数用（TaskCommand）から内部モデル（Task）に変換
    async fn to_model(&self) -> Result<Task, String> {
        use chrono::{DateTime, Utc};

        let created_at = self.created_at.parse::<DateTime<Utc>>()
            .map_err(|e| format!("Invalid created_at format: {}", e))?;
        let updated_at = self.updated_at.parse::<DateTime<Utc>>()
            .map_err(|e| format!("Invalid updated_at format: {}", e))?;

        let start_date = if let Some(ref date_str) = self.start_date {
            Some(date_str.parse::<DateTime<Utc>>()
                .map_err(|e| format!("Invalid start_date format: {}", e))?)
        } else {
            None
        };

        let end_date = if let Some(ref date_str) = self.end_date {
            Some(date_str.parse::<DateTime<Utc>>()
                .map_err(|e| format!("Invalid end_date format: {}", e))?)
        } else {
            None
        };

        use crate::types::id_types::{TaskId, SubTaskId, ProjectId, TaskListId, UserId, TagId};
        
        Ok(crate::models::task::Task {
            id: TaskId::from(self.id.clone()),
            sub_task_id: self.sub_task_id.as_ref().map(|id| SubTaskId::from(id.clone())),
            project_id: ProjectId::from(self.project_id.clone()),
            list_id: TaskListId::from(self.list_id.clone()),
            title: self.title.clone(),
            description: self.description.clone(),
            status: self.status.clone(),
            priority: self.priority,
            start_date,
            end_date,
            is_range_date: self.is_range_date,
            recurrence_rule: self.recurrence_rule.clone(),
            assigned_user_ids: self.assigned_user_ids.iter().map(|id| UserId::from(id.clone())).collect(),
            tag_ids: self.tag_ids.iter().map(|id| TagId::from(id.clone())).collect(),
            order_index: self.order_index,
            is_archived: self.is_archived,
            created_at,
            updated_at,
        })
    }
}

/// Tauriコマンド引数用のTaskSearchRequest構造体
#[derive(Debug, Serialize, Deserialize)]
pub struct TaskSearchRequest {
    pub project_id: Option<String>,
    pub title: Option<String>,
    pub description: Option<String>,
    pub status: Option<TaskStatus>,
    pub assignee_id: Option<String>,
    pub priority_min: Option<i32>,
    pub priority_max: Option<i32>,
    pub tag_ids: Option<Vec<String>>,
    pub due_date_from: Option<String>,
    pub due_date_to: Option<String>,
    pub created_from: Option<String>,
    pub created_to: Option<String>,
    pub limit: Option<usize>,
    pub offset: Option<usize>,
}
