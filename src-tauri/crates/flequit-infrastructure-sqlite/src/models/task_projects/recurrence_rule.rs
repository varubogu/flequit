use async_trait::async_trait;
use chrono::{DateTime, Utc};
use flequit_model::types::datetime_calendar_types::RecurrenceUnit;
use flequit_model::types::id_types::{ProjectId, UserId};
use flequit_model::{
    models::task_projects::recurrence_rule::RecurrenceRule, types::id_types::RecurrenceRuleId,
};
use sea_orm::{entity::prelude::*, Set};
use serde::{Deserialize, Serialize};

use crate::models::DomainToSqliteConverterWithProjectId;

use super::SqliteModelConverter;

/// RecurrenceRule用SQLiteエンティティ定義
///
/// 繰り返しルールの基本情報を管理するメインテーブル
/// 高速な検索・ソートに最適化
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "recurrence_rules")]
pub struct Model {
    /// プロジェクトID（SQLite統合テーブル用）
    #[sea_orm(primary_key, auto_increment = false)]
    pub project_id: String,

    /// 繰り返しルールの一意識別子
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: String,

    /// 繰り返し単位（day, week, month, year等の文字列形式）
    pub unit: String,

    /// 繰り返し間隔（2週毎なら2）
    pub interval: i32,

    /// 終了日（指定日まで繰り返し）
    pub end_date: Option<DateTime<Utc>>,

    /// 最大回数（指定回数まで繰り返し）
    pub max_occurrences: Option<i32>,

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
pub enum Relation {
    #[sea_orm(has_many = "super::recurrence_days_of_week::Entity")]
    DaysOfWeek,
    #[sea_orm(has_one = "super::recurrence_detail::Entity")]
    Details,
    #[sea_orm(has_one = "super::recurrence_adjustment::Entity")]
    Adjustment,
}

impl Related<super::recurrence_days_of_week::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::DaysOfWeek.def()
    }
}

impl Related<super::recurrence_detail::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Details.def()
    }
}

impl Related<super::recurrence_adjustment::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Adjustment.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}

/// SQLiteモデルからドメインモデルへの変換
#[async_trait]
impl SqliteModelConverter<RecurrenceRule> for Model {
    async fn to_domain_model(&self) -> Result<RecurrenceRule, String> {
        // 単位文字列をenumに変換
        let unit = match self.unit.as_str() {
            "minute" => RecurrenceUnit::Minute,
            "hour" => RecurrenceUnit::Hour,
            "day" => RecurrenceUnit::Day,
            "week" => RecurrenceUnit::Week,
            "month" => RecurrenceUnit::Month,
            "quarter" => RecurrenceUnit::Quarter,
            "half_year" => RecurrenceUnit::HalfYear,
            "year" => RecurrenceUnit::Year,
            _ => return Err(format!("Unknown recurrence unit: {}", self.unit)),
        };

        // 関連データは別途取得する想定（リポジトリ層で実装）
        // ここでは基本情報のみでドメインモデルを作成
        Ok(RecurrenceRule {
            id: RecurrenceRuleId::from(self.id.clone()),
            unit,
            interval: self.interval,
            days_of_week: None, // 紐づけテーブルから取得
            details: None,      // 関連テーブルから取得
            adjustment: None,   // 関連テーブルから取得
            end_date: self.end_date,
            max_occurrences: self.max_occurrences,
            created_at: self.created_at,
            updated_at: self.updated_at,
            deleted: self.deleted,
            updated_by: UserId::from(self.updated_by.clone()),
        })
    }
}

/// ドメインモデルからSQLiteモデルへの変換
#[async_trait]
impl DomainToSqliteConverterWithProjectId<ActiveModel> for RecurrenceRule {
    async fn to_sqlite_model_with_project_id(
        &self,
        project_id: &ProjectId,
    ) -> Result<ActiveModel, String> {
        // enumを文字列に変換
        let unit_string = match &self.unit {
            RecurrenceUnit::Minute => "minute",
            RecurrenceUnit::Hour => "hour",
            RecurrenceUnit::Day => "day",
            RecurrenceUnit::Week => "week",
            RecurrenceUnit::Month => "month",
            RecurrenceUnit::Quarter => "quarter",
            RecurrenceUnit::HalfYear => "half_year",
            RecurrenceUnit::Year => "year",
        }
        .to_string();

        // IDは呼び出し元で設定する想定
        let id = uuid::Uuid::new_v4().to_string();

        Ok(ActiveModel {
            id: Set(id),
            project_id: Set(project_id.to_string()),
            unit: Set(unit_string),
            interval: Set(self.interval),
            end_date: Set(self.end_date),
            max_occurrences: Set(self.max_occurrences),
            created_at: Set(self.created_at),
            updated_at: Set(self.updated_at),
            deleted: Set(self.deleted),
            updated_by: Set(self.updated_by.to_string()),
        })
    }
}
