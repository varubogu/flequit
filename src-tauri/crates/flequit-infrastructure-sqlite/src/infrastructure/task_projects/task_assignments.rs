//! TaskAssignment用SQLiteリポジトリ

use super::super::database_manager::DatabaseManager;
use crate::errors::sqlite_error::SQLiteError;
use crate::models::task_assignments::{Column, Entity as TaskAssignmentEntity};
use crate::models::SqliteModelConverter;
use async_trait::async_trait;
use chrono::{DateTime, Utc};
use flequit_model::models::task_projects::task_assignment::TaskAssignment;
use flequit_model::types::id_types::{ProjectId, TaskId, UserId};
use flequit_repository::repositories::project_relation_repository_trait::ProjectRelationRepository;
use flequit_types::errors::repository_error::RepositoryError;
use sea_orm::{
    ActiveModelTrait, ActiveValue::Set, ColumnTrait, ConnectionTrait, EntityTrait, PaginatorTrait,
    QueryFilter,
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
        let db = db_manager
            .get_connection()
            .await
            .map_err(|e| RepositoryError::from(e))?;

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
        let db = db_manager
            .get_connection()
            .await
            .map_err(|e| RepositoryError::from(e))?;

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
        project_id: &ProjectId,
        task_id: &TaskId,
        user_id: &UserId,
    ) -> Result<(), RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(|e| RepositoryError::from(e))?;

        // 既存の割り当てが存在するかチェック
        let existing = TaskAssignmentEntity::find()
            .filter(Column::TaskId.eq(task_id.to_string()))
            .filter(Column::UserId.eq(user_id.to_string()))
            .one(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        if existing.is_none() {
            // 割り当てが存在しない場合のみ追加
            let now = Utc::now();
            let active_model = crate::models::task_assignments::ActiveModel {
                task_id: Set(task_id.to_string()),
                project_id: Set(project_id.to_string()),
                user_id: Set(user_id.to_string()),
                created_at: Set(now),
                updated_at: Set(now),
                deleted: Set(false),
                updated_by: Set(user_id.to_string()),
            };

            active_model
                .insert(db)
                .await
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
        let db = db_manager
            .get_connection()
            .await
            .map_err(|e| RepositoryError::from(e))?;

        TaskAssignmentEntity::delete_many()
            .filter(Column::TaskId.eq(task_id.to_string()))
            .filter(Column::UserId.eq(user_id.to_string()))
            .exec(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        Ok(())
    }

    /// 指定タスクの全ての割り当てをトランザクション内で削除
    ///
    /// トランザクションは呼び出し側（Facade層）が管理します。
    pub async fn remove_all_by_task_id_with_txn(
        &self,
        txn: &sea_orm::DatabaseTransaction,
        task_id: &TaskId,
    ) -> Result<(), RepositoryError> {
        TaskAssignmentEntity::delete_many()
            .filter(Column::TaskId.eq(task_id.to_string()))
            .exec(txn)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        Ok(())
    }

    /// 指定タスクの全ての割り当てを削除
    ///
    /// **非推奨**: このメソッドは後方互換性のために残されています。
    /// 新しいコードではFacade層でトランザクションを管理し、`remove_all_by_task_id_with_txn`を使用してください。
    pub async fn remove_all_assignments_by_task_id(
        &self,
        task_id: &TaskId,
    ) -> Result<(), RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(|e| RepositoryError::from(e))?;

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
        let db = db_manager
            .get_connection()
            .await
            .map_err(|e| RepositoryError::from(e))?;

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
        project_id: &ProjectId,
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
            let now = Utc::now();
            let active_model = crate::models::task_assignments::ActiveModel {
                task_id: Set(task_id.to_string()),
                project_id: Set(project_id.to_string()),
                user_id: Set(user_id.to_string()),
                created_at: Set(now),
                updated_at: Set(now),
                deleted: Set(false),
                updated_by: Set(user_id.to_string()),
            };

            active_model.insert(db).await?;
        }

        Ok(())
    }
}

#[async_trait]
impl ProjectRelationRepository<TaskAssignment, TaskId, UserId>
    for TaskAssignmentLocalSqliteRepository
{
    async fn add(
        &self,
        project_id: &ProjectId,
        parent_id: &TaskId,
        child_id: &UserId,
        _user_id: &UserId,
        _timestamp: &DateTime<Utc>,
    ) -> Result<(), RepositoryError> {
        self.add_assignment(project_id, parent_id, child_id).await
    }

    async fn remove(
        &self,
        _project_id: &ProjectId,
        parent_id: &TaskId,
        child_id: &UserId,
    ) -> Result<(), RepositoryError> {
        self.remove_assignment(parent_id, child_id).await
    }

    async fn remove_all(
        &self,
        _project_id: &ProjectId,
        parent_id: &TaskId,
    ) -> Result<(), RepositoryError> {
        self.remove_all_assignments_by_task_id(parent_id).await
    }

    async fn find_relations(
        &self,
        _project_id: &ProjectId,
        parent_id: &TaskId,
    ) -> Result<Vec<TaskAssignment>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(|e| RepositoryError::from(e))?;

        let models = TaskAssignmentEntity::find()
            .filter(Column::TaskId.eq(parent_id.to_string()))
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
        parent_id: &TaskId,
    ) -> Result<bool, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(|e| RepositoryError::from(e))?;

        let count = TaskAssignmentEntity::find()
            .filter(Column::TaskId.eq(parent_id.to_string()))
            .count(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        Ok(count > 0)
    }

    async fn count(
        &self,
        _project_id: &ProjectId,
        parent_id: &TaskId,
    ) -> Result<u64, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(|e| RepositoryError::from(e))?;

        let count = TaskAssignmentEntity::find()
            .filter(Column::TaskId.eq(parent_id.to_string()))
            .count(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        Ok(count)
    }

    async fn find_all(
        &self,
        _project_id: &ProjectId,
    ) -> Result<Vec<TaskAssignment>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(|e| RepositoryError::from(e))?;

        let models = TaskAssignmentEntity::find()
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
        parent_id: &TaskId,
        child_id: &UserId,
    ) -> Result<Option<TaskAssignment>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(|e| RepositoryError::from(e))?;

        let model = TaskAssignmentEntity::find()
            .filter(Column::TaskId.eq(parent_id.to_string()))
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
