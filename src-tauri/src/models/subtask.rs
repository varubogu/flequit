//! サブタスク管理モデル
//! 
//! このモジュールはタスクに属するサブタスクの構造を定義します。
//! 
//! ## 概要
//! 
//! サブタスク管理では以下2つの主要構造体を提供：
//! - `Subtask`: 基本サブタスク情報（軽量、一般的な操作用）
//! - `SubTask`: タグ情報を含む完全なサブタスク構造

use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};
use super::super::types::{task_types::TaskStatus, id_types::{SubTaskId, TaskId, UserId, TagId}};
use super::datetime_calendar::RecurrenceRule;
use super::tag::Tag;

use crate::models::{command::subtask::SubtaskCommand, CommandModelConverter};

/// 基本サブタスク情報を表現する構造体
/// 
/// タスクに従属するサブタスクの基本情報を管理します。
/// Svelteフロントエンドとの互換性を重視し、柔軟な日時管理、
/// 優先度設定、チーム作業対応を実現します。
/// 
/// # フィールド
/// 
/// ## 基本情報
/// * `id` - サブタスクの一意識別子
/// * `task_id` - 親タスクの識別子（必須の関連）
/// * `title` - サブタスクタイトル（必須）
/// * `description` - サブタスクの詳細説明
/// 
/// ## 状態管理
/// * `status` - サブタスクステータス（TODO、進行中、完了等）
/// * `priority` - 優先度（数値、高いほど優先、Optional）
/// * `completed` - 完了フラグ（従来互換性のため保持）
/// * `order_index` - 表示順序（昇順ソート用）
/// 
/// ## 日時管理
/// * `start_date` - 開始日時（Optional）
/// * `end_date` - 終了日時（Optional）
/// * `is_range_date` - 期間指定フラグ（開始〜終了の期間指定）
/// * `recurrence_rule` - 繰り返しルール（定期サブタスク用）
/// 
/// ## チーム機能
/// * `assigned_user_ids` - アサインされたユーザーIDリスト
/// * `tag_ids` - 付与されたタグIDリスト（IDのみ）
/// 
/// ## システム情報
/// * `created_at` - サブタスク作成日時
/// * `updated_at` - 最終更新日時
/// 
/// # 設計思想
/// 
/// - **親タスク従属**: 必ず親タスクに属する構造
/// - **軽量性**: 一般的な操作で頻繁に使用される軽量構造
/// - **フロントエンド最適化**: Svelteでの表示・操作に最適化
/// - **柔軟な日時**: 単発・期間・定期の多様な日時パターンに対応
/// 
/// # 使用場面
/// 
/// - サブタスク一覧表示
/// - 基本的なCRUD操作
/// - 進捗管理とステータス更新
/// - 軽量なデータ取得
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Subtask {
    /// サブタスクの一意識別子
    pub id: SubTaskId,
    /// 親タスクの識別子（必須の関連）
    pub task_id: TaskId,
    /// サブタスクタイトル（必須）
    pub title: String,
    /// サブタスクの詳細説明
    pub description: Option<String>,
    /// サブタスクステータス（TODO、進行中、完了等）
    pub status: TaskStatus,
    /// 優先度（数値、高いほど優先、Optional）
    pub priority: Option<i32>,
    /// 開始日時（Optional）
    pub start_date: Option<DateTime<Utc>>,
    /// 終了日時（Optional）
    pub end_date: Option<DateTime<Utc>>,
    /// 期間指定フラグ（開始〜終了の期間指定）
    pub is_range_date: Option<bool>,
    /// 繰り返しルール（定期サブタスク用）
    pub recurrence_rule: Option<RecurrenceRule>,
    /// アサインされたユーザーIDリスト
    pub assigned_user_ids: Vec<UserId>, // アサインされたユーザーIDの配列
    /// 付与されたタグIDリスト（IDのみ）
    pub tag_ids: Vec<TagId>, // 付与されたタグIDの配列
    /// 表示順序（昇順ソート用）
    pub order_index: i32,
    /// 完了フラグ（従来互換性のため保持）
    pub completed: bool, // 既存のcompletedフィールドも保持
    /// サブタスク作成日時
    pub created_at: DateTime<Utc>,
    /// 最終更新日時
    pub updated_at: DateTime<Utc>,
}

