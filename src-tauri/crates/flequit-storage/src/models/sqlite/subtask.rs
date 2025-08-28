use async_trait::async_trait;
use chrono::{DateTime, Utc};
use flequit_model::models::subtask::SubTask;
use flequit_model::types::id_types::{SubTaskId, TaskId, UserId};
use flequit_model::types::task_types::TaskStatus;
use sea_orm::{entity::prelude::*, Set};
use serde::{Deserialize, Serialize};

use super::{DomainToSqliteConverter, SqliteModelConverter};

/// Subtask用SQLiteエンティティ定義
///
/// サブタスク管理の高速検索・ソートに最適化
/// 親タスク別検索、ステータス・優先度フィルタに対応
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "subtasks")]
pub struct Model {
    /// サブタスクの一意識別子
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: String,

    /// 親タスクID
    #[sea_orm(indexed)] // 親タスク別検索用
    pub task_id: String,

    /// サブタスクタイトル
    pub title: String,

    /// サブタスク説明
    pub description: Option<String>,

    /// サブタスクステータス（文字列形式）
    #[sea_orm(indexed)] // ステータス別検索用
    pub status: String,

    /// 優先度（数値、Optional）
    #[sea_orm(indexed)] // 優先度別検索用
    pub priority: Option<i32>,

    /// 開始日時
    #[sea_orm(indexed)] // 日時範囲検索用
    pub start_date: Option<DateTime<Utc>>,

    /// 終了日時
    #[sea_orm(indexed)] // 日時範囲検索用
    pub end_date: Option<DateTime<Utc>>,

    /// 期間指定フラグ
    pub is_range_date: Option<bool>,

    /// 繰り返しルール（JSON形式）
    pub recurrence_rule: Option<String>,

    /// アサインされたユーザーIDリスト（JSON配列形式）
    pub assigned_user_ids: Option<String>,


    /// 表示順序
    #[sea_orm(indexed)] // ソート用
    pub order_index: i32,

    /// 完了フラグ（従来互換性のため保持）
    #[sea_orm(indexed)] // 完了状態フィルタ用
    pub completed: bool,

    /// 作成日時
    pub created_at: DateTime<Utc>,

    /// 更新日時
    pub updated_at: DateTime<Utc>,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::task::Entity",
        from = "Column::TaskId",
        to = "super::task::Column::Id"
    )]
    Task,
}

impl Related<super::task::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Task.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}

/// SQLiteモデルからドメインモデルへの変換
#[async_trait]
impl SqliteModelConverter<SubTask> for Model {
    async fn to_domain_model(&self) -> Result<SubTask, String> {

        // ステータス文字列をenumに変換
        let status = match self.status.as_str() {
            "not_started" => TaskStatus::NotStarted,
            "in_progress" => TaskStatus::InProgress,
            "waiting" => TaskStatus::Waiting,
            "completed" => TaskStatus::Completed,
            "cancelled" => TaskStatus::Cancelled,
            _ => return Err(format!("Unknown task status: {}", self.status)),
        };

        // 繰り返しルールJSONをパース
        let recurrence_rule = if let Some(rule_json) = &self.recurrence_rule {
            Some(
                serde_json::from_str(rule_json)
                    .map_err(|e| format!("Failed to parse recurrence_rule: {}", e))?,
            )
        } else {
            None
        };

        // アサインされたユーザーIDリストJSONをパース
        let assigned_user_ids = if let Some(users_json) = &self.assigned_user_ids {
            let string_ids: Vec<String> = serde_json::from_str(users_json)
                .map_err(|e| format!("Failed to parse assigned_user_ids: {}", e))?;
            string_ids
                .into_iter()
                .map(UserId::from)
                .collect()
        } else {
            vec![]
        };

        // タグIDリストは紐づけテーブル(subtask_tags)から取得するため、
        // SQLiteモデルでは空のベクターを設定
        let tag_ids = vec![];

        Ok(SubTask {
            id: SubTaskId::from(self.id.clone()),
            task_id: TaskId::from(self.task_id.clone()),
            title: self.title.clone(),
            description: self.description.clone(),
            status,
            priority: self.priority,
            plan_start_date: self.start_date,
            plan_end_date: self.end_date,
            do_start_date: None,
            do_end_date: None,
            is_range_date: self.is_range_date,
            recurrence_rule,
            assigned_user_ids,
            tag_ids,
            tags: vec![],
            order_index: self.order_index,
            completed: self.completed,
            created_at: self.created_at,
            updated_at: self.updated_at,
        })
    }
}

/// ドメインモデルからSQLiteモデルへの変換
#[async_trait]
impl DomainToSqliteConverter<ActiveModel> for SubTask {
    async fn to_sqlite_model(&self) -> Result<ActiveModel, String> {
        // enumを文字列に変換
        let status_string = match &self.status {
            TaskStatus::NotStarted => "not_started",
            TaskStatus::InProgress => "in_progress",
            TaskStatus::Waiting => "waiting",
            TaskStatus::Completed => "completed",
            TaskStatus::Cancelled => "cancelled",
        }
        .to_string();

        // 繰り返しルールをJSONに変換
        let recurrence_rule_json = if let Some(rule) = &self.recurrence_rule {
            Some(
                serde_json::to_string(rule)
                    .map_err(|e| format!("Failed to serialize recurrence_rule: {}", e))?,
            )
        } else {
            None
        };

        // アサインされたユーザーIDリストをJSONに変換
        let assigned_user_ids_json = if !self.assigned_user_ids.is_empty() {
            let string_ids: Vec<String> = self
                .assigned_user_ids
                .iter()
                .map(|id| id.to_string())
                .collect();
            Some(
                serde_json::to_string(&string_ids)
                    .map_err(|e| format!("Failed to serialize assigned_user_ids: {}", e))?,
            )
        } else {
            None
        };

        // タグIDリストは紐づけテーブル(subtask_tags)で管理するため、
        // SQLiteのsubtasksテーブルには保存しない

        Ok(ActiveModel {
            id: Set(self.id.to_string()),
            task_id: Set(self.task_id.to_string()),
            title: Set(self.title.clone()),
            description: Set(self.description.clone()),
            status: Set(status_string),
            priority: Set(self.priority),
            start_date: Set(self.plan_start_date),
            end_date: Set(self.plan_end_date),
            is_range_date: Set(self.is_range_date),
            recurrence_rule: Set(recurrence_rule_json),
            assigned_user_ids: Set(assigned_user_ids_json),
            order_index: Set(self.order_index),
            completed: Set(self.completed),
            created_at: Set(self.created_at),
            updated_at: Set(self.updated_at),
        })
    }
}
