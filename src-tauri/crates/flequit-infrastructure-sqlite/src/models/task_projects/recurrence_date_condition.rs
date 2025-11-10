use chrono::{DateTime, Utc};
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

/// RecurrenceDateCondition用SQLiteエンティティ定義
///
/// 日付に基づく条件を管理するテーブル
/// 「この日付より前」「この日付以降」などの日付条件を定義
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "recurrence_date_conditions")]
pub struct Model {
    /// プロジェクトID（SQLite統合テーブル用）
    #[sea_orm(primary_key, auto_increment = false)]
    pub project_id: String,

    /// 条件の一意識別子
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: String,

    /// 繰り返し調整ID（nullの場合は詳細条件）
    pub recurrence_adjustment_id: Option<String>,

    /// 繰り返し詳細ID（nullの場合は調整条件）
    pub recurrence_detail_id: Option<String>,

    /// 日付の関係（before, on_or_before, same, on_or_after, after）
    pub relation: String,

    /// 基準日付
    pub reference_date: DateTime<Utc>,

    /// 作成日時
    pub created_at: DateTime<Utc>,

    /// 更新日時
    pub updated_at: DateTime<Utc>,

    /// 最終更新者のユーザーID
    pub updated_by: String,

    /// 論理削除フラグ
    #[sea_orm(indexed)]
    pub deleted: bool,
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
