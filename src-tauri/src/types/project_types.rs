//! プロジェクト管理に関連する型を定義します。
use serde::{Deserialize, Serialize};

/// プロジェクトの状態を示します。
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ProjectStatus {
    /// 計画中
    Planning,
    /// 進行中
    Active,
    /// 保留中
    OnHold,
    /// 完了
    Completed,
    /// アーカイブ済み
    Archived,
}

/// プロジェクトメンバーの役割を示します。
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum MemberRole {
    /// オーナー
    Owner,
    /// 管理者
    Admin,
    /// メンバー
    Member,
    /// 閲覧者
    Viewer,
}
