//! SubtaskAssignment用SQLiteリポジトリ

use super::super::database_manager::DatabaseManager;
use crate::errors::sqlite_error::SQLiteError;
use crate::models::subtask_assignments::{Column, Entity as SubtaskAssignmentEntity};
use crate::models::SqliteModelConverter;
use async_trait::async_trait;
use chrono::Utc;
use flequit_model::models::task_projects::subtask_assignment::SubTaskAssignment;
use flequit_model::types::id_types::{ProjectId, SubTaskId, UserId};
use flequit_repository::repositories::project_relation_repository_trait::ProjectRelationRepository;
use flequit_types::errors::repository_error::RepositoryError;
use sea_orm::{
    ActiveModelTrait, ActiveValue::Set, ColumnTrait, ConnectionTrait, EntityTrait, PaginatorTrait,
    QueryFilter,
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
        let db = db_manager
            .get_connection()
            .await
            .map_err(|e| RepositoryError::from(e))?;

        let models = SubtaskAssignmentEntity::find()
            .filter(Column::SubtaskId.eq(subtask_id.to_string()))
            .all(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

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
        let db = db_manager
            .get_connection()
            .await
            .map_err(|e| RepositoryError::from(e))?;

        let models = SubtaskAssignmentEntity::find()
            .filter(Column::UserId.eq(user_id.to_string()))
            .all(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        let subtask_ids = models
            .into_iter()
            .map(|model| SubTaskId::from(model.subtask_id))
            .collect();

        Ok(subtask_ids)
    }

    /// サブタスクとユーザーの割り当てを追加
    pub async fn add_assignment(
        &self,
        project_id: &ProjectId,
        subtask_id: &SubTaskId,
        user_id: &UserId,
    ) -> Result<(), RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(|e| RepositoryError::from(e))?;

        // 既存の割り当てが存在するかチェック
        let existing = SubtaskAssignmentEntity::find()
            .filter(Column::SubtaskId.eq(subtask_id.to_string()))
            .filter(Column::UserId.eq(user_id.to_string()))
            .one(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        if existing.is_none() {
            // 割り当てが存在しない場合のみ追加
            let active_model = crate::models::subtask_assignments::ActiveModel {
                subtask_id: Set(subtask_id.to_string()),
                project_id: Set(project_id.to_string()),
                user_id: Set(user_id.to_string()),
                created_at: Set(Utc::now()),
            };

            active_model
                .insert(db)
                .await
                .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;
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
        let db = db_manager
            .get_connection()
            .await
            .map_err(|e| RepositoryError::from(e))?;

        SubtaskAssignmentEntity::delete_many()
            .filter(Column::SubtaskId.eq(subtask_id.to_string()))
            .filter(Column::UserId.eq(user_id.to_string()))
            .exec(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        Ok(())
    }

    /// 指定サブタスクの全ての割り当てを削除
    pub async fn remove_all_assignments_by_subtask_id(
        &self,
        subtask_id: &SubTaskId,
    ) -> Result<(), RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(|e| RepositoryError::from(e))?;

        SubtaskAssignmentEntity::delete_many()
            .filter(Column::SubtaskId.eq(subtask_id.to_string()))
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
        let db = db_manager
            .get_connection()
            .await
            .map_err(|e| RepositoryError::from(e))?;

        SubtaskAssignmentEntity::delete_many()
            .filter(Column::UserId.eq(user_id.to_string()))
            .exec(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        Ok(())
    }

    /// サブタスクのユーザー割り当てを一括更新（既存をすべて削除して新しい割り当てを追加）
    pub async fn update_subtask_assignments<C>(
        &self,
        db: &C,
        project_id: &ProjectId,
        subtask_id: &SubTaskId,
        user_ids: &[UserId],
    ) -> Result<(), SQLiteError>
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
            let active_model = crate::models::subtask_assignments::ActiveModel {
                subtask_id: Set(subtask_id.to_string()),
                project_id: Set(project_id.to_string()),
                user_id: Set(user_id.to_string()),
                created_at: Set(Utc::now()),
            };

            active_model.insert(db).await?;
        }

        Ok(())
    }
}

#[async_trait]
impl ProjectRelationRepository<SubTaskAssignment, SubTaskId, UserId>
    for SubtaskAssignmentLocalSqliteRepository
{
    async fn add(
        &self,
        project_id: &ProjectId,
        parent_id: &SubTaskId,
        child_id: &UserId,
    ) -> Result<(), RepositoryError> {
        self.add_assignment(project_id, parent_id, child_id).await
    }

    async fn remove(
        &self,
        _project_id: &ProjectId,
        parent_id: &SubTaskId,
        child_id: &UserId,
    ) -> Result<(), RepositoryError> {
        self.remove_assignment(parent_id, child_id).await
    }

    async fn remove_all(
        &self,
        _project_id: &ProjectId,
        parent_id: &SubTaskId,
    ) -> Result<(), RepositoryError> {
        self.remove_all_assignments_by_subtask_id(parent_id).await
    }

    async fn find_relations(
        &self,
        _project_id: &ProjectId,
        parent_id: &SubTaskId,
    ) -> Result<Vec<SubTaskAssignment>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(|e| RepositoryError::from(e))?;

        let models = SubtaskAssignmentEntity::find()
            .filter(Column::SubtaskId.eq(parent_id.to_string()))
            .all(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        let mut domain_models = Vec::new();
        for model in models {
            let domain_model = model
                .to_domain_model()
                .await
                .map_err(|e| RepositoryError::ConversionError(e))?;
            domain_models.push(domain_model);
        }

        Ok(domain_models)
    }

    async fn exists(
        &self,
        _project_id: &ProjectId,
        parent_id: &SubTaskId,
    ) -> Result<bool, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(|e| RepositoryError::from(e))?;

        let count = SubtaskAssignmentEntity::find()
            .filter(Column::SubtaskId.eq(parent_id.to_string()))
            .count(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        Ok(count > 0)
    }

    async fn count(
        &self,
        _project_id: &ProjectId,
        parent_id: &SubTaskId,
    ) -> Result<u64, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(|e| RepositoryError::from(e))?;

        let count = SubtaskAssignmentEntity::find()
            .filter(Column::SubtaskId.eq(parent_id.to_string()))
            .count(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        Ok(count)
    }

    async fn find_all(
        &self,
        _project_id: &ProjectId,
    ) -> Result<Vec<SubTaskAssignment>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(|e| RepositoryError::from(e))?;

        let models = SubtaskAssignmentEntity::find()
            .all(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        let mut domain_models = Vec::new();
        for model in models {
            let domain_model = model
                .to_domain_model()
                .await
                .map_err(|e| RepositoryError::ConversionError(e))?;
            domain_models.push(domain_model);
        }

        Ok(domain_models)
    }

    async fn find_relation(
        &self,
        _project_id: &ProjectId,
        parent_id: &SubTaskId,
        child_id: &UserId,
    ) -> Result<Option<SubTaskAssignment>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(|e| RepositoryError::from(e))?;

        let model = SubtaskAssignmentEntity::find()
            .filter(Column::SubtaskId.eq(parent_id.to_string()))
            .filter(Column::UserId.eq(child_id.to_string()))
            .one(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        match model {
            Some(m) => {
                let domain_model = m
                    .to_domain_model()
                    .await
                    .map_err(|e| RepositoryError::ConversionError(e))?;
                Ok(Some(domain_model))
            }
            None => Ok(None),
        }
    }
}
