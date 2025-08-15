use sea_orm::{entity::prelude::*, Set};
use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};

use crate::models::subtask::Subtask;
use super::{SqliteModelConverter, DomainToSqliteConverter};

/// Subtask用SQLiteエンティティ定義
///
/// サブタスク管理の高速検索・ソートに最適化
/// 親タスク別検索、ステータス・優先度フィルタに対応
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "subtasks")]
pub struct Model {
    /// サブタスクの一意識別子
    #[sea_orm(primary_key)]
    pub id: String,
    
    /// 親タスクID
    #[sea_orm(indexed)]  // 親タスク別検索用
    pub task_id: String,
    
    /// サブタスクタイトル
    pub title: String,
    
    /// サブタスク説明
    pub description: Option<String>,
    
    /// サブタスクステータス（文字列形式）
    #[sea_orm(indexed)]  // ステータス別検索用
    pub status: String,
    
    /// 優先度（数値、Optional）
    #[sea_orm(indexed)]  // 優先度別検索用
    pub priority: Option<i32>,
    
    /// 開始日時
    #[sea_orm(indexed)]  // 日時範囲検索用
    pub start_date: Option<DateTime<Utc>>,
    
    /// 終了日時
    #[sea_orm(indexed)]  // 日時範囲検索用
    pub end_date: Option<DateTime<Utc>>,
    
    /// 期間指定フラグ
    pub is_range_date: Option<bool>,
    
    /// 繰り返しルール（JSON形式）
    pub recurrence_rule: Option<String>,
    
    /// アサインされたユーザーIDリスト（JSON配列形式）
    pub assigned_user_ids: Option<String>,
    
    /// 付与されたタグIDリスト（JSON配列形式）
    pub tag_ids: Option<String>,
    
    /// 表示順序
    #[sea_orm(indexed)]  // ソート用
    pub order_index: i32,
    
    /// 完了フラグ（従来互換性のため保持）
    #[sea_orm(indexed)]  // 完了状態フィルタ用
    pub completed: bool,
    
    /// 作成日時
    pub created_at: DateTime<Utc>,
    
    /// 更新日時
    pub updated_at: DateTime<Utc>,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(belongs_to = "super::task::Entity", from = "Column::TaskId", to = "super::task::Column::Id")]
    Task,
}

impl Related<super::task::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Task.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}

/// SQLiteモデルからドメインモデルへの変換
impl SqliteModelConverter<Subtask> for Model {
    async fn to_domain_model(&self) -> Result<Subtask, String> {
        use crate::types::task_types::TaskStatus;
        
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
            Some(serde_json::from_str(rule_json)
                .map_err(|e| format!("Failed to parse recurrence_rule: {}", e))?)
        } else {
            None
        };

        // アサインされたユーザーIDリストJSONをパース
        let assigned_user_ids = if let Some(users_json) = &self.assigned_user_ids {
            let string_ids: Vec<String> = serde_json::from_str(users_json)
                .map_err(|e| format!("Failed to parse assigned_user_ids: {}", e))?;
            string_ids.into_iter().map(|id| crate::types::id_types::UserId::from(id)).collect()
        } else {
            vec![]
        };

        // タグIDリストJSONをパース
        let tag_ids = if let Some(tags_json) = &self.tag_ids {
            let string_ids: Vec<String> = serde_json::from_str(tags_json)
                .map_err(|e| format!("Failed to parse tag_ids: {}", e))?;
            string_ids.into_iter().map(|id| crate::types::id_types::TagId::from(id)).collect()
        } else {
            vec![]
        };

        use crate::types::id_types::{SubTaskId, TaskId};
        
        Ok(Subtask {
            id: SubTaskId::from(self.id.clone()),
            task_id: TaskId::from(self.task_id.clone()),
            title: self.title.clone(),
            description: self.description.clone(),
            status,
            priority: self.priority,
            start_date: self.start_date,
            end_date: self.end_date,
            is_range_date: self.is_range_date,
            recurrence_rule,
            assigned_user_ids,
            tag_ids,
            order_index: self.order_index,
            completed: self.completed,
            created_at: self.created_at,
            updated_at: self.updated_at,
        })
    }
}

/// ドメインモデルからSQLiteモデルへの変換
impl DomainToSqliteConverter<ActiveModel> for Subtask {
    async fn to_sqlite_model(&self) -> Result<ActiveModel, String> {
        // enumを文字列に変換
        let status_string = match &self.status {
            crate::types::task_types::TaskStatus::NotStarted => "not_started",
            crate::types::task_types::TaskStatus::InProgress => "in_progress",
            crate::types::task_types::TaskStatus::Waiting => "waiting",
            crate::types::task_types::TaskStatus::Completed => "completed",
            crate::types::task_types::TaskStatus::Cancelled => "cancelled",
        }.to_string();

        // 繰り返しルールをJSONに変換
        let recurrence_rule_json = if let Some(rule) = &self.recurrence_rule {
            Some(serde_json::to_string(rule)
                .map_err(|e| format!("Failed to serialize recurrence_rule: {}", e))?)
        } else {
            None
        };

        // アサインされたユーザーIDリストをJSONに変換
        let assigned_user_ids_json = if !self.assigned_user_ids.is_empty() {
            let string_ids: Vec<String> = self.assigned_user_ids.iter().map(|id| id.to_string()).collect();
            Some(serde_json::to_string(&string_ids)
                .map_err(|e| format!("Failed to serialize assigned_user_ids: {}", e))?)
        } else {
            None
        };

        // タグIDリストをJSONに変換
        let tag_ids_json = if !self.tag_ids.is_empty() {
            let string_ids: Vec<String> = self.tag_ids.iter().map(|id| id.to_string()).collect();
            Some(serde_json::to_string(&string_ids)
                .map_err(|e| format!("Failed to serialize tag_ids: {}", e))?)
        } else {
            None
        };

        Ok(ActiveModel {
            id: Set(self.id.to_string()),
            task_id: Set(self.task_id.to_string()),
            title: Set(self.title.clone()),
            description: Set(self.description.clone()),
            status: Set(status_string),
            priority: Set(self.priority),
            start_date: Set(self.start_date),
            end_date: Set(self.end_date),
            is_range_date: Set(self.is_range_date),
            recurrence_rule: Set(recurrence_rule_json),
            assigned_user_ids: Set(assigned_user_ids_json),
            tag_ids: Set(tag_ids_json),
            order_index: Set(self.order_index),
            completed: Set(self.completed),
            created_at: Set(self.created_at),
            updated_at: Set(self.updated_at),
        })
    }
}