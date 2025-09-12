use chrono::{DateTime, Utc};
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

/// RecurrenceDateCondition用SQLiteエンティティ定義
///
/// 日付に基づく条件を管理するテーブル
/// 特定の基準日に対する相対的な関係性を定義
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "recurrence_date_conditions")]
pub struct Model {
    /// 条件の一意識別子
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: String,

    /// 繰り返し調整ID（adjustment経由の場合）
    pub recurrence_adjustment_id: Option<String>,

    /// 繰り返し詳細ID（detail経由の場合）
    pub recurrence_detail_id: Option<String>,

    /// 基準日との関係性（before, after, same等の文字列形式）
    pub relation: String,

    /// 比較基準となる日付
    pub reference_date: DateTime<Utc>,

    /// 作成日時
    pub created_at: DateTime<Utc>,

    /// 更新日時
    pub updated_at: DateTime<Utc>,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::recurrence_adjustment::Entity",
        from = "Column::RecurrenceAdjustmentId",
        to = "super::recurrence_adjustment::Column::Id"
    )]
    RecurrenceAdjustment,
    #[sea_orm(
        belongs_to = "super::recurrence_detail::Entity",
        from = "Column::RecurrenceDetailId",
        to = "super::recurrence_detail::Column::RecurrenceRuleId"
    )]
    RecurrenceDetail,
}

impl Related<super::recurrence_adjustment::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::RecurrenceAdjustment.def()
    }
}

impl Related<super::recurrence_detail::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::RecurrenceDetail.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
