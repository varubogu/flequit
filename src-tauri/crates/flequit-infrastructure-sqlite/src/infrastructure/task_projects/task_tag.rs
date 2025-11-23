//! TaskTag用SQLiteリポジトリ

use super::super::database_manager::DatabaseManager;
use crate::errors::sqlite_error::SQLiteError;
use crate::models::task_tag::{Column, Entity as TaskTagEntity};
use crate::models::SqliteModelConverter;
use async_trait::async_trait;
use chrono::{DateTime, Utc};
use flequit_model::models::task_projects::task_tag::TaskTag;
use flequit_model::types::id_types::{ProjectId, TagId, TaskId, UserId};
use flequit_repository::repositories::project_relation_repository_trait::ProjectRelationRepository;
use flequit_types::errors::repository_error::RepositoryError;
use sea_orm::{
    ActiveModelTrait, ActiveValue::Set, ColumnTrait, ConnectionTrait, EntityTrait, PaginatorTrait,
    QueryFilter,
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
        project_id: &ProjectId,
        task_id: &TaskId,
    ) -> Result<Vec<TagId>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(|e| RepositoryError::from(e))?;

        let models = TaskTagEntity::find()
            .filter(Column::ProjectId.eq(project_id.to_string()))
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
        project_id: &ProjectId,
        tag_id: &TagId,
    ) -> Result<Vec<TaskId>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(|e| RepositoryError::from(e))?;

        let models = TaskTagEntity::find()
            .filter(Column::ProjectId.eq(project_id.to_string()))
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
        project_id: &ProjectId,
        task_id: &TaskId,
        tag_id: &TagId,
    ) -> Result<(), RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(|e| RepositoryError::from(e))?;

        // 既存の関連が存在するかチェック
        let existing = TaskTagEntity::find()
            .filter(Column::ProjectId.eq(project_id.to_string()))
            .filter(Column::TaskId.eq(task_id.to_string()))
            .filter(Column::TagId.eq(tag_id.to_string()))
            .one(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        if existing.is_none() {
            // 関連が存在しない場合のみ追加
            let now = Utc::now();
            let active_model = crate::models::task_tag::ActiveModel {
                task_id: Set(task_id.to_string()),
                project_id: Set(project_id.to_string()),
                tag_id: Set(tag_id.to_string()),
                created_at: Set(now),
                updated_at: Set(now),
                deleted: Set(false),
                updated_by: Set(project_id.to_string()),
            };

            log::info!(
                "SQLite TaskTag INSERT - project: {}, task: {}, tag: {}",
                project_id,
                task_id,
                tag_id
            );

            active_model
                .insert(db)
                .await
                .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;
        }

        Ok(())
    }

    /// タスクとタグの関連付けを削除
    pub async fn remove_relation(
        &self,
        project_id: &ProjectId,
        task_id: &TaskId,
        tag_id: &TagId,
    ) -> Result<(), RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(|e| RepositoryError::from(e))?;

        TaskTagEntity::delete_many()
            .filter(Column::ProjectId.eq(project_id.to_string()))
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
        project_id: &ProjectId,
        task_id: &TaskId,
    ) -> Result<(), RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(|e| RepositoryError::from(e))?;

        TaskTagEntity::delete_many()
            .filter(Column::ProjectId.eq(project_id.to_string()))
            .filter(Column::TaskId.eq(task_id.to_string()))
            .exec(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        Ok(())
    }

    /// 指定タグの全ての関連付けをトランザクション内で削除
    ///
    /// トランザクションは呼び出し側（Facade層）が管理します。
    pub async fn remove_all_by_tag_id_with_txn(
        &self,
        txn: &sea_orm::DatabaseTransaction,
        project_id: &ProjectId,
        tag_id: &TagId,
    ) -> Result<(), RepositoryError> {
        TaskTagEntity::delete_many()
            .filter(Column::ProjectId.eq(project_id.to_string()))
            .filter(Column::TagId.eq(tag_id.to_string()))
            .exec(txn)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        Ok(())
    }

    /// 指定タグの全ての関連付けを削除
    ///
    /// **非推奨**: このメソッドは後方互換性のために残されています。
    /// 新しいコードではFacade層でトランザクションを管理し、`remove_all_by_tag_id_with_txn`を使用してください。
    pub async fn remove_all_relations_by_tag_id(
        &self,
        project_id: &ProjectId,
        tag_id: &TagId,
    ) -> Result<(), RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(|e| RepositoryError::from(e))?;

        TaskTagEntity::delete_many()
            .filter(Column::ProjectId.eq(project_id.to_string()))
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
        project_id: &ProjectId,
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
            let now = Utc::now();
            let active_model = crate::models::task_tag::ActiveModel {
                task_id: Set(task_id.to_string()),
                project_id: Set(project_id.to_string()),
                tag_id: Set(tag_id.to_string()),
                created_at: Set(now),
                updated_at: Set(now),
                deleted: Set(false),
                updated_by: Set(project_id.to_string()),
            };

            active_model.insert(db).await?;
        }

        Ok(())
    }
}

