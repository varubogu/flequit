use crate::traits::Trackable;
use crate::types::id_types::{MemberId, UserId};
use crate::types::project_types::MemberRole;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

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
    /// 論理削除フラグ（Automerge同期用）
    pub deleted: bool,
    /// 最終更新者のユーザーID（必須、作成・更新・削除・復元すべての操作で記録）
    pub updated_by: UserId,
}

impl Trackable for Member {
    fn mark_created(&mut self, user_id: UserId, timestamp: DateTime<Utc>) {
        self.joined_at = timestamp;
        self.updated_at = timestamp;
        self.updated_by = user_id;
        self.deleted = false;
    }

    fn mark_updated(&mut self, user_id: UserId, timestamp: DateTime<Utc>) {
        self.updated_at = timestamp;
        self.updated_by = user_id;
    }

    fn mark_deleted(&mut self, user_id: UserId, timestamp: DateTime<Utc>) {
        self.deleted = true;
        self.updated_at = timestamp;
        self.updated_by = user_id;
    }

    fn mark_restored(&mut self, user_id: UserId, timestamp: DateTime<Utc>) {
        self.deleted = false;
        self.updated_at = timestamp;
        self.updated_by = user_id;
    }

    fn is_deleted(&self) -> bool {
        self.deleted
    }

    fn get_updated_by(&self) -> UserId {
        self.updated_by
    }

    fn get_created_at(&self) -> DateTime<Utc> {
        self.joined_at
    }

    fn get_updated_at(&self) -> DateTime<Utc> {
        self.updated_at
    }
}
