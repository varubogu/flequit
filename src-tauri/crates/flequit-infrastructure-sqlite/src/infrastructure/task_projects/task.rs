//! Task用SQLiteリポジトリ

use super::super::database_manager::DatabaseManager;
use super::tag::TagLocalSqliteRepository;
use super::task_tag::TaskTagLocalSqliteRepository;
use crate::errors::sqlite_error::SQLiteError;
use crate::models::task::{Column, Entity as TaskEntity};
use crate::models::{DomainToSqliteConverterWithProjectId, SqliteModelConverter};
use async_trait::async_trait;
use chrono::{DateTime, Utc};
use flequit_model::models::task_projects::task::Task;
use flequit_model::types::id_types::{ProjectId, TaskId, UserId};
use flequit_repository::repositories::project_patchable_trait::ProjectPatchable;
use flequit_repository::repositories::project_repository_trait::ProjectRepository;
use flequit_repository::repositories::task_projects::task_repository_trait::TaskRepositoryTrait;
use flequit_types::errors::repository_error::RepositoryError;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, EntityTrait, PaginatorTrait, QueryFilter, QueryOrder,
    TransactionTrait,
};
use std::sync::Arc;
use tokio::sync::RwLock;

#[derive(Debug)]
pub struct TaskLocalSqliteRepository {
    db_manager: Arc<RwLock<DatabaseManager>>,
    task_tag_repository: TaskTagLocalSqliteRepository,
}

impl TaskLocalSqliteRepository {
    pub fn new(db_manager: Arc<RwLock<DatabaseManager>>) -> Self {
        let task_tag_repository = TaskTagLocalSqliteRepository::new(db_manager.clone());
        Self {
            db_manager,
            task_tag_repository,
        }
    }

    pub async fn find_by_project(
        &self,
        project_id: &ProjectId,
    ) -> Result<Vec<Task>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(|e| RepositoryError::from(e))?;

        let models = TaskEntity::find()
            .filter(Column::ProjectId.eq(project_id.to_string()))
            .filter(Column::IsArchived.eq(false))
            .order_by_asc(Column::OrderIndex)
            .all(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        let mut tasks = Vec::new();
        for model in models {
            let mut task = model
                .to_domain_model()
                .await
                .map_err(|e: String| RepositoryError::from(SQLiteError::ConversionError(e)))?;

            // 紐づけテーブルからタグIDを取得
            task.tag_ids = self
                .task_tag_repository
                .find_tag_ids_by_task_id(project_id, &task.id)
                .await?;

            tasks.push(task);
        }

        Ok(tasks)
    }

    pub async fn find_by_task_list(
        &self,
        project_id: &ProjectId,
        list_id: &str,
    ) -> Result<Vec<Task>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(|e| RepositoryError::from(e))?;

        let models = TaskEntity::find()
            .filter(Column::ListId.eq(list_id))
            .filter(Column::IsArchived.eq(false))
            .order_by_asc(Column::OrderIndex)
            .all(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        let mut tasks = Vec::new();
        for model in models {
            let mut task = model
                .to_domain_model()
                .await
                .map_err(|e: String| RepositoryError::from(SQLiteError::ConversionError(e)))?;

            // 紐づけテーブルからタグIDを取得
            task.tag_ids = self
                .task_tag_repository
                .find_tag_ids_by_task_id(project_id, &task.id)
                .await?;

            tasks.push(task);
        }

        Ok(tasks)
    }

    pub async fn find_by_status(
        &self,
        project_id: &ProjectId,
        status: &str,
    ) -> Result<Vec<Task>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(|e| RepositoryError::from(e))?;

        let models = TaskEntity::find()
            .filter(Column::Status.eq(status))
            .filter(Column::IsArchived.eq(false))
            .order_by_asc(Column::OrderIndex)
            .all(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        let mut tasks = Vec::new();
        for model in models {
            let mut task = model
                .to_domain_model()
                .await
                .map_err(|e: String| RepositoryError::from(SQLiteError::ConversionError(e)))?;

            // 紐づけテーブルからタグIDを取得
            task.tag_ids = self
                .task_tag_repository
                .find_tag_ids_by_task_id(project_id, &task.id)
                .await?;

            tasks.push(task);
        }

        Ok(tasks)
    }

    /// タスクをトランザクション内で削除
    ///
    /// トランザクションは呼び出し側（Facade層）が管理します。
    pub async fn delete_with_txn(
        &self,
        txn: &sea_orm::DatabaseTransaction,
        project_id: &ProjectId,
        id: &TaskId,
    ) -> Result<(), RepositoryError> {
        TaskEntity::delete_by_id((project_id.to_string(), id.to_string()))
            .exec(txn)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;
        Ok(())
    }

    /// 指定プロジェクトの全タスクのIDリストを取得
    pub async fn find_ids_by_project_id(
        &self,
        project_id: &ProjectId,
    ) -> Result<Vec<TaskId>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(|e| RepositoryError::from(e))?;

