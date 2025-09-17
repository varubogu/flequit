//! サブタスク管理モデル
//!
//! このモジュールはタスクに属するサブタスクの構造を定義します。
//!
//! ## 概要
//!
//! サブタスク管理では以下2つの主要構造体を提供：
//! - `Subtask`: 基本サブタスク情報（軽量、一般的な操作用）
//! - `SubTask`: タグ情報を含む完全なサブタスク構造

use super::recurrence_rule::RecurrenceRule;
use crate::types::{
    id_types::{SubTaskId, TagId, TaskId, UserId},
    task_types::TaskStatus,
};
use async_trait::async_trait;
use chrono::{DateTime, Utc};
use partially::Partial;
use serde::{Deserialize, Serialize};

use crate::models::ModelConverter;

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
#[derive(Debug, Clone, Serialize, Deserialize, Partial)]
#[partially(derive(Debug, Clone, Serialize, Deserialize, Default))]
pub struct SubTask {
    /// サブタスクの一意識別子
    #[partially(omit)] // IDは更新対象外
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
    /// 予定開始日時（Optional）
    pub plan_start_date: Option<DateTime<Utc>>,
    /// 予定終了日時（Optional）
    pub plan_end_date: Option<DateTime<Utc>>,
    /// 実開始日時（Optional）
    pub do_start_date: Option<DateTime<Utc>>,
    /// 実終了日時（Optional）
    pub do_end_date: Option<DateTime<Utc>>,
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

#[derive(Debug, Clone, Serialize, Deserialize, Partial)]
#[partially(derive(Debug, Clone, Serialize, Deserialize, Default))]
pub struct SubTaskTree {
    /// サブタスクの一意識別子
    #[partially(omit)] // IDは更新対象外
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
    /// 予定開始日時（Optional）
    pub plan_start_date: Option<DateTime<Utc>>,
    /// 予定終了日時（Optional）
    pub plan_end_date: Option<DateTime<Utc>>,
    /// 実開始日時（Optional）
    pub do_start_date: Option<DateTime<Utc>>,
    /// 実終了日時（Optional）
    pub do_end_date: Option<DateTime<Utc>>,
    /// 期間指定フラグ（開始〜終了の期間指定）
    pub is_range_date: Option<bool>,
    /// 繰り返しルール（定期サブタスク用）
    pub recurrence_rule: Option<RecurrenceRule>,
    /// 表示順序（昇順ソート用）
    pub order_index: i32,
    /// 完了フラグ（従来互換性のため保持）
    pub completed: bool, // 既存のcompletedフィールドも保持
    /// サブタスク作成日時
    pub created_at: DateTime<Utc>,
    /// 最終更新日時
    pub updated_at: DateTime<Utc>,
    /// アサインされたユーザーIDリスト
    pub assigned_user_ids: Vec<UserId>, // アサインされたユーザーIDの配列
    /// 付与されたタグIDの配列
    pub tag_ids: Vec<TagId>,
}

#[async_trait]
impl ModelConverter<SubTask> for SubTaskTree {
    /// SubTaskTreeからSubTaskに変換
    ///
    /// タグID情報（tag_ids）をそのまま使用し、
    /// 関連データを含まない軽量な基本サブタスク構造に変換します。
    async fn to_model(&self) -> Result<SubTask, String> {

        Ok(SubTask {
            id: self.id.clone(),
            task_id: self.task_id.clone(),
            title: self.title.clone(),
            description: self.description.clone(),
            status: self.status.clone(),
            priority: self.priority,
            plan_start_date: self.plan_start_date,
            plan_end_date: self.plan_end_date,
            do_start_date: self.do_start_date,
            do_end_date: self.do_end_date,
            is_range_date: self.is_range_date,
            recurrence_rule: self.recurrence_rule.clone(),
            assigned_user_ids: self.assigned_user_ids.clone(),
            tag_ids: self.tag_ids.clone(), // タグIDリストをそのまま使用
            order_index: self.order_index,
            completed: self.completed,
            created_at: self.created_at,
            updated_at: self.updated_at,
        })
    }
}
