//! 日付条件モデル用SQLiteエンティティ

use async_trait::async_trait;
use chrono::{DateTime, Utc};
use flequit_model::{
    models::task_projects::date_condition::DateCondition,
    types::{
        datetime_calendar_types::DateRelation,
        id_types::{DateConditionId, ProjectId, UserId},
    },
};
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

use crate::models::{DomainToSqliteConverterWithProjectId, SqliteModelConverter};

/// DateCondition用SQLiteエンティティ定義
///
/// 日付に基づく条件を表現する構造体のSQLite版
/// 繰り返しルールの適用条件や調整条件として使用されます
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "date_conditions")]
pub struct Model {
    /// プロジェクトID（SQLite統合テーブル用）
    #[sea_orm(primary_key, auto_increment = false)]
    pub project_id: String,

    /// 条件の一意識別子
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: String,

    /// 基準日との関係性（前、後、同じ等）
    #[sea_orm(indexed)]
    pub relation: String,

    /// 比較基準となる日付
    #[sea_orm(indexed)]
    pub reference_date: DateTime<Utc>,

    /// 作成日時
    pub created_at: DateTime<Utc>,

    /// 更新日時
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
impl SqliteModelConverter<DateCondition> for Model {
    async fn to_domain_model(&self) -> Result<DateCondition, String> {
        let relation = match self.relation.as_str() {
            "before" => DateRelation::Before,
            "on_or_before" => DateRelation::OnOrBefore,
            "same" => DateRelation::Same,
            "on_or_after" => DateRelation::OnOrAfter,
            "after" => DateRelation::After,
            _ => return Err(format!("Unknown relation: {}", self.relation)),
        };

        Ok(DateCondition {
            id: DateConditionId::from(self.id.clone()),
            relation,
            reference_date: self.reference_date,
            created_at: self.created_at,
            updated_at: self.updated_at,
            deleted: self.deleted,
            updated_by: UserId::from(self.updated_by.clone()),
        })
    }
}

#[async_trait]
impl DomainToSqliteConverterWithProjectId<Model> for DateCondition {
    async fn to_sqlite_model_with_project_id(
        &self,
        project_id: &ProjectId,
    ) -> Result<Model, String> {
        let relation_str = match self.relation {
            DateRelation::Before => "before",
            DateRelation::OnOrBefore => "on_or_before",
            DateRelation::Same => "same",
            DateRelation::OnOrAfter => "on_or_after",
            DateRelation::After => "after",
        };

        Ok(Model {
            id: self.id.to_string(),
            project_id: project_id.to_string(),
            relation: relation_str.to_string(),
            reference_date: self.reference_date,
            created_at: self.created_at,
            updated_at: self.updated_at,
            deleted: self.deleted,
            updated_by: self.updated_by.to_string(),
        })
    }
}
