use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

/// RecurrenceDaysOfWeek用Automergeエンティティ定義
///
/// 繰り返し曜日設定のAutoMergeデータ構造
/// 分散環境での同期とコンフリクト解決に対応
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct RecurrenceDaysOfWeekDocument {
    /// ID
    pub id: String,

    /// 繰り返しルールID
    pub recurrence_rule_id: String,

    /// 曜日（0:日曜日 〜 6:土曜日）
    pub day_of_week: i32,

    /// 週番号（第1週、第2週など。-1:最終週）
    pub week_number: Option<i32>,

    /// アクティブ状態
    pub is_active: bool,

    /// 作成日時
    pub created_at: DateTime<Utc>,

    /// 更新日時
    pub updated_at: DateTime<Utc>,
}

impl RecurrenceDaysOfWeekDocument {
    /// 新しい繰り返し曜日ドキュメントを作成
    pub fn new(id: String, recurrence_rule_id: String, day_of_week: i32) -> Self {
        let now = chrono::Utc::now();
        Self {
            id,
            recurrence_rule_id,
            day_of_week,
            week_number: None,
            is_active: true,
            created_at: now,
            updated_at: now,
        }
    }
}