        let models = TaskEntity::find()
            .filter(Column::ProjectId.eq(project_id.to_string()))
            .all(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        let task_ids = models
            .into_iter()
            .map(|model| TaskId::from(model.id))
            .collect();

        Ok(task_ids)
    }
}

#[async_trait]
impl ProjectRepository<Task, TaskId> for TaskLocalSqliteRepository {
    async fn save(&self, project_id: &ProjectId, task: &Task, _user_id: &UserId, _timestamp: &DateTime<Utc>) -> Result<(), RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(|e| RepositoryError::from(e))?;

        // トランザクション開始
        let txn = db
            .begin()
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        let active_model = task
            .to_sqlite_model_with_project_id(&project_id)
            .await
            .map_err(|e: String| RepositoryError::from(SQLiteError::ConversionError(e)))?;

        // 既存レコードを確認
        let existing = TaskEntity::find_by_id((project_id.to_string(), task.id.to_string()))
            .one(&txn)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        if existing.is_some() {
            // 既存レコードがある場合は更新
            active_model
                .update(&txn)
                .await
                .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;
        } else {
            // 既存レコードがない場合は挿入
            active_model
                .insert(&txn)
                .await
                .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;
        }

        // タグIDの存在確認と絞り込み
        let mut valid_tag_ids = Vec::new();
        for tag_id in &task.tag_ids {
            // タグが存在するかチェック
            let tag_repo = TagLocalSqliteRepository::new(self.db_manager.clone());
            if let Ok(Some(_)) = tag_repo.find_by_id(project_id, tag_id).await {
                valid_tag_ids.push(tag_id.clone());
            } else {
                tracing::warn!("タスク保存時に存在しないタグID {}をスキップ", tag_id);
            }
        }

        // 有効なタグIDのみで紐づけを更新
        self.task_tag_repository
            .update_task_tag_relations(&txn, &project_id, &task.id, &valid_tag_ids)
            .await?;

        txn.commit()
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;
        Ok(())
    }

    async fn find_by_id(
        &self,
        project_id: &ProjectId,
        id: &TaskId,
    ) -> Result<Option<Task>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(|e| RepositoryError::from(e))?;

        if let Some(model) = TaskEntity::find_by_id((project_id.to_string(), id.to_string()))
            .one(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?
        {
            let mut task = model
                .to_domain_model()
                .await
                .map_err(|e: String| RepositoryError::from(SQLiteError::ConversionError(e)))?;

            // 紐づけテーブルからタグIDを取得
            task.tag_ids = self
                .task_tag_repository
                .find_tag_ids_by_task_id(project_id, id)
                .await?;

            Ok(Some(task))
        } else {
            Ok(None)
        }
    }

    async fn find_all(&self, project_id: &ProjectId) -> Result<Vec<Task>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(|e| RepositoryError::from(e))?;

        let models = TaskEntity::find()
            .filter(Column::ProjectId.eq(project_id.to_string()))
            .filter(Column::IsArchived.eq(false))
            .order_by_asc(Column::OrderIndex)
            .all(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        let mut tasks = Vec::new();
        for model in models {
            let mut task = model
                .to_domain_model()
                .await
                .map_err(|e: String| RepositoryError::from(SQLiteError::ConversionError(e)))?;

            // 紐づけテーブルからタグIDを取得
            task.tag_ids = self
                .task_tag_repository
                .find_tag_ids_by_task_id(project_id, &task.id)
                .await?;

            tasks.push(task);
        }

        Ok(tasks)
    }

    /// タスクを削除
    ///
    /// **非推奨**: このメソッドは後方互換性のために残されています。
    /// 新しいコードではFacade層でトランザクションを管理し、`delete_with_txn`を使用してください。
    async fn delete(&self, project_id: &ProjectId, id: &TaskId) -> Result<(), RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(|e| RepositoryError::from(e))?;

        // 単純な削除処理（トランザクション制御はFacade層で行う）
        TaskEntity::delete_by_id((project_id.to_string(), id.to_string()))
            .exec(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;
        Ok(())
    }

    async fn exists(&self, project_id: &ProjectId, id: &TaskId) -> Result<bool, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(|e| RepositoryError::from(e))?;
        let count = TaskEntity::find_by_id((project_id.to_string(), id.to_string()))
            .count(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;
        Ok(count > 0)
    }

    async fn count(&self, project_id: &ProjectId) -> Result<u64, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(|e| RepositoryError::from(e))?;
        let count = TaskEntity::find()
            .filter(Column::ProjectId.eq(project_id.to_string()))
            .filter(Column::IsArchived.eq(false))
            .count(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;
        Ok(count)
    }
}

// TaskRepositoryTraitの実装
impl TaskRepositoryTrait for TaskLocalSqliteRepository {}

impl ProjectPatchable<Task, TaskId> for TaskLocalSqliteRepository {}
