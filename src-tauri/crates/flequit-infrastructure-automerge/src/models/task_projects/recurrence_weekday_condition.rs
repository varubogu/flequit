use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

/// RecurrenceWeekdayCondition用Automergeエンティティ定義
///
/// 繰り返し平日条件のAutoMergeデータ構造
/// 分散環境での同期とコンフリクト解決に対応
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct RecurrenceWeekdayConditionDocument {
    /// 繰り返しルールID
    pub recurrence_rule_id: String,

    /// 平日条件ID
    pub weekday_condition_id: String,

    /// 作成日時
    pub created_at: DateTime<Utc>,
}

impl RecurrenceWeekdayConditionDocument {
    /// 新しい繰り返し平日条件ドキュメントを作成
    pub fn new(recurrence_rule_id: String, weekday_condition_id: String) -> Self {
        Self {
            recurrence_rule_id,
            weekday_condition_id,
            created_at: chrono::Utc::now(),
        }
    }
}