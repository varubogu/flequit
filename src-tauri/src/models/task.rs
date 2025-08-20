//! タスク管理モデル
//!
//! このモジュールはタスクの基本構造とサブタスク付きタスクを定義します。
//!
//! ## 概要
//!
//! タスク管理では以下2つの主要構造体を提供：
//! - `Task`: 基本タスク情報（軽量、一般的な操作用）
//! - `TaskWithSubTasks`: サブタスクとタグ情報を含む完全なタスク構造

use super::super::types::{
    id_types::{ProjectId, SubTaskId, TagId, TaskId, TaskListId, UserId},
    task_types::TaskStatus,
};
use super::datetime_calendar::RecurrenceRule;
use super::tag::Tag;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use partially::Partial;

use crate::models::{command::task::TaskCommand, CommandModelConverter};

/// 基本タスク情報を表現する構造体
///
/// タスクの核となる情報を管理します。Svelteフロントエンドとの互換性を重視し、
/// 柔軟な日時管理、優先度設定、チーム作業対応を実現します。
///
/// # フィールド
///
/// ## 基本情報
/// * `id` - タスクの一意識別子
/// * `sub_task_id` - 親サブタスクID（タスクがサブタスクの一部の場合）
/// * `project_id` - 所属プロジェクトID
/// * `list_id` - 所属タスクリストID
/// * `title` - タスクタイトル（必須）
/// * `description` - タスクの詳細説明
///
/// ## 状態管理
/// * `status` - タスクステータス（TODO、進行中、完了等）
/// * `priority` - 優先度（数値、高いほど優先）
/// * `is_archived` - アーカイブ状態フラグ
/// * `order_index` - 表示順序（昇順ソート用）
///
/// ## 日時管理
/// * `start_date` - 開始日時（Optional）
/// * `end_date` - 終了日時（Optional）
/// * `is_range_date` - 期間指定フラグ（開始〜終了の期間タスク）
/// * `recurrence_rule` - 繰り返しルール（定期タスク用）
///
/// ## チーム機能
/// * `assigned_user_ids` - アサインされたユーザーIDリスト
/// * `tag_ids` - 付与されたタグIDリスト
///
/// ## システム情報
/// * `created_at` - タスク作成日時
/// * `updated_at` - 最終更新日時
///
/// # 設計思想
///
/// - **Svelte最適化**: フロントエンドでの表示・操作に最適化
/// - **軽量性**: 基本的な操作で頻繁に使用される軽量構造
/// - **チーム対応**: 複数ユーザーでの共同作業を前提とした設計
/// - **柔軟な日時**: 単発・期間・定期の多様な日時パターンに対応
///
/// # 使用場面
///
/// - タスクリスト表示
/// - 基本的なCRUD操作
/// - 検索・フィルタリング
/// - 軽量なデータ取得
#[derive(Debug, Clone, Serialize, Deserialize, Partial)]
#[partially(derive(Debug, Clone, Serialize, Deserialize, Default))]
pub struct Task {
    /// タスクの一意識別子
    #[partially(omit)]  // IDは更新対象外
    pub id: TaskId,
    /// 親サブタスクID（タスクがサブタスクの一部の場合）
    pub sub_task_id: Option<SubTaskId>,
    /// 所属プロジェクトID
    pub project_id: ProjectId,
    /// 所属タスクリストID
    pub list_id: TaskListId,
    /// タスクタイトル（必須）
    pub title: String,
    /// タスクの詳細説明
    pub description: Option<String>,
    /// タスクステータス（TODO、進行中、完了等）
    pub status: TaskStatus,
    /// 優先度（数値、高いほど優先）
    pub priority: i32,
    /// 開始日時（Optional）
    pub start_date: Option<DateTime<Utc>>,
    /// 終了日時（Optional）
    pub end_date: Option<DateTime<Utc>>,
    /// 期間指定フラグ（開始〜終了の期間タスク）
    pub is_range_date: Option<bool>,
    /// 繰り返しルール（定期タスク用）
    pub recurrence_rule: Option<RecurrenceRule>,
    /// アサインされたユーザーIDリスト
    pub assigned_user_ids: Vec<UserId>, // アサインされたユーザーIDの配列
    /// 付与されたタグIDリスト
    pub tag_ids: Vec<TagId>, // 付与されたタグIDの配列
    /// 表示順序（昇順ソート用）
    pub order_index: i32,
    /// アーカイブ状態フラグ
    pub is_archived: bool,
    /// タスク作成日時
    pub created_at: DateTime<Utc>,
    /// 最終更新日時
    pub updated_at: DateTime<Utc>,
}

