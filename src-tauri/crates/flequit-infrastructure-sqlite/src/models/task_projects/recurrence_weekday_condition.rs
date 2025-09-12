use chrono::{DateTime, Utc};
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

/// RecurrenceWeekdayCondition用SQLiteエンティティ定義
///
/// 曜日に基づく条件調整を管理するテーブル
/// 指定された曜日に該当する場合の日付調整ルールを定義
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "recurrence_weekday_conditions")]
pub struct Model {
    /// 条件の一意識別子
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: String,

    /// 繰り返し調整ID
    pub recurrence_adjustment_id: String,

    /// 判定対象の曜日（monday, tuesday, ...等の文字列形式）
    pub if_weekday: String,

    /// 調整方向（previous, next, nearest等の文字列形式）
    pub then_direction: String,

    /// 調整対象（weekday, specific_weekday, days等の文字列形式）
    pub then_target: String,

    /// 調整先の曜日（target=specific_weekdayの場合）
    pub then_weekday: Option<String>,

    /// 調整日数（target=daysの場合）
    pub then_days: Option<i32>,

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
}

impl Related<super::recurrence_adjustment::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::RecurrenceAdjustment.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
