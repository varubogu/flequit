use async_trait::async_trait;
use chrono::{DateTime, Utc};
use flequit_model::{
    models::task_projects::task::Task,
    types::{
        id_types::{ProjectId, TaskId, TaskListId, UserId},
        task_types::TaskStatus,
    },
};
use sea_orm::{entity::prelude::*, Set};
use serde::{Deserialize, Serialize};

use crate::models::DomainToSqliteConverterWithProjectId;

use super::{DomainToSqliteConverter, SqliteModelConverter};

/// Task用SQLiteエンティティ定義
///
/// タスク管理の高速検索・ソートに最適化
/// ステータス、優先度、日時での複合検索に対応
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "tasks")]
pub struct Model {
    /// プロジェクトID（SQLite統合テーブル用）
    #[sea_orm(primary_key, auto_increment = false)]
    pub project_id: String,

    /// タスクの一意識別子
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: String,

    /// 所属タスクリストID
    #[sea_orm(indexed)] // タスクリスト別検索用
    pub list_id: String,

    /// タスクタイトル
    #[sea_orm(indexed)] // タイトル検索用
    pub title: String,

    /// タスク説明
    pub description: Option<String>,

    /// タスクステータス（文字列形式）
    #[sea_orm(indexed)] // ステータス別検索用
    pub status: String,

    /// 優先度（数値）
    #[sea_orm(indexed)] // 優先度別検索用
    pub priority: i32,

    /// 開始日時
    #[sea_orm(indexed)] // 日時範囲検索用
    pub start_date: Option<DateTime<Utc>>,

    /// 終了日時
    #[sea_orm(indexed)] // 日時範囲検索用
    pub end_date: Option<DateTime<Utc>>,

    /// 期間指定フラグ
    pub is_range_date: Option<bool>,

    /// 表示順序
    #[sea_orm(indexed)] // ソート用
    pub order_index: i32,

    /// アーカイブ状態フラグ
    #[sea_orm(indexed)] // アーカイブフィルタ用
    pub is_archived: bool,

    /// 作成日時
    #[sea_orm(indexed)] // 作成日順ソート用
    pub created_at: DateTime<Utc>,

    /// 更新日時
    pub updated_at: DateTime<Utc>,

    /// 論理削除フラグ
    #[sea_orm(indexed)] // 削除済みデータのフィルタ用
    pub deleted: bool,

    /// 最終更新者のユーザーID
    pub updated_by: String,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::project::Entity",
        from = "Column::ProjectId",
        to = "super::project::Column::Id"
    )]
    Project,
    #[sea_orm(
        belongs_to = "super::task_list::Entity",
        from = "(Column::ProjectId, Column::ListId)",
        to = "(super::task_list::Column::ProjectId, super::task_list::Column::Id)"
    )]
    TaskList,
    #[sea_orm(has_many = "super::subtask::Entity")]
    Subtasks,
}

impl Related<super::project::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Project.def()
    }
}

impl Related<super::task_list::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::TaskList.def()
    }
}

impl Related<super::subtask::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Subtasks.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}

/// SQLiteモデルからドメインモデルへの変換
#[async_trait]
impl SqliteModelConverter<Task> for Model {
    async fn to_domain_model(&self) -> Result<Task, String> {
        // ステータス文字列をenumに変換
        let status = match self.status.as_str() {
            "not_started" => TaskStatus::NotStarted,
            "in_progress" => TaskStatus::InProgress,
            "waiting" => TaskStatus::Waiting,
            "completed" => TaskStatus::Completed,
            "cancelled" => TaskStatus::Cancelled,
            _ => return Err(format!("Unknown task status: {}", self.status)),
        };

        // 繰り返しルールと担当ユーザーは紐づけテーブルから取得するため、
        // SQLiteモデルでは空の値を設定
        let recurrence_rule = None;
        let assigned_user_ids = vec![];

        // タグIDリストは紐づけテーブル(task_tags)から取得するため、
        // SQLiteモデルでは空のベクターを設定
        let tag_ids = vec![];

        Ok(Task {
            id: TaskId::from(self.id.clone()),
            project_id: ProjectId::from(self.project_id.clone()),
            list_id: TaskListId::from(self.list_id.clone()),
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
            order_index: self.order_index,
            is_archived: self.is_archived,
            created_at: self.created_at,
            updated_at: self.updated_at,
            deleted: self.deleted,
            updated_by: UserId::from(self.updated_by.clone()),
        })
    }
}

/// ドメインモデルからSQLiteモデルへの変換
#[async_trait]
impl DomainToSqliteConverter<ActiveModel> for Task {
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

        // 繰り返しルールと担当ユーザーは紐づけテーブルで管理するため、
        // SQLiteのtasksテーブルには保存しない
        // タグIDリストは紐づけテーブル(task_tags)で管理するため、
        // SQLiteのtasksテーブルには保存しない

        Ok(ActiveModel {
            id: Set(self.id.to_string()),
            project_id: Set(self.project_id.to_string()),
            list_id: Set(self.list_id.to_string()),
            title: Set(self.title.clone()),
            description: Set(self.description.clone()),
            status: Set(status_string),
            priority: Set(self.priority),
            start_date: Set(self.plan_start_date),
            end_date: Set(self.plan_end_date),
            is_range_date: Set(self.is_range_date),
            order_index: Set(self.order_index),
            is_archived: Set(self.is_archived),
            created_at: Set(self.created_at),
            updated_at: Set(self.updated_at),
            deleted: Set(self.deleted),
            updated_by: Set(self.updated_by.to_string()),
        })
    }
}

/// プロジェクトID付きのドメインモデルからSQLiteモデルへの変換
#[async_trait]
impl DomainToSqliteConverterWithProjectId<ActiveModel> for Task {
    async fn to_sqlite_model_with_project_id(
        &self,
        project_id: &ProjectId,
    ) -> Result<ActiveModel, String> {
        // enumを文字列に変換
        let status_string = match &self.status {
            TaskStatus::NotStarted => "not_started",
            TaskStatus::InProgress => "in_progress",
            TaskStatus::Waiting => "waiting",
            TaskStatus::Completed => "completed",
            TaskStatus::Cancelled => "cancelled",
        }
        .to_string();

        // 繰り返しルールと担当ユーザーは紐づけテーブルで管理するため、
        // SQLiteのtasksテーブルには保存しない
        // タグIDリストは紐づけテーブル(task_tags)で管理するため、
        // SQLiteのtasksテーブルには保存しない

        Ok(ActiveModel {
            id: Set(self.id.to_string()),
            project_id: Set(project_id.to_string()),
            list_id: Set(self.list_id.to_string()),
            title: Set(self.title.clone()),
            description: Set(self.description.clone()),
            status: Set(status_string),
            priority: Set(self.priority),
            start_date: Set(self.plan_start_date),
            end_date: Set(self.plan_end_date),
            is_range_date: Set(self.is_range_date),
            order_index: Set(self.order_index),
            is_archived: Set(self.is_archived),
            created_at: Set(self.created_at),
            updated_at: Set(self.updated_at),
            deleted: Set(self.deleted),
            updated_by: Set(self.updated_by.to_string()),
        })
    }
}
