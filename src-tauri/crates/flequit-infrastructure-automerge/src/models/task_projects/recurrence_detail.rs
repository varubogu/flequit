use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

/// RecurrenceDetail用Automergeエンティティ定義
///
/// 繰り返し詳細設定のAutoMergeデータ構造
/// 分散環境での同期とコンフリクト解決に対応
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct RecurrenceDetailDocument {
    /// 詳細ID
    pub id: String,

    /// 繰り返しルールID
    pub recurrence_rule_id: String,

    /// 詳細タイプ（weekly_days, monthly_day, yearly_date など）
    pub detail_type: String,

    /// 詳細値（JSON形式）
    pub detail_value: String,

    /// ソート順序
    pub sort_order: i32,

    /// アクティブ状態
    pub is_active: bool,

    /// 作成日時
    pub created_at: DateTime<Utc>,

    /// 更新日時
    pub updated_at: DateTime<Utc>,
}

impl RecurrenceDetailDocument {
    /// 新しい繰り返し詳細ドキュメントを作成
    pub fn new(
        id: String,
        recurrence_rule_id: String,
        detail_type: String,
        detail_value: String,
        sort_order: i32,
    ) -> Self {
        let now = chrono::Utc::now();
        Self {
            id,
            recurrence_rule_id,
            detail_type,
            detail_value,
            sort_order,
            is_active: true,
            created_at: now,
            updated_at: now,
        }
    }
}
