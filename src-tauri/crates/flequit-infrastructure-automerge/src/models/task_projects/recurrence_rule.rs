use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

/// RecurrenceRule用Automergeエンティティ定義
///
/// 繰り返しルールのAutoMergeデータ構造
/// 分散環境での同期とコンフリクト解決に対応
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct RecurrenceRuleDocument {
    /// 繰り返しルールID
    pub id: String,

    /// ルール名
    pub name: String,

    /// パターン（daily、weekly、monthly など）
    pub pattern: String,

    /// 間隔
    pub interval: i32,

    /// 開始日
    pub start_date: Option<DateTime<Utc>>,

    /// 終了日
    pub end_date: Option<DateTime<Utc>>,

    /// 最大繰り返し回数
    pub max_occurrences: Option<i32>,

    /// アクティブ状態
    pub is_active: bool,

    /// 作成日時
    pub created_at: DateTime<Utc>,

    /// 更新日時
    pub updated_at: DateTime<Utc>,
}

impl RecurrenceRuleDocument {
    /// 新しい繰り返しルールドキュメントを作成
    pub fn new(id: String, name: String, pattern: String, interval: i32) -> Self {
        let now = chrono::Utc::now();
        Self {
            id,
            name,
            pattern,
            interval,
            start_date: None,
            end_date: None,
            max_occurrences: None,
            is_active: true,
            created_at: now,
            updated_at: now,
        }
    }
}
