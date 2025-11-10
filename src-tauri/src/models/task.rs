use crate::models::recurrence_rule::RecurrenceRuleCommandModel;
use async_trait::async_trait;
use chrono::{DateTime, Utc};
use flequit_model::models::task_projects::task::TaskTree;
use flequit_model::types::id_types::{ProjectId, TagId, TaskId, TaskListId, UserId};
use flequit_model::types::task_types::TaskStatus;
use serde::{Deserialize, Serialize};

use crate::models::CommandModelConverter;
use flequit_model::models::task_projects::task::Task;
use flequit_model::models::ModelConverter;
// TagのCommandModelConverter実装をimport

/// Tauriコマンド引数用のTask構造体（日時フィールドはString）
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TaskCommandModel {
    pub id: String,
    pub project_id: String,
    pub sub_task_id: Option<String>,
    pub list_id: String,
    pub title: String,
    pub description: Option<String>,
    pub status: TaskStatus,
    pub priority: i32,
    pub plan_start_date: Option<String>,
    pub plan_end_date: Option<String>,
    pub do_start_date: Option<String>,
    pub do_end_date: Option<String>,
    pub is_range_date: Option<bool>,
    pub recurrence_rule: Option<RecurrenceRuleCommandModel>,
    pub assigned_user_ids: Vec<String>,
    pub tag_ids: Vec<String>,
    pub order_index: i32,
    pub is_archived: bool,
    pub created_at: String,
    pub updated_at: String,
    pub deleted: bool,
    pub updated_by: String,
}

#[async_trait]
impl ModelConverter<Task> for TaskCommandModel {
    /// コマンド引数用（TaskCommand）から内部モデル（Task）に変換
    async fn to_model(&self) -> Result<Task, String> {
        let created_at = self
            .created_at
            .parse::<DateTime<Utc>>()
            .map_err(|e| format!("Invalid created_at format: {}", e))?;
        let updated_at = self
            .updated_at
            .parse::<DateTime<Utc>>()
            .map_err(|e| format!("Invalid updated_at format: {}", e))?;

        let plan_start_date = if let Some(ref date_str) = self.plan_start_date {
            Some(
                date_str
                    .parse::<DateTime<Utc>>()
                    .map_err(|e| format!("Invalid start_date format: {}", e))?,
            )
        } else {
            None
        };

        let plan_end_date = if let Some(ref date_str) = self.plan_end_date {
            Some(
                date_str
                    .parse::<DateTime<Utc>>()
                    .map_err(|e| format!("Invalid end_date format: {}", e))?,
            )
        } else {
            None
        };

        let do_start_date = if let Some(ref date_str) = self.do_start_date {
            Some(
                date_str
                    .parse::<DateTime<Utc>>()
                    .map_err(|e| format!("Invalid do_start_date format: {}", e))?,
            )
        } else {
            None
        };

        let do_end_date = if let Some(ref date_str) = self.do_end_date {
            Some(
                date_str
                    .parse::<DateTime<Utc>>()
                    .map_err(|e| format!("Invalid do_end_date format: {}", e))?,
            )
        } else {
            None
        };

        Ok(Task {
            id: TaskId::from(self.id.clone()),
            project_id: ProjectId::from(self.project_id.clone()),
            list_id: TaskListId::from(self.list_id.clone()),
            title: self.title.clone(),
            description: self.description.clone(),
            status: self.status.clone(),
            priority: self.priority,
            plan_start_date,
            plan_end_date,
            do_start_date,
            do_end_date,
            is_range_date: self.is_range_date,
            recurrence_rule: if let Some(ref rule) = self.recurrence_rule {
                Some(rule.to_model().await?)
            } else {
                None
            },
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
            order_index: self.order_index,
            is_archived: self.is_archived,
            created_at,
            updated_at,
            deleted: self.deleted,
            updated_by: UserId::from(self.updated_by.clone()),
        })
    }
}

/// Tauriコマンド戻り値用のTaskTree構造体（日時フィールドはString、階層構造含む）
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TaskTreeCommandModel {
    pub id: String,
    pub project_id: String,
    pub sub_task_id: Option<String>,
    pub list_id: String,
    pub title: String,
    pub description: Option<String>,
    pub status: TaskStatus,
    pub priority: i32,
    pub plan_start_date: Option<String>,
    pub plan_end_date: Option<String>,
    pub do_start_date: Option<String>,
    pub do_end_date: Option<String>,
    pub is_range_date: Option<bool>,
    pub recurrence_rule: Option<RecurrenceRuleCommandModel>,
    pub assigned_user_ids: Vec<String>,
    pub order_index: i32,
    pub is_archived: bool,
    pub created_at: String,
    pub updated_at: String,
    pub deleted: bool,
    pub updated_by: String,
    pub sub_tasks: Vec<super::subtask::SubTaskTreeCommandModel>,
    pub tag_ids: Vec<String>,
}

