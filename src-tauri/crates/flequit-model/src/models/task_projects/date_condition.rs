//! 日付条件モデル
//!
//! このモジュールは日付に基づく条件を管理する構造体を定義します。

use crate::types::{datetime_calendar_types::DateRelation, id_types::DateConditionId};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

/// 日付に基づく条件を表現する構造体
///
/// 特定の基準日に対する相対的な関係性を定義し、
/// 繰り返しルールの適用条件や調整条件として使用されます。
///
/// # フィールド
///
/// * `id` - 条件の一意識別子
/// * `relation` - 基準日との関係性（前、後、同じ等）
/// * `reference_date` - 比較基準となる日付
///
/// # 使用例
///
/// ```rust,no_run
/// # use chrono::Utc;
/// # use flequit_model::models::date_condition::DateCondition;
/// # use flequit_model::types::datetime_calendar_types::DateRelation;
///
/// // 特定日以降の条件
/// let after_condition = DateCondition {
///     id: "after_new_year".to_string(),
///     relation: DateRelation::After,
///     reference_date: "2024-01-01T00:00:00Z".parse().unwrap(),
/// };
/// ```
///
/// # 使用場面
///
/// - 期間限定タスクの適用条件
/// - 季節的なタスクの開始・終了条件
/// - 祝日回避などの調整条件
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DateCondition {
    /// 条件の一意識別子
    pub id: DateConditionId,
    /// 基準日との関係性（前、後、同じ等）
    pub relation: DateRelation,
    /// 比較基準となる日付
    pub reference_date: DateTime<Utc>,
}
