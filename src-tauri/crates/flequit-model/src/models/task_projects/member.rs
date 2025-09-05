use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};
use crate::types::id_types::{MemberId, UserId};
use crate::types::project_types::MemberRole;

/// プロジェクトメンバー情報を表現する構造体
///
/// ユーザーとプロジェクト間のN:N関係を管理し、
/// 各メンバーの役割と参加日時を記録します。
///
/// # フィールド
///
/// * `user_id` - メンバーのユーザーID
/// * `project_id` - 所属プロジェクトID
/// * `role` - プロジェクト内での役割（Owner、Member等）
/// * `joined_at` - プロジェクト参加日時
///
/// # 役割について
///
/// `role`フィールドは[`MemberRole`]enumを使用し、以下の権限管理を行います：
/// - Owner: プロジェクトの全権限
/// - Admin: メンバー管理とプロジェクト設定
/// - Member: タスク作成・編集
/// - Viewer: 読み取り専用
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Member {
    /// メンバーID
    pub id: MemberId,
    /// メンバーのユーザーID
    pub user_id: UserId,
    /// プロジェクト内での役割（Owner、Member等）
    pub role: MemberRole,
    /// プロジェクト参加日時
    pub joined_at: DateTime<Utc>,
    /// 最終更新日時
    pub updated_at: DateTime<Utc>,
}
