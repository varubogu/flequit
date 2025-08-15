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

use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};
use super::super::types::{project_types::{ProjectStatus, MemberRole}, id_types::{ProjectId, UserId}};

use crate::models::{command::project::ProjectCommand, CommandModelConverter};

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
/// 
/// # 設計思想
/// 
/// - **フロントエンド最適化**: Svelteでの表示に最適化されたフィールド構成
/// - **階層管理**: タスクリストやタスクの上位概念としての位置づけ
/// - **チーム対応**: 複数メンバーでの共同作業を前提とした設計
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Project {
    /// プロジェクトの一意識別子
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
    /// 最終更新日時
    pub updated_at: DateTime<Utc>,
}

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
pub struct ProjectMember {
    /// メンバーのユーザーID
    pub user_id: UserId,
    /// 所属プロジェクトID
    pub project_id: ProjectId,
    /// プロジェクト内での役割（Owner、Member等）
    pub role: MemberRole,
    /// プロジェクト参加日時
    pub joined_at: DateTime<Utc>,
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
    /// プロジェクトオーナーのユーザーID
    pub owner_id: Option<UserId>, // プロジェクトオーナーのユーザーID
    /// プロジェクト作成日時
    pub created_at: DateTime<Utc>,
    /// 最終更新日時
    pub updated_at: DateTime<Utc>,
    /// 所属するタスクリスト一覧（タスク情報を含む）
    pub task_lists: Vec<super::task_list::TaskListWithTasks>,
}

impl CommandModelConverter<ProjectCommand> for Project {
    async fn to_command_model(&self) -> Result<ProjectCommand, String> {
        Ok(ProjectCommand {
            id: self.id.to_string(),
            name: self.name.clone(),
            description: self.description.clone(),
            color: self.color.clone(),
            order_index: self.order_index,
            is_archived: self.is_archived,
            status: self.status.clone(),
            owner_id: self.owner_id.as_ref().map(|id| id.to_string()),
            created_at: self.created_at.to_rfc3339(),
            updated_at: self.updated_at.to_rfc3339(),
        })
    }
}