/// サブタスクとタグ情報を含む完全なタスク構造体
///
/// タスクの詳細表示や編集画面で使用される、関連データを含む完全な構造体です。
/// サブタスクとタグの実体情報を含むため、詳細画面での一括表示に最適化されています。
///
/// # 基本フィールド
///
/// `Task`構造体と同様のフィールドに加えて、以下の関連データを含みます：
///
/// ## 関連データ
/// * `sub_tasks` - 所属するサブタスクの配列（SubTask構造体）
/// * `tags` - 付与されたタグの配列（Tag構造体の実体）
///
/// # 使用場面
///
/// - タスク詳細画面での表示
/// - タスク編集フォームでの初期データ
/// - サブタスク一覧を含む表示
/// - エクスポート機能での完全データ取得
///
/// # パフォーマンス考慮
///
/// 関連データを含むため、必要な場面でのみ使用することを推奨します。
/// 軽量な一覧表示等では`Task`構造体を使用してください。
///
/// # データ整合性
///
/// - `tag_ids`と`tags`の内容は一致する必要があります
/// - `sub_tasks`は該当タスクに所属するもののみ含まれます
///
/// # 使用例
///
/// ```rust
/// // タスク詳細画面での使用例
/// let detailed_task = TaskWithSubTasks {
///     // ... 基本フィールドは Task と同様
///     sub_tasks: vec![
///         SubTask { /* サブタスク1 */ },
///         SubTask { /* サブタスク2 */ },
///     ],
///     tags: vec![
///         Tag { name: "緊急".to_string(), color: Some("#ff0000".to_string()), /* ... */ },
///         Tag { name: "機能開発".to_string(), color: Some("#0000ff".to_string()), /* ... */ },
///     ],
/// };
/// ```
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskWithSubTasks {
    /// タスクの一意識別子
    pub id: TaskId,
    /// 親サブタスクID（タスクがサブタスクの一部の場合）
    pub sub_task_id: Option<SubTaskId>, // 追加
    /// 所属プロジェクトID
    pub project_id: ProjectId,
    /// 所属タスクリストID
    pub list_id: TaskListId,
    /// タスクタイトル（必須）
    pub title: String,
    /// タスクの詳細説明
    pub description: Option<String>,
    /// タスクステータス（TODO、進行中、完了等）
    pub status: TaskStatus, // StringからTaskStatusに修正
    /// 優先度（数値、高いほど優先）
    pub priority: i32,
    /// 開始日時（Optional）
    pub start_date: Option<DateTime<Utc>>,
    /// 終了日時（Optional）
    pub end_date: Option<DateTime<Utc>>,
    /// 期間指定フラグ（開始〜終了の期間タスク）
    pub is_range_date: Option<bool>, // 追加
    /// 繰り返しルール（定期タスク用）
    pub recurrence_rule: Option<RecurrenceRule>, // 追加
    /// アサインされたユーザーIDリスト
    pub assigned_user_ids: Vec<UserId>, // アサインされたユーザーIDの配列
    /// 表示順序（昇順ソート用）
    pub order_index: i32,
    /// アーカイブ状態フラグ
    pub is_archived: bool,
    /// タスク作成日時
    pub created_at: DateTime<Utc>,
    /// 最終更新日時
    pub updated_at: DateTime<Utc>,
    /// 所属するサブタスクの配列（SubTask構造体）
    pub sub_tasks: Vec<super::subtask::SubTask>,
    /// 付与されたタグの配列（Tag構造体の実体）
    pub tags: Vec<Tag>,
}

impl CommandModelConverter<TaskCommand> for Task {
    async fn to_command_model(&self) -> Result<TaskCommand, String> {
        Ok(TaskCommand {
            id: self.id.to_string(),
            sub_task_id: self.sub_task_id.as_ref().map(|id| id.to_string()),
            project_id: self.project_id.to_string(),
            list_id: self.list_id.to_string(),
            title: self.title.clone(),
            description: self.description.clone(),
            status: self.status.clone(),
            priority: self.priority,
            start_date: self.start_date.map(|d| d.to_rfc3339()),
            end_date: self.end_date.map(|d| d.to_rfc3339()),
            is_range_date: self.is_range_date,
            recurrence_rule: self.recurrence_rule.clone(),
            assigned_user_ids: self
                .assigned_user_ids
                .iter()
                .map(|id| id.to_string())
                .collect(),
            tag_ids: self.tag_ids.iter().map(|id| id.to_string()).collect(),
            order_index: self.order_index,
            is_archived: self.is_archived,
            created_at: self.created_at.to_rfc3339(),
            updated_at: self.updated_at.to_rfc3339(),
        })
    }
}

