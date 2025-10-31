//! プロジェクト管理モデル
//!
//! このモジュールはプロジェクトの構造とメンバー管理を定義する構造体を提供します。
//!
//! ## 概要
//!
//! プロジェクト管理では以下3つの主要構造体を提供：
//! - `Project`: 基本プロジェクト情報
//! - `ProjectMember`: プロジェクトメンバーシップ
//! - `ProjectTree`: タスクリストを含む階層構造

use crate::types::{
    id_types::{ProjectId, UserId},
    project_types::ProjectStatus,
};
use async_trait::async_trait;
use chrono::{DateTime, Utc};
use partially::Partial;
use serde::{Deserialize, Serialize};

use super::task_list::TaskListTree;
use crate::models::ModelConverter;
use crate::traits::Trackable;

/// 基本プロジェクト情報を表現する構造体
///
/// プロジェクトの基本的なメタデータを管理します。
/// UIの表示順序やアーカイブ状態等、フロントエンドとの整合性を重視した設計です。
///
/// # フィールド
///
/// * `id` - プロジェクトの一意識別子
/// * `name` - プロジェクト名（必須）
/// * `description` - プロジェクトの説明文
/// * `color` - UI表示用のカラーコード（Svelteフロントエンド対応）
/// * `order_index` - 表示順序（昇順ソート用）
/// * `is_archived` - アーカイブ状態フラグ
/// * `status` - プロジェクトステータス（進行中、完了等）
/// * `owner_id` - プロジェクトオーナーのユーザーID
/// * `created_at` - プロジェクト作成日時
/// * `updated_at` - 最終更新日時
/// * `deleted` - 論理削除フラグ（Automerge同期用）
/// * `updated_by` - 最終更新者のユーザーID（作成・更新・削除・復元すべて）
///
/// # 設計思想
///
/// - **フロントエンド最適化**: Svelteでの表示に最適化されたフィールド構成
/// - **階層管理**: タスクリストやタスクの上位概念としての位置づけ
/// - **チーム対応**: 複数メンバーでの共同作業を前提とした設計
/// - **操作追跡**: 削除・復元を含むすべての操作を`updated_by`/`updated_at`で追跡
#[derive(Debug, Clone, Serialize, Deserialize, Partial)]
#[partially(derive(Debug, Clone, Serialize, Deserialize, Default))]
pub struct Project {
    /// プロジェクトの一意識別子
    #[partially(omit)] // IDは更新対象外
    pub id: ProjectId,
    /// プロジェクト名（必須）
    pub name: String,
    /// プロジェクトの説明文
    pub description: Option<String>,
    /// UI表示用のカラーコード（Svelteフロントエンド対応）
    pub color: Option<String>, // Svelte側に合わせて追加
    /// 表示順序（昇順ソート用）
    pub order_index: i32, // Svelte側に合わせて追加
    /// アーカイブ状態フラグ
    pub is_archived: bool, // Svelte側に合わせて追加
    /// プロジェクトステータス（進行中、完了等）
    pub status: Option<ProjectStatus>, // Optionalに変更（Svelte側にはないが既存機能保持）
    /// プロジェクトオーナーのユーザーID
    pub owner_id: Option<UserId>, // プロジェクトオーナーのユーザーID
    /// プロジェクト作成日時
    pub created_at: DateTime<Utc>,
    /// 最終更新日時（必須）
    pub updated_at: DateTime<Utc>,
    /// 論理削除フラグ（Automerge同期用）
    pub deleted: bool,
    /// 最終更新者のユーザーID（必須、作成・更新・削除・復元すべての操作で記録）
    pub updated_by: UserId,
}

/// タスクリストを含むプロジェクトツリー構造体
///
/// プロジェクトの完全な階層情報を一括で取得・表示するための構造体です。
/// フロントエンドでの初期表示やダッシュボード用途に最適化されています。
///
/// # フィールド
///
/// 基本的には`Project`と同じフィールドを持ちますが、
/// 追加で`task_lists`フィールドにより階層構造を表現します。
///
/// * `task_lists` - 所属するタスクリスト一覧（タスク情報を含む）
///
/// # 使用場面
///
/// - プロジェクト一覧画面での詳細表示
/// - ダッシュボードでのプロジェクト概要
/// - エクスポート機能での完全データ取得
///
/// # パフォーマンス注意点
///
/// 大量のタスクデータを含むため、必要な場面でのみ使用することを推奨します。
/// 単純なプロジェクト情報のみが必要な場合は`Project`を使用してください。
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectTree {
    /// プロジェクトの一意識別子
    pub id: ProjectId,
    /// プロジェクト名（必須）
    pub name: String,
    /// プロジェクトの説明文
    pub description: Option<String>,
    /// UI表示用のカラーコード
    pub color: Option<String>,
    /// 表示順序（昇順ソート用）
    pub order_index: i32,
    /// アーカイブ状態フラグ
    pub is_archived: bool,
    /// プロジェクトステータス（進行中、完了等）
    pub status: Option<ProjectStatus>,
    /// プロジェクトオーナーのユーザーID
    pub owner_id: Option<UserId>, // プロジェクトオーナーのユーザーID
    /// プロジェクト作成日時
    pub created_at: DateTime<Utc>,
    /// 最終更新日時（必須）
    pub updated_at: DateTime<Utc>,
    /// 論理削除フラグ（Automerge同期用）
    pub deleted: bool,
    /// 最終更新者のユーザーID（必須、作成・更新・削除・復元すべての操作で記録）
    pub updated_by: UserId,
    /// 所属するタスクリスト一覧（タスク情報を含む）
    pub task_lists: Vec<TaskListTree>,
}

#[async_trait]
impl ModelConverter<Project> for ProjectTree {
    async fn to_model(&self) -> Result<Project, String> {
        // ProjectTreeからProjectに変換（関連データのtask_listsは除く）
        Ok(Project {
            id: self.id.clone(),
            name: self.name.clone(),
            description: self.description.clone(),
            color: self.color.clone(),
            order_index: self.order_index,
            is_archived: self.is_archived,
            status: self.status.clone(),
            owner_id: self.owner_id.clone(),
            created_at: self.created_at,
            updated_at: self.updated_at,
            deleted: self.deleted,
            updated_by: self.updated_by,
        })
    }
}

impl Trackable for Project {
    fn mark_created(&mut self, user_id: UserId, timestamp: DateTime<Utc>) {
        self.created_at = timestamp;
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
        self.created_at
    }

    fn get_updated_at(&self) -> DateTime<Utc> {
        self.updated_at
    }
}

impl Trackable for ProjectTree {
    fn mark_created(&mut self, user_id: UserId, timestamp: DateTime<Utc>) {
        self.created_at = timestamp;
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
        self.created_at
    }

    fn get_updated_at(&self) -> DateTime<Utc> {
        self.updated_at
    }
}
