use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

/// RecurrenceAdjustment用Automergeエンティティ定義
///
/// 繰り返し調整のAutoMergeデータ構造
/// 分散環境での同期とコンフリクト解決に対応
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct RecurrenceAdjustmentDocument {
    /// 調整ID
    pub id: String,

    /// 繰り返しルールID
    pub recurrence_rule_id: String,

    /// 調整対象日時
    pub target_date: DateTime<Utc>,

    /// 調整後日時
    pub adjusted_date: Option<DateTime<Utc>>,

    /// 調整タイプ（skip, reschedule, cancel など）
    pub adjustment_type: String,

    /// 調整理由
    pub reason: Option<String>,

    /// アクティブ状態
    pub is_active: bool,

    /// 作成日時
    pub created_at: DateTime<Utc>,

    /// 更新日時
    pub updated_at: DateTime<Utc>,
}

impl RecurrenceAdjustmentDocument {
    /// 新しい繰り返し調整ドキュメントを作成
    pub fn new(
        id: String,
        recurrence_rule_id: String,
        target_date: DateTime<Utc>,
        adjustment_type: String,
    ) -> Self {
        let now = chrono::Utc::now();
        Self {
            id,
            recurrence_rule_id,
            target_date,
            adjusted_date: None,
            adjustment_type,
            reason: None,
            is_active: true,
            created_at: now,
            updated_at: now,
        }
    }
}