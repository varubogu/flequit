//! TaskAssignment用SQLiteリポジトリ

use super::super::database_manager::DatabaseManager;
use crate::errors::sqlite_error::SQLiteError;
use crate::models::task_assignments::{Column, Entity as TaskAssignmentEntity};
use flequit_model::types::id_types::{UserId, TaskId};
use flequit_types::errors::repository_error::RepositoryError;
use chrono::Utc;
use sea_orm::{
    ActiveModelTrait, ActiveValue::Set, ColumnTrait, ConnectionTrait, EntityTrait, QueryFilter,
};
use std::sync::Arc;
use tokio::sync::RwLock;

#[derive(Debug)]
pub struct TaskAssignmentLocalSqliteRepository {
    db_manager: Arc<RwLock<DatabaseManager>>,
}

impl TaskAssignmentLocalSqliteRepository {
    pub fn new(db_manager: Arc<RwLock<DatabaseManager>>) -> Self {
        Self { db_manager }
    }

    /// 指定タスクのユーザーIDリストを取得
    pub async fn find_user_ids_by_task_id(
        &self,
        task_id: &TaskId,
    ) -> Result<Vec<UserId>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await.map_err(|e| RepositoryError::from(e))?;

        let models = TaskAssignmentEntity::find()
            .filter(Column::TaskId.eq(task_id.to_string()))
            .all(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        let user_ids = models
            .into_iter()
            .map(|model| UserId::from(model.user_id))
            .collect();

        Ok(user_ids)
    }

    /// 指定ユーザーに関連するタスクIDリストを取得
    pub async fn find_task_ids_by_user_id(
        &self,
        user_id: &UserId,
    ) -> Result<Vec<TaskId>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await.map_err(|e| RepositoryError::from(e))?;

        let models = TaskAssignmentEntity::find()
            .filter(Column::UserId.eq(user_id.to_string()))
            .all(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        let task_ids = models
            .into_iter()
            .map(|model| TaskId::from(model.task_id))
            .collect();

        Ok(task_ids)
    }

    /// タスクとユーザーの割り当てを追加
    pub async fn add_assignment(
        &self,
        task_id: &TaskId,
        user_id: &UserId,
    ) -> Result<(), RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await.map_err(|e| RepositoryError::from(e))?;

        // 既存の割り当てが存在するかチェック
        let existing = TaskAssignmentEntity::find()
            .filter(Column::TaskId.eq(task_id.to_string()))
            .filter(Column::UserId.eq(user_id.to_string()))
            .one(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        if existing.is_none() {
            // 割り当てが存在しない場合のみ追加
            let active_model = crate::models::task_assignments::ActiveModel {
                task_id: Set(task_id.to_string()),
                user_id: Set(user_id.to_string()),
                created_at: Set(Utc::now()),
            };

            active_model.insert(db).await
                .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;
        }

        Ok(())
    }

    /// タスクとユーザーの割り当てを削除
    pub async fn remove_assignment(
        &self,
        task_id: &TaskId,
        user_id: &UserId,
    ) -> Result<(), RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await.map_err(|e| RepositoryError::from(e))?;

        TaskAssignmentEntity::delete_many()
            .filter(Column::TaskId.eq(task_id.to_string()))
            .filter(Column::UserId.eq(user_id.to_string()))
            .exec(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        Ok(())
    }

    /// 指定タスクの全ての割り当てを削除
    pub async fn remove_all_assignments_by_task_id(
        &self,
        task_id: &TaskId,
    ) -> Result<(), RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await.map_err(|e| RepositoryError::from(e))?;

        TaskAssignmentEntity::delete_many()
            .filter(Column::TaskId.eq(task_id.to_string()))
            .exec(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        Ok(())
    }

    /// 指定ユーザーの全ての割り当てを削除
    pub async fn remove_all_assignments_by_user_id(
        &self,
        user_id: &UserId,
    ) -> Result<(), RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await.map_err(|e| RepositoryError::from(e))?;

        TaskAssignmentEntity::delete_many()
            .filter(Column::UserId.eq(user_id.to_string()))
            .exec(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        Ok(())
    }

    /// タスクのユーザー割り当てを一括更新（既存をすべて削除して新しい割り当てを追加）
    pub async fn update_task_assignments<C>(
        &self,
        db: &C,
        task_id: &TaskId,
        user_ids: &[UserId],
    ) -> Result<(), SQLiteError>
    where
        C: ConnectionTrait,
    {
        // 既存の割り当てを削除
        TaskAssignmentEntity::delete_many()
            .filter(Column::TaskId.eq(task_id.to_string()))
            .exec(db)
            .await?;

        // 新しい割り当てを追加
        for user_id in user_ids {
            let active_model = crate::models::task_assignments::ActiveModel {
                task_id: Set(task_id.to_string()),
                user_id: Set(user_id.to_string()),
                created_at: Set(Utc::now()),
            };

            active_model.insert(db).await?;
        }

        Ok(())
    }
}