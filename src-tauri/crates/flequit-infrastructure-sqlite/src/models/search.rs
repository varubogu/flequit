//! 検索モデル用SQLiteエンティティ

use serde::{Deserialize, Serialize};

/// 検索パラメータのプレースホルダー
///
/// 実際の検索機能は各種リポジトリで実装されます
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Search {
    /// 検索クエリ（将来実装予定）
    pub query: String,
}
