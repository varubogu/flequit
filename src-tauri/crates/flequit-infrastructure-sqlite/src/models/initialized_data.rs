//! 初期化データモデル用SQLiteエンティティ

use serde::{Deserialize, Serialize};

/// 初期化データのプレースホルダー
/// 
/// アプリケーション初期化時に必要なデータを管理します
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InitializedData {
    /// 設定情報（将来実装予定）
    pub settings: String,
    /// アカウント情報（将来実装予定）  
    pub accounts: Vec<String>,
    /// プロジェクト情報（将来実装予定）
    pub projects: Vec<String>,
}