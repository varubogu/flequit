//! 日付条件モデル用Automergeエンティティ

use chrono::{DateTime, Utc};
use flequit_model::{models::task_projects::date_condition::DateCondition, types::datetime_calendar_types::DateRelation};
use serde::{Deserialize, Serialize};

/// DateCondition用Automergeエンティティ
///
/// 日付に基づく条件を表現する構造体のAutomerge版
/// 繰り返しルールの適用条件や調整条件として使用されます
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DateConditionAutomerge {
    /// 条件の一意識別子
    pub id: String,

    /// 基準日との関係性（前、後、同じ等）
    pub relation: String,

    /// 比較基準となる日付
    pub reference_date: DateTime<Utc>,

    /// 作成日時
    pub created_at: DateTime<Utc>,

    /// 更新日時
    pub updated_at: DateTime<Utc>,
}

impl DateConditionAutomerge {
    /// ドメインモデルから変換
    pub fn from_domain(domain: DateCondition) -> Self {
        let relation_str = match domain.relation {
            DateRelation::Before => "before",
            DateRelation::OnOrBefore => "on_or_before",
            DateRelation::Same => "same",
            DateRelation::OnOrAfter => "on_or_after",
            DateRelation::After => "after",
        };

        Self {
            id: domain.id.to_string(),
            relation: relation_str.to_string(),
            reference_date: domain.reference_date,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        }
    }

    /// ドメインモデルに変換
    pub fn to_domain(self) -> Result<DateCondition, String> {
        let relation = match self.relation.as_str() {
            "before" => DateRelation::Before,
            "on_or_before" => DateRelation::OnOrBefore,
            "same" => DateRelation::Same,
            "on_or_after" => DateRelation::OnOrAfter,
            "after" => DateRelation::After,
            _ => return Err(format!("Unknown relation: {}", self.relation)),
        };

        Ok(DateCondition {
            id: self.id.into(),
            relation,
            reference_date: self.reference_date,
        })
    }
}