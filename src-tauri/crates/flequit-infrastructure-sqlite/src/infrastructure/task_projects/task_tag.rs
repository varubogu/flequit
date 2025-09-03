//! TaskTag用SQLiteリポジトリ

use super::super::database_manager::DatabaseManager;
use crate::errors::sqlite_error::SQLiteError;
use crate::models::task_tag::{Column, Entity as TaskTagEntity};
use flequit_model::types::id_types::{TagId, TaskId};
use flequit_types::errors::repository_error::RepositoryError;
use chrono::Utc;
use sea_orm::{
    ActiveModelTrait, ActiveValue::Set, ColumnTrait, ConnectionTrait, EntityTrait, QueryFilter,
};
use std::sync::Arc;
use tokio::sync::RwLock;

#[derive(Debug)]
pub struct TaskTagLocalSqliteRepository {
    db_manager: Arc<RwLock<DatabaseManager>>,
}

impl TaskTagLocalSqliteRepository {
    pub fn new(db_manager: Arc<RwLock<DatabaseManager>>) -> Self {
        Self { db_manager }
    }

    /// 指定タスクのタグIDリストを取得
    pub async fn find_tag_ids_by_task_id(
        &self,
        task_id: &TaskId,
    ) -> Result<Vec<TagId>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await.map_err(|e| RepositoryError::from(e))?;

        let models = TaskTagEntity::find()
            .filter(Column::TaskId.eq(task_id.to_string()))
            .all(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        let tag_ids = models
            .into_iter()
            .map(|model| TagId::from(model.tag_id))
            .collect();

        Ok(tag_ids)
    }

    /// 指定タグに関連するタスクIDリストを取得
    pub async fn find_task_ids_by_tag_id(
        &self,
        tag_id: &TagId,
    ) -> Result<Vec<TaskId>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await.map_err(|e| RepositoryError::from(e))?;

        let models = TaskTagEntity::find()
            .filter(Column::TagId.eq(tag_id.to_string()))
            .all(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        let task_ids = models
            .into_iter()
            .map(|model| TaskId::from(model.task_id))
            .collect();

        Ok(task_ids)
    }

    /// タスクとタグの関連付けを追加
    pub async fn add_relation(
        &self,
        task_id: &TaskId,
        tag_id: &TagId,
    ) -> Result<(), RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await.map_err(|e| RepositoryError::from(e))?;

        // 既存の関連が存在するかチェック
        let existing = TaskTagEntity::find()
            .filter(Column::TaskId.eq(task_id.to_string()))
            .filter(Column::TagId.eq(tag_id.to_string()))
            .one(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        if existing.is_none() {
            // 関連が存在しない場合のみ追加
            let active_model = crate::models::task_tag::ActiveModel {
                task_id: Set(task_id.to_string()),
                tag_id: Set(tag_id.to_string()),
                created_at: Set(Utc::now()),
            };

            active_model.insert(db).await
                .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;
        }

        Ok(())
    }

    /// タスクとタグの関連付けを削除
    pub async fn remove_relation(
        &self,
        task_id: &TaskId,
        tag_id: &TagId,
    ) -> Result<(), RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await.map_err(|e| RepositoryError::from(e))?;

        TaskTagEntity::delete_many()
            .filter(Column::TaskId.eq(task_id.to_string()))
            .filter(Column::TagId.eq(tag_id.to_string()))
            .exec(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        Ok(())
    }

    /// 指定タスクの全ての関連付けを削除
    pub async fn remove_all_relations_by_task_id(
        &self,
        task_id: &TaskId,
    ) -> Result<(), RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await.map_err(|e| RepositoryError::from(e))?;

        TaskTagEntity::delete_many()
            .filter(Column::TaskId.eq(task_id.to_string()))
            .exec(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        Ok(())
    }

    /// 指定タグの全ての関連付けを削除
    pub async fn remove_all_relations_by_tag_id(
        &self,
        tag_id: &TagId,
    ) -> Result<(), RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await.map_err(|e| RepositoryError::from(e))?;

        TaskTagEntity::delete_many()
            .filter(Column::TagId.eq(tag_id.to_string()))
            .exec(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        Ok(())
    }

    /// タスクのタグ関連付けを一括更新（既存をすべて削除して新しい関連を追加）
    pub async fn update_task_tag_relations<C>(
        &self,
        db: &C,
        task_id: &TaskId,
        tag_ids: &[TagId],
    ) -> Result<(), SQLiteError>
    where
        C: ConnectionTrait,
    {
        // 既存の関連付けを削除
        TaskTagEntity::delete_many()
            .filter(Column::TaskId.eq(task_id.to_string()))
            .exec(db)
            .await?;

        // 新しい関連付けを追加
        for tag_id in tag_ids {
            let active_model = crate::models::task_tag::ActiveModel {
                task_id: Set(task_id.to_string()),
                tag_id: Set(tag_id.to_string()),
                created_at: Set(Utc::now()),
            };

            active_model.insert(db).await?;
        }

        Ok(())
    }
}