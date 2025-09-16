use chrono::{DateTime, Utc};
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};
use async_trait::async_trait;
use flequit_model::models::task_projects::task_recurrence::TaskRecurrence;
use flequit_model::types::id_types::{ProjectId, RecurrenceRuleId, TaskId};
use crate::models::{DomainToSqliteConverterWithProjectId, SqliteModelConverter};

/// TaskRecurrence用SQLiteエンティティ定義
///
/// タスクと繰り返しルールの関係を管理する紐づけテーブル
/// 繰り返しルールIDとの関連を管理
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "task_recurrence")]
pub struct Model {
    /// プロジェクトID（SQLite統合テーブル用）
    #[sea_orm(primary_key, auto_increment = false)]
    pub project_id: String,

    /// タスクID
    #[sea_orm(primary_key, auto_increment = false)]
    pub task_id: String,

    /// 繰り返しルールID（将来的にルールIDで管理する想定）
    #[sea_orm(primary_key, auto_increment = false)]
    pub recurrence_rule_id: String,

    /// 作成日時
    pub created_at: DateTime<Utc>,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::task::Entity",
        from = "Column::TaskId",
        to = "super::task::Column::Id"
    )]
    Task,
    #[sea_orm(
        belongs_to = "super::recurrence_rule::Entity",
        from = "Column::RecurrenceRuleId",
        to = "super::recurrence_rule::Column::Id"
    )]
    RecurrenceRule,
}

impl Related<super::task::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Task.def()
    }
}

impl Related<super::recurrence_rule::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::RecurrenceRule.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}

#[async_trait]
impl SqliteModelConverter<TaskRecurrence> for Model {
    async fn to_domain_model(&self) -> Result<TaskRecurrence, String> {
        Ok(TaskRecurrence {
            task_id: TaskId::from(self.task_id.clone()),
            recurrence_rule_id: RecurrenceRuleId::from(self.recurrence_rule_id.clone()),
            created_at: self.created_at,
        })
    }
}

#[async_trait]
impl DomainToSqliteConverterWithProjectId<ActiveModel> for TaskRecurrence {
    async fn to_sqlite_model_with_project_id(
        &self,
        project_id: &ProjectId,
    ) -> Result<ActiveModel, String> {
        use sea_orm::ActiveValue::Set;
        Ok(ActiveModel {
            project_id: Set(project_id.to_string()),
            task_id: Set(self.task_id.to_string()),
            recurrence_rule_id: Set(self.recurrence_rule_id.to_string()),
            created_at: Set(self.created_at),
        })
    }
}
