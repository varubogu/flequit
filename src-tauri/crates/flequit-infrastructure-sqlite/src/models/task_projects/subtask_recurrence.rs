use chrono::{DateTime, Utc};
use flequit_model::models::task_projects::subtask_recurrence::SubTaskRecurrence;
use flequit_model::types::id_types::{ProjectId, RecurrenceRuleId, SubTaskId, UserId};
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};
use async_trait::async_trait;

use crate::models::{DomainToSqliteConverterWithProjectId, SqliteModelConverter};

/// SubTaskRecurrence用SQLiteエンティティ定義
///
/// サブタスクと繰り返しルールの関係を管理する紐づけテーブル
/// 繰り返しルールIDとの関連を管理
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "subtask_recurrence")]
pub struct Model {
    /// プロジェクトID（SQLite統合テーブル用）
    #[sea_orm(primary_key, auto_increment = false)]
    pub project_id: String,

    /// サブタスクID
    #[sea_orm(primary_key, auto_increment = false)]
    pub subtask_id: String,

    /// 繰り返しルールID（将来的にルールIDで管理する想定）
    #[sea_orm(primary_key, auto_increment = false)]
    pub recurrence_rule_id: String,

    /// 作成日時
    pub created_at: DateTime<Utc>,

    /// 最終更新日時
    pub updated_at: DateTime<Utc>,

    /// 論理削除フラグ
    #[sea_orm(indexed)]
    pub deleted: bool,

    /// 最終更新者のユーザーID
    pub updated_by: String,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}

#[async_trait]
impl SqliteModelConverter<SubTaskRecurrence> for Model {
    async fn to_domain_model(&self) -> Result<SubTaskRecurrence, String> {
        Ok(SubTaskRecurrence {
            subtask_id: SubTaskId::from(self.subtask_id.clone()),
            recurrence_rule_id: RecurrenceRuleId::from(self.recurrence_rule_id.clone()),
            created_at: self.created_at,
            updated_at: self.updated_at,
            deleted: self.deleted,
            updated_by: UserId::from(self.updated_by.clone()),
        })
    }
}

#[async_trait]
impl DomainToSqliteConverterWithProjectId<ActiveModel> for SubTaskRecurrence {
    async fn to_sqlite_model_with_project_id(
        &self,
        project_id: &ProjectId,
    ) -> Result<ActiveModel, String> {
        use sea_orm::ActiveValue::Set;
        Ok(ActiveModel {
            project_id: Set(project_id.to_string()),
            subtask_id: Set(self.subtask_id.to_string()),
            recurrence_rule_id: Set(self.recurrence_rule_id.to_string()),
            created_at: Set(self.created_at),
            updated_at: Set(self.updated_at),
            deleted: Set(self.deleted),
            updated_by: Set(self.updated_by.to_string()),
        })
    }
}