#[async_trait]
impl ModelConverter<TaskTree> for TaskTreeCommandModel {
    async fn to_model(&self) -> Result<TaskTree, String> {
        let created_at = self
            .created_at
            .parse::<DateTime<Utc>>()
            .map_err(|e| format!("Invalid created_at format: {}", e))?;

        let updated_at = self
            .updated_at
            .parse::<DateTime<Utc>>()
            .map_err(|e| format!("Invalid updated_at format: {}", e))?;

        let plan_start_date = if let Some(ref date_str) = self.plan_start_date {
            Some(
                date_str
                    .parse::<DateTime<Utc>>()
                    .map_err(|e| format!("Invalid plan_start_date format: {}", e))?,
            )
        } else {
            None
        };

        let plan_end_date = if let Some(ref date_str) = self.plan_end_date {
            Some(
                date_str
                    .parse::<DateTime<Utc>>()
                    .map_err(|e| format!("Invalid plan_end_date format: {}", e))?,
            )
        } else {
            None
        };

        let do_start_date = if let Some(ref date_str) = self.do_start_date {
            Some(
                date_str
                    .parse::<DateTime<Utc>>()
                    .map_err(|e| format!("Invalid do_start_date format: {}", e))?,
            )
        } else {
            None
        };

        let do_end_date = if let Some(ref date_str) = self.do_end_date {
            Some(
                date_str
                    .parse::<DateTime<Utc>>()
                    .map_err(|e| format!("Invalid do_end_date format: {}", e))?,
            )
        } else {
            None
        };

        let mut subtasks = Vec::new();
        for subtask in &self.sub_tasks {
            subtasks.push(subtask.to_model().await?);
        }

        Ok(TaskTree {
            id: TaskId::from(self.id.clone()),
            project_id: ProjectId::from(self.project_id.clone()),
            list_id: TaskListId::from(self.list_id.clone()),
            title: self.title.clone(),
            description: self.description.clone(),
            status: self.status.clone(),
            priority: self.priority,
            plan_start_date,
            plan_end_date,
            do_start_date,
            do_end_date,
            is_range_date: self.is_range_date,
            recurrence_rule: if let Some(ref rule) = self.recurrence_rule {
                Some(rule.to_model().await?)
            } else {
                None
            },
            assigned_user_ids: self
                .assigned_user_ids
                .iter()
                .map(|id| UserId::from(id.clone()))
                .collect(),
            order_index: self.order_index,
            is_archived: self.is_archived,
            created_at,
            updated_at,
            deleted: self.deleted,
            updated_by: UserId::from(self.updated_by.clone()),
            sub_tasks: subtasks,
            tag_ids: self
                .tag_ids
                .iter()
                .map(|id| TagId::from(id.clone()))
                .collect(),
        })
    }
}

#[async_trait]
impl CommandModelConverter<TaskTreeCommandModel> for TaskTree {
    /// ドメインモデル（TaskTree）からコマンドモデル（TaskTreeCommand）に変換
    async fn to_command_model(&self) -> Result<TaskTreeCommandModel, String> {
        let mut subtask_commands = Vec::new();
        for subtask in &self.sub_tasks {
            subtask_commands.push(subtask.to_command_model().await?);
        }

        Ok(TaskTreeCommandModel {
            id: self.id.to_string(),
            project_id: self.project_id.to_string(),
            sub_task_id: None, // TaskTreeにはsub_task_idがないため
            list_id: self.list_id.to_string(),
            title: self.title.clone(),
            description: self.description.clone(),
            status: self.status.clone(),
            priority: self.priority,
            plan_start_date: self.plan_start_date.as_ref().map(|d| d.to_rfc3339()),
            plan_end_date: self.plan_end_date.as_ref().map(|d| d.to_rfc3339()),
            do_start_date: self.do_start_date.as_ref().map(|d| d.to_rfc3339()),
            do_end_date: self.do_end_date.as_ref().map(|d| d.to_rfc3339()),
            is_range_date: self.is_range_date,
            recurrence_rule: if let Some(ref rule) = self.recurrence_rule {
                Some(rule.to_command_model().await?)
            } else {
                None
            },
            assigned_user_ids: self
                .assigned_user_ids
                .iter()
                .map(|id| id.to_string())
                .collect(),
            order_index: self.order_index,
            is_archived: self.is_archived,
            created_at: self.created_at.to_rfc3339(),
            updated_at: self.updated_at.to_rfc3339(),
            deleted: self.deleted,
            updated_by: self.updated_by.to_string(),
            sub_tasks: subtask_commands,
            tag_ids: self.tag_ids.iter().map(|id| id.to_string()).collect(),
        })
    }
}

#[async_trait]
impl CommandModelConverter<TaskCommandModel> for Task {
    /// ドメインモデル（Task）からコマンドモデル（TaskCommand）に変換
    async fn to_command_model(&self) -> Result<TaskCommandModel, String> {
        Ok(TaskCommandModel {
            id: self.id.to_string(),
            project_id: self.project_id.to_string(),
            sub_task_id: None, // Taskにはsub_task_idがないためNone
            list_id: self.list_id.to_string(),
            title: self.title.clone(),
            description: self.description.clone(),
            status: self.status.clone(),
            priority: self.priority,
            plan_start_date: self.plan_start_date.as_ref().map(|d| d.to_rfc3339()),
            plan_end_date: self.plan_end_date.as_ref().map(|d| d.to_rfc3339()),
            do_start_date: self.do_start_date.as_ref().map(|d| d.to_rfc3339()),
            do_end_date: self.do_end_date.as_ref().map(|d| d.to_rfc3339()),
            is_range_date: self.is_range_date,
            recurrence_rule: if let Some(ref rule) = self.recurrence_rule {
                Some(rule.to_command_model().await?)
            } else {
                None
            },
            assigned_user_ids: self
                .assigned_user_ids
                .iter()
                .map(|id| id.to_string())
                .collect(),
            tag_ids: self.tag_ids.iter().map(|id| id.to_string()).collect(),
            order_index: self.order_index,
            is_archived: self.is_archived,
            created_at: self.created_at.to_rfc3339(),
            updated_at: self.updated_at.to_rfc3339(),
            deleted: self.deleted,
            updated_by: self.updated_by.to_string(),
        })
    }
}