#[async_trait]
impl ProjectRelationRepository<TaskTag, TaskId, TagId> for TaskTagLocalSqliteRepository {
    async fn add(
        &self,
        project_id: &ProjectId,
        parent_id: &TaskId,
        child_id: &TagId,
        _user_id: &UserId,
        _timestamp: &DateTime<Utc>,
    ) -> Result<(), RepositoryError> {
        self.add_relation(project_id, parent_id, child_id).await
    }

    async fn remove(
        &self,
        project_id: &ProjectId,
        parent_id: &TaskId,
        child_id: &TagId,
    ) -> Result<(), RepositoryError> {
        self.remove_relation(project_id, parent_id, child_id).await
    }

    async fn remove_all(
        &self,
        project_id: &ProjectId,
        parent_id: &TaskId,
    ) -> Result<(), RepositoryError> {
        self.remove_all_relations_by_task_id(project_id, parent_id)
            .await
    }

    async fn find_relations(
        &self,
        project_id: &ProjectId,
        parent_id: &TaskId,
    ) -> Result<Vec<TaskTag>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(|e| RepositoryError::from(e))?;

        let models = TaskTagEntity::find()
            .filter(Column::ProjectId.eq(project_id.to_string()))
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
        project_id: &ProjectId,
        parent_id: &TaskId,
    ) -> Result<bool, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(|e| RepositoryError::from(e))?;

        let count = TaskTagEntity::find()
            .filter(Column::ProjectId.eq(project_id.to_string()))
            .filter(Column::TaskId.eq(parent_id.to_string()))
            .count(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        Ok(count > 0)
    }

    async fn count(
        &self,
        project_id: &ProjectId,
        parent_id: &TaskId,
    ) -> Result<u64, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(|e| RepositoryError::from(e))?;

        let count = TaskTagEntity::find()
            .filter(Column::ProjectId.eq(project_id.to_string()))
            .filter(Column::TaskId.eq(parent_id.to_string()))
            .count(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        Ok(count)
    }

    async fn find_all(&self, project_id: &ProjectId) -> Result<Vec<TaskTag>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(|e| RepositoryError::from(e))?;

        let models = TaskTagEntity::find()
            .filter(Column::ProjectId.eq(project_id.to_string()))
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
        project_id: &ProjectId,
        parent_id: &TaskId,
        child_id: &TagId,
    ) -> Result<Option<TaskTag>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(|e| RepositoryError::from(e))?;

        let model = TaskTagEntity::find()
            .filter(Column::ProjectId.eq(project_id.to_string()))
            .filter(Column::TaskId.eq(parent_id.to_string()))
            .filter(Column::TagId.eq(child_id.to_string()))
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
