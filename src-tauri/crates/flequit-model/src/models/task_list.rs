//! タスクリスト管理モデル
//!
//! このモジュールはプロジェクト内のタスク分類・グループ化を行うタスクリストを定義します。
//!
//! ## 概要
//!
//! タスクリスト管理では以下2つの主要構造体を提供：
//! - `TaskList`: 基本タスクリスト情報（軽量、一般的な操作用）
//! - `TaskListWithTasks`: タスクを含む完全なタスクリスト構造

use super::super::types::id_types::TaskListId;
use async_trait::async_trait;
use chrono::{DateTime, Utc};
use partially::Partial;
use serde::{Deserialize, Serialize};

use crate::{models::ModelConverter, types::id_types::ProjectId};

/// 基本タスクリスト情報を表現する構造体
///
/// プロジェクト内でのタスク分類・グループ化を行うリスト構造を管理します。
/// Svelteフロントエンドとの互換性を重視し、視覚的な区別や表示順序制御をサポートします。
///
/// # フィールド
///
/// ## 基本情報
/// * `id` - タスクリストの一意識別子
/// * `project_id` - 所属プロジェクトの識別子（必須の関連）
/// * `name` - タスクリスト名（必須）
/// * `description` - タスクリストの詳細説明
///
/// ## UI制御
/// * `color` - UI表示用のカラーコード（Svelteフロントエンド対応）
/// * `order_index` - 表示順序（昇順ソート用）
/// * `is_archived` - アーカイブ状態フラグ
///
/// ## システム情報
/// * `created_at` - タスクリスト作成日時
/// * `updated_at` - 最終更新日時
///
/// # 設計思想
///
/// - **プロジェクト従属**: 必ずプロジェクトに属する構造
/// - **分類機能**: タスクの論理的グループ化を実現
/// - **フロントエンド最適化**: Svelteでの表示・操作に最適化
/// - **カンバン対応**: カンバンボードの列としても使用可能
///
/// # 使用場面
///
/// - タスクリスト一覧表示
/// - 基本的なCRUD操作
/// - プロジェクト構成の管理
/// - カンバンボードの列表示
///
/// # 使用例
///
/// ```rust,no_run
/// # use chrono::Utc;
/// # use flequit_lib::models::task_list::TaskList;
/// # use flequit_lib::types::id_types::{TaskListId, ProjectId};
///
/// let task_list = TaskList {
///     id: TaskListId::new(),
///     project_id: ProjectId::new(),
///     name: "TODO".to_string(),
///     description: Some("新規タスクの管理".to_string()),
///     color: Some("#e3f2fd".to_string()),
///     order_index: 1,
///     is_archived: false,
///     created_at: Utc::now(),
///     updated_at: Utc::now(),
/// };
/// ```
#[derive(Debug, Clone, Serialize, Deserialize, Partial)]
#[partially(derive(Debug, Clone, Serialize, Deserialize, Default))]
pub struct TaskList {
    /// タスクリストの一意識別子
    #[partially(omit)] // IDは更新対象外
    pub id: TaskListId,
    /// 所属プロジェクトの識別子
    pub project_id: ProjectId,
    /// タスクリスト名（必須）
    pub name: String,
    /// タスクリストの詳細説明
    pub description: Option<String>,
    /// UI表示用のカラーコード（Svelteフロントエンド対応）
    pub color: Option<String>,
    /// 表示順序（昇順ソート用）
    pub order_index: i32,
    /// アーカイブ状態フラグ
    pub is_archived: bool,
    /// タスクリスト作成日時
    pub created_at: DateTime<Utc>,
    /// 最終更新日時
    pub updated_at: DateTime<Utc>,
}

/// タスクを含む完全なタスクリストツリー構造体
///
/// タスクリストの詳細表示や一括操作で使用される、関連タスクを含む完全な構造体です。
/// 所属タスクの実体情報を含むため、詳細画面やダッシュボードでの表示に最適化されています。
///
/// # 基本フィールド
///
/// `TaskList`構造体と同様のフィールドに加えて、以下の関連データを含みます：
///
/// ## 関連データ
/// * `tasks` - 所属するタスクの配列（TaskTree構造体）
///
/// # 使用場面
///
/// - タスクリスト詳細画面での表示
/// - プロジェクト全体の進捗確認
/// - カンバンボードでの列とタスクの一括表示
/// - エクスポート機能での完全データ取得
/// - ダッシュボードでのタスク一覧
///
/// # パフォーマンス考慮
///
/// 大量のタスクデータを含むため、必要な場面でのみ使用することを推奨します。
/// 軽量なタスクリスト情報のみが必要な場合は`TaskList`を使用してください。
///
/// # データ整合性
///
/// - `tasks`配列には該当タスクリストに所属するタスクのみ含まれます
/// - 各タスクはサブタスクとタグ情報も含む完全な構造（TaskTree）です
///
/// # 階層構造
///
/// ```text
/// Project
///   |-- TaskListTree
///       |-- TaskTree[]
///           |-- SubTask[]
///           |-- Tag[]
/// ```
///
/// # 使用例
///
/// ```rust,no_run
/// # use chrono::Utc;
/// # use flequit_lib::models::task_list::TaskListTree;
/// # use flequit_lib::models::task::TaskTree;
/// # use flequit_lib::types::id_types::{TaskListId, TaskId, ProjectId};
///
/// // プロジェクトダッシュボードでの使用例
/// let detailed_list = TaskListTree {
///     id: TaskListId::new(),
///     project_id: ProjectId::new(),
///     name: "進行中".to_string(),
///     description: None,
///     color: Some("#ffeb3b".to_string()),
///     order_index: 2,
///     is_archived: false,
///     created_at: Utc::now(),
///     updated_at: Utc::now(),
///     tasks: vec![
///         // TaskTree構造体の例（完全なタスク情報を含む）
///     ],
/// };
/// ```
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskListTree {
    /// タスクリストの一意識別子
    pub id: TaskListId,
    /// 所属プロジェクトの識別子
    pub project_id: ProjectId,
    /// タスクリスト名（必須）
    pub name: String,
    /// タスクリストの詳細説明
    pub description: Option<String>,
    /// UI表示用のカラーコード（Svelteフロントエンド対応）
    pub color: Option<String>,
    /// 表示順序（昇順ソート用）
    pub order_index: i32,
    /// アーカイブ状態フラグ
    pub is_archived: bool,
    /// タスクリスト作成日時
    pub created_at: DateTime<Utc>,
    /// 最終更新日時
    pub updated_at: DateTime<Utc>,
    /// 所属するタスクの配列（TaskTree構造体）
    pub tasks: Vec<super::task::TaskTree>,
}


#[async_trait]
impl ModelConverter<TaskList> for TaskListTree {
    async fn to_model(&self) -> Result<TaskList, String> {
        // TaskListTreeからTaskListに変換（関連データのtasksは除く）
        Ok(TaskList {
            id: self.id.clone(),
            project_id: self.project_id.clone(),
            name: self.name.clone(),
            description: self.description.clone(),
            color: self.color.clone(),
            order_index: self.order_index,
            is_archived: self.is_archived,
            created_at: self.created_at,
            updated_at: self.updated_at,
        })
    }
}
