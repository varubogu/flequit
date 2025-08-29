//! SubtaskAssignment用SQLiteリポジトリ

use super::database_manager::DatabaseManager;
use crate::errors::repository_error::RepositoryError;
use crate::models::sqlite::subtask_assignments::{Column, Entity as SubtaskAssignmentEntity};
use flequit_model::types::id_types::{UserId, SubTaskId};
use chrono::Utc;
use sea_orm::{
    ActiveModelTrait, ActiveValue::Set, ColumnTrait, ConnectionTrait, EntityTrait, QueryFilter,
};
use std::sync::Arc;
use tokio::sync::RwLock;

#[derive(Debug)]
pub struct SubtaskAssignmentLocalSqliteRepository {
    db_manager: Arc<RwLock<DatabaseManager>>,
}

impl SubtaskAssignmentLocalSqliteRepository {
    pub fn new(db_manager: Arc<RwLock<DatabaseManager>>) -> Self {
        Self { db_manager }
    }

    /// 指定サブタスクのユーザーIDリストを取得
    pub async fn find_user_ids_by_subtask_id(
        &self,
        subtask_id: &SubTaskId,
    ) -> Result<Vec<UserId>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await?;

        let models = SubtaskAssignmentEntity::find()
            .filter(Column::SubtaskId.eq(subtask_id.to_string()))
            .all(db)
            .await?;

        let user_ids = models
            .into_iter()
            .map(|model| UserId::from(model.user_id))
            .collect();

        Ok(user_ids)
    }

    /// 指定ユーザーに関連するサブタスクIDリストを取得
    pub async fn find_subtask_ids_by_user_id(
        &self,
        user_id: &UserId,
    ) -> Result<Vec<SubTaskId>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await?;

        let models = SubtaskAssignmentEntity::find()
            .filter(Column::UserId.eq(user_id.to_string()))
            .all(db)
            .await?;

        let subtask_ids = models
            .into_iter()
            .map(|model| SubTaskId::from(model.subtask_id))
            .collect();

        Ok(subtask_ids)
    }

    /// サブタスクとユーザーの割り当てを追加
    pub async fn add_assignment(
        &self,
        subtask_id: &SubTaskId,
        user_id: &UserId,
    ) -> Result<(), RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await?;

        // 既存の割り当てが存在するかチェック
        let existing = SubtaskAssignmentEntity::find()
            .filter(Column::SubtaskId.eq(subtask_id.to_string()))
            .filter(Column::UserId.eq(user_id.to_string()))
            .one(db)
            .await?;

        if existing.is_none() {
            // 割り当てが存在しない場合のみ追加
            let active_model = crate::models::sqlite::subtask_assignments::ActiveModel {
                subtask_id: Set(subtask_id.to_string()),
                user_id: Set(user_id.to_string()),
                created_at: Set(Utc::now()),
            };

            active_model.insert(db).await?;
        }

        Ok(())
    }

    /// サブタスクとユーザーの割り当てを削除
    pub async fn remove_assignment(
        &self,
        subtask_id: &SubTaskId,
        user_id: &UserId,
    ) -> Result<(), RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await?;

        SubtaskAssignmentEntity::delete_many()
            .filter(Column::SubtaskId.eq(subtask_id.to_string()))
            .filter(Column::UserId.eq(user_id.to_string()))
            .exec(db)
            .await?;

        Ok(())
    }

    /// 指定サブタスクの全ての割り当てを削除
    pub async fn remove_all_assignments_by_subtask_id(
        &self,
        subtask_id: &SubTaskId,
    ) -> Result<(), RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await?;

        SubtaskAssignmentEntity::delete_many()
            .filter(Column::SubtaskId.eq(subtask_id.to_string()))
            .exec(db)
            .await?;

        Ok(())
    }

    /// 指定ユーザーの全ての割り当てを削除
    pub async fn remove_all_assignments_by_user_id(
        &self,
        user_id: &UserId,
    ) -> Result<(), RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await?;

        SubtaskAssignmentEntity::delete_many()
            .filter(Column::UserId.eq(user_id.to_string()))
            .exec(db)
            .await?;

        Ok(())
    }

    /// サブタスクのユーザー割り当てを一括更新（既存をすべて削除して新しい割り当てを追加）
    pub async fn update_subtask_assignments<C>(
        &self,
        db: &C,
        subtask_id: &SubTaskId,
        user_ids: &[UserId],
    ) -> Result<(), RepositoryError>
    where
        C: ConnectionTrait,
    {
        // 既存の割り当てを削除
        SubtaskAssignmentEntity::delete_many()
            .filter(Column::SubtaskId.eq(subtask_id.to_string()))
            .exec(db)
            .await?;

        // 新しい割り当てを追加
        for user_id in user_ids {
            let active_model = crate::models::sqlite::subtask_assignments::ActiveModel {
                subtask_id: Set(subtask_id.to_string()),
                user_id: Set(user_id.to_string()),
                created_at: Set(Utc::now()),
            };

            active_model.insert(db).await?;
        }

        Ok(())
    }
}