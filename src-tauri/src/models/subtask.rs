use crate::models::recurrence_rule::RecurrenceRuleCommandModel;
use crate::models::CommandModelConverter;
use async_trait::async_trait;
use chrono::{DateTime, Utc};
use flequit_model::models::task_projects::subtask::{SubTask, SubTaskTree};
use flequit_model::models::ModelConverter;
use flequit_model::types::id_types::SubTaskId;
use flequit_model::types::id_types::{TagId, TaskId, UserId};
use flequit_model::types::task_types::TaskStatus;
use serde::{Deserialize, Serialize};

/// Tauriコマンド引数用のSubtask構造体（日時フィールドはString）
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SubtaskCommandModel {
    pub id: String,
    pub task_id: String,
    pub title: String,
    pub description: Option<String>,
    pub status: TaskStatus,
    pub priority: Option<i32>,
    pub plan_start_date: Option<String>,
    pub plan_end_date: Option<String>,
    pub do_start_date: Option<String>,
    pub do_end_date: Option<String>,
    pub is_range_date: Option<bool>,
    pub recurrence_rule: Option<RecurrenceRuleCommandModel>,
    pub assigned_user_ids: Vec<String>,
    pub tag_ids: Vec<String>,
    pub order_index: i32,
    pub completed: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[async_trait]
impl ModelConverter<SubTask> for SubtaskCommandModel {
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

        let start_date = if let Some(ref date_str) = self.plan_start_date {
            Some(
                date_str
                    .parse::<DateTime<Utc>>()
                    .map_err(|e| format!("Invalid start_date format: {}", e))?,
            )
        } else {
            None
        };

        let end_date = if let Some(ref date_str) = self.plan_end_date {
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

        Ok(SubTask {
            id: SubTaskId::from(self.id.clone()),
            task_id: TaskId::from(self.task_id.clone()),
            title: self.title.clone(),
            description: self.description.clone(),
            status: self.status.clone(),
            priority: self.priority,
            plan_start_date: start_date,
            plan_end_date: end_date,
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
            completed: self.completed,
            created_at,
            updated_at,
        })
    }
}

#[async_trait]
impl CommandModelConverter<SubtaskCommandModel> for SubTask {
    /// ドメインモデル（SubTask）からコマンドモデル（SubtaskCommand）に変換
    async fn to_command_model(&self) -> Result<SubtaskCommandModel, String> {
        Ok(SubtaskCommandModel {
            id: self.id.to_string(),
            task_id: self.task_id.to_string(),
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
            completed: self.completed,
            created_at: self.created_at.to_rfc3339(),
            updated_at: self.updated_at.to_rfc3339(),
        })
    }
}

/// Tauriコマンド戻り値用のSubTaskTree構造体（日時フィールドはString、階層構造含む）
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SubTaskTreeCommandModel {
    pub id: String,
    pub task_id: String,
    pub title: String,
    pub description: Option<String>,
    pub status: TaskStatus,
    pub priority: Option<i32>,
    pub plan_start_date: Option<String>,
    pub plan_end_date: Option<String>,
    pub do_start_date: Option<String>,
    pub do_end_date: Option<String>,
    pub is_range_date: Option<bool>,
    pub recurrence_rule: Option<RecurrenceRuleCommandModel>,
    pub assigned_user_ids: Vec<String>,
    pub order_index: i32,
    pub completed: bool,
    pub created_at: String,
    pub updated_at: String,
    pub tags: Vec<super::tag::TagCommandModel>,
}

impl SubTaskTreeCommandModel {
    /// ドメインモデル（SubTaskTree）からコマンドモデル（SubTaskTreeCommand）に変換
    pub async fn from_domain_model(
        subtask: &SubTaskTree,
    ) -> Result<SubTaskTreeCommandModel, String> {
        let mut tag_commands = Vec::new();
        for tag in &subtask.tags {
            tag_commands.push(tag.to_command_model().await?);
        }

        Ok(SubTaskTreeCommandModel {
            id: subtask.id.to_string(),
            task_id: subtask.task_id.to_string(),
            title: subtask.title.clone(),
            description: subtask.description.clone(),
            status: subtask.status.clone(),
            priority: subtask.priority,
            plan_start_date: subtask.plan_start_date.as_ref().map(|d| d.to_rfc3339()),
            plan_end_date: subtask.plan_end_date.as_ref().map(|d| d.to_rfc3339()),
            do_start_date: subtask.do_start_date.as_ref().map(|d| d.to_rfc3339()),
            do_end_date: subtask.do_end_date.as_ref().map(|d| d.to_rfc3339()),
            is_range_date: subtask.is_range_date,
            recurrence_rule: if let Some(ref rule) = subtask.recurrence_rule {
                Some(rule.to_command_model().await?)
            } else {
                None
            },
            assigned_user_ids: subtask
                .assigned_user_ids
                .iter()
                .map(|id| id.to_string())
                .collect(),
            order_index: subtask.order_index,
            completed: subtask.completed,
            created_at: subtask.created_at.to_rfc3339(),
            updated_at: subtask.updated_at.to_rfc3339(),
            tags: tag_commands,
        })
    }
}

#[async_trait]
impl ModelConverter<SubTaskTree> for SubTaskTreeCommandModel {
    /// コマンド引数用（SubTaskTreeCommand）から内部モデル（SubTaskTree）に変換
    async fn to_model(&self) -> Result<SubTaskTree, String> {
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

        let mut tags = Vec::new();
        for tag in &self.tags {
            tags.push(tag.to_model().await?);
        }

        Ok(SubTaskTree {
            id: SubTaskId::from(self.id.clone()),
            task_id: TaskId::from(self.task_id.clone()),
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
            order_index: self.order_index,
            completed: self.completed,
            created_at,
            updated_at,
            assigned_user_ids: self
                .assigned_user_ids
                .iter()
                .map(|id| UserId::from(id.clone()))
                .collect(),
            tags,
        })
    }
}

#[async_trait]
impl CommandModelConverter<SubTaskTreeCommandModel> for SubTaskTree {
    async fn to_command_model(&self) -> Result<SubTaskTreeCommandModel, String> {
        let mut tag_commands = Vec::new();
        for tag in &self.tags {
            tag_commands.push(tag.to_command_model().await?);
        }

        Ok(SubTaskTreeCommandModel {
            id: self.id.to_string(),
            task_id: self.task_id.to_string(),
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
            completed: self.completed,
            created_at: self.created_at.to_rfc3339(),
            updated_at: self.updated_at.to_rfc3339(),
            tags: tag_commands,
        })
    }
}