impl CommandModelConverter<SubtaskCommand> for Subtask {
    async fn to_command_model(&self) -> Result<SubtaskCommand, String> {
        Ok(SubtaskCommand {
            id: self.id.to_string(),
            task_id: self.task_id.to_string(),
            title: self.title.clone(),
            description: self.description.clone(),
            status: self.status.clone(),
            priority: self.priority,
            start_date: self.start_date.map(|d| d.to_rfc3339()),
            end_date: self.end_date.map(|d| d.to_rfc3339()),
            is_range_date: self.is_range_date,
            recurrence_rule: self.recurrence_rule.clone(),
            assigned_user_ids: self.assigned_user_ids.iter().map(|id| id.to_string()).collect(),
            tag_ids: self.tag_ids.iter().map(|id| id.to_string()).collect(),
            order_index: self.order_index,
            completed: self.completed,
            created_at: self.created_at.to_rfc3339(),
            updated_at: self.updated_at.to_rfc3339(),
        })
    }
}

/// タグ情報を含む完全なサブタスク構造体
/// 
/// サブタスクの詳細表示や編集画面で使用される、関連データを含む完全な構造体です。
/// タグの実体情報を含むため、詳細画面での一括表示に最適化されています。
/// 
/// # 基本フィールド
/// 
/// `Subtask`構造体と同様のフィールドに加えて、以下の関連データを含みます：
/// 
/// ## 関連データ
/// * `tags` - 付与されたタグの配列（Tag構造体の実体）
/// 
/// # Subtaskとの違い
/// 
/// - `Subtask`: `tag_ids`でタグIDのみ保持（軽量）
/// - `SubTask`: `tags`でタグの実体情報も保持（完全）
/// - `completed`フィールドは`SubTask`では省略（statusで管理）
/// 
/// # 使用場面
/// 
/// - サブタスク詳細画面での表示
/// - サブタスク編集フォームでの初期データ
/// - タグ情報を含む表示
/// - エクスポート機能での完全データ取得
/// 
/// # パフォーマンス考慮
/// 
/// 関連データを含むため、必要な場面でのみ使用することを推奨します。
/// 軽量な一覧表示等では`Subtask`構造体を使用してください。
/// 
/// # データ整合性
/// 
/// `tags`フィールドに含まれるタグは、該当サブタスクに付与されているもののみです。
/// 
/// # 使用例
/// 
/// ```rust
/// // サブタスク詳細画面での使用例
/// let detailed_subtask = SubTask {
///     // ... 基本フィールドは Subtask と同様
///     tags: vec![
///         Tag { name: "バグ修正".to_string(), color: Some("#ff8800".to_string()), /* ... */ },
///         Tag { name: "高優先".to_string(), color: Some("#ff0000".to_string()), /* ... */ },
///     ],
/// };
/// ```
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubTask {
    /// サブタスクの一意識別子
    pub id: SubTaskId,
    /// 親タスクの識別子（必須の関連）
    pub task_id: TaskId,
    /// サブタスクタイトル（必須）
    pub title: String,
    /// サブタスクの詳細説明
    pub description: Option<String>,
    /// サブタスクステータス（TODO、進行中、完了等）
    pub status: TaskStatus, // StringからTaskStatusに修正
    /// 優先度（数値、高いほど優先、Optional）
    pub priority: Option<i32>,
    /// 開始日時（Optional）
    pub start_date: Option<DateTime<Utc>>,
    /// 終了日時（Optional）
    pub end_date: Option<DateTime<Utc>>,
    /// 期間指定フラグ（開始〜終了の期間指定）
    pub is_range_date: Option<bool>, // 追加
    /// 繰り返しルール（定期サブタスク用）
    pub recurrence_rule: Option<RecurrenceRule>, // 追加
    /// アサインされたユーザーIDリスト
    pub assigned_user_ids: Vec<UserId>, // アサインされたユーザーIDの配列
    /// 表示順序（昇順ソート用）
    pub order_index: i32,
    /// 付与されたタグの配列（Tag構造体の実体）
    pub tags: Vec<Tag>,
    /// サブタスク作成日時
    pub created_at: DateTime<Utc>,
    /// 最終更新日時
    pub updated_at: DateTime<Utc>,
}
