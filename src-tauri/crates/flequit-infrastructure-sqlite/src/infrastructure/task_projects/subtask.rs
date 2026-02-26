//! Subtask用SQLiteリポジトリ

use super::super::database_manager::DatabaseManager;
use super::subtask_tag::SubtaskTagLocalSqliteRepository;
use super::tag::TagLocalSqliteRepository;
use crate::errors::sqlite_error::SQLiteError;
use crate::models::subtask::{Column, Entity as SubtaskEntity};
use crate::models::{DomainToSqliteConverterWithProjectId, SqliteModelConverter};
use async_trait::async_trait;
use chrono::{DateTime, Utc};
use flequit_model::models::task_projects::subtask::SubTask;
use flequit_model::types::id_types::{ProjectId, SubTaskId, UserId};
use flequit_repository::repositories::project_repository_trait::ProjectRepository;
use flequit_types::errors::repository_error::RepositoryError;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, ConnectionTrait, EntityTrait, PaginatorTrait, QueryFilter,
    QueryOrder, Statement, TransactionTrait,
};
use std::sync::Arc;
use tokio::sync::RwLock;

#[derive(Debug)]
pub struct SubTaskLocalSqliteRepository {
    db_manager: Arc<RwLock<DatabaseManager>>,
    subtask_tag_repository: SubtaskTagLocalSqliteRepository,
}

impl SubTaskLocalSqliteRepository {
    pub fn new(db_manager: Arc<RwLock<DatabaseManager>>) -> Self {
        let subtask_tag_repository = SubtaskTagLocalSqliteRepository::new(db_manager.clone());
        Self {
            db_manager,
            subtask_tag_repository,
        }
    }

    pub async fn find_by_task(&self, task_id: &str) -> Result<Vec<SubTask>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(RepositoryError::from)?;

        let models = SubtaskEntity::find()
            .filter(Column::TaskId.eq(task_id))
            .order_by_asc(Column::OrderIndex)
            .all(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        let mut subtasks = Vec::new();
        for model in models {
            let mut subtask = model
                .to_domain_model()
                .await
                .map_err(|e: String| RepositoryError::from(SQLiteError::ConversionError(e)))?;

            // 紐づけテーブルからタグIDを取得
            subtask.tag_ids = self
                .subtask_tag_repository
                .find_tag_ids_by_subtask_id(&subtask.id)
                .await?;

            subtasks.push(subtask);
        }

        Ok(subtasks)
    }

    pub async fn find_completed_by_task(
        &self,
        task_id: &str,
    ) -> Result<Vec<SubTask>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(RepositoryError::from)?;

        let models = SubtaskEntity::find()
            .filter(Column::TaskId.eq(task_id))
            .filter(Column::Completed.eq(true))
            .order_by_asc(Column::OrderIndex)
            .all(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        let mut subtasks = Vec::new();
        for model in models {
            let mut subtask = model
                .to_domain_model()
                .await
                .map_err(|e: String| RepositoryError::from(SQLiteError::ConversionError(e)))?;

            // 紐づけテーブルからタグIDを取得
            subtask.tag_ids = self
                .subtask_tag_repository
                .find_tag_ids_by_subtask_id(&subtask.id)
                .await?;

            subtasks.push(subtask);
        }

        Ok(subtasks)
    }

    /// 指定タスクに関連する全サブタスクをトランザクション内で削除
    ///
    /// トランザクションは呼び出し側（Facade層）が管理します。
    /// 各サブタスクに関連するsubtask_tagsも削除されます。
    pub async fn remove_all_by_task_id_with_txn(
        &self,
        txn: &sea_orm::DatabaseTransaction,
        project_id: &ProjectId,
        task_id: &str,
    ) -> Result<(), RepositoryError> {
        // タスクに関連する全サブタスクのIDを取得
        let subtask_models = SubtaskEntity::find()
            .filter(Column::ProjectId.eq(project_id.to_string()))
            .filter(Column::TaskId.eq(task_id))
            .all(txn)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        // 各サブタスクについて、関連するsubtask_tagsを削除してから本体を削除
        for model in subtask_models {
            let subtask_id = SubTaskId::from(model.id.clone());

            // 関連するsubtask_tagsを削除
            self.subtask_tag_repository
                .remove_all_by_subtask_id_with_txn(txn, &subtask_id)
                .await?;

            // サブタスク本体を削除
            SubtaskEntity::delete_by_id((project_id.to_string(), model.id))
                .exec(txn)
                .await
                .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;
        }

        Ok(())
    }
}

#[async_trait]
impl ProjectRepository<SubTask, SubTaskId> for SubTaskLocalSqliteRepository {
    async fn save(&self, project_id: &ProjectId, subtask: &SubTask, _user_id: &UserId, _timestamp: &DateTime<Utc>) -> Result<(), RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(RepositoryError::from)?;

        // トランザクション開始
        let txn = db
            .begin()
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        let active_model = subtask
            .to_sqlite_model_with_project_id(project_id)
            .await
            .map_err(|e: String| RepositoryError::from(SQLiteError::ConversionError(e)))?;

        // 既存レコードを確認
        let existing = SubtaskEntity::find_by_id((project_id.to_string(), subtask.id.to_string()))
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
        for tag_id in &subtask.tag_ids {
            // タグが存在するかチェック
            let tag_repo = TagLocalSqliteRepository::new(self.db_manager.clone());
            if let Ok(Some(_)) = tag_repo.find_by_id(project_id, tag_id).await {
                valid_tag_ids.push(*tag_id);
            } else {
                tracing::warn!("サブタスク保存時に存在しないタグID {}をスキップ", tag_id);
            }
        }

        // 有効なタグIDのみで紐づけを更新
        self.subtask_tag_repository
            .update_subtask_tag_relations(&txn, project_id, &subtask.id, &valid_tag_ids)
            .await
            .map_err(RepositoryError::from)?;

        txn.commit()
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;
        Ok(())
    }

    async fn find_by_id(
        &self,
        project_id: &ProjectId,
        id: &SubTaskId,
    ) -> Result<Option<SubTask>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(RepositoryError::from)?;

        if let Some(model) = SubtaskEntity::find_by_id((project_id.to_string(), id.to_string()))
            .one(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?
        {
            let mut subtask = model
                .to_domain_model()
                .await
                .map_err(|e: String| RepositoryError::from(SQLiteError::ConversionError(e)))?;

            // 紐づけテーブルからタグIDを取得
            subtask.tag_ids = self
                .subtask_tag_repository
                .find_tag_ids_by_subtask_id(id)
                .await?;

            Ok(Some(subtask))
        } else {
            Ok(None)
        }
    }

    async fn find_all(&self, project_id: &ProjectId) -> Result<Vec<SubTask>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(RepositoryError::from)?;

        let models = SubtaskEntity::find()
            .filter(Column::ProjectId.eq(project_id.to_string()))
            .order_by_asc(Column::OrderIndex)
            .all(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        let mut subtasks = Vec::new();
        for model in models {
            let mut subtask = model
                .to_domain_model()
                .await
                .map_err(|e: String| RepositoryError::from(SQLiteError::ConversionError(e)))?;

            // 紐づけテーブルからタグIDを取得
            subtask.tag_ids = self
                .subtask_tag_repository
                .find_tag_ids_by_subtask_id(&subtask.id)
                .await?;

            subtasks.push(subtask);
        }

        Ok(subtasks)
    }

    async fn delete(&self, project_id: &ProjectId, id: &SubTaskId) -> Result<(), RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(RepositoryError::from)?;

        // トランザクション開始
        let txn = db
            .begin()
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        // 紐づけテーブルから削除（CASCADE制約があるが明示的に削除）
        let delete_tags_sql = "DELETE FROM subtask_tags WHERE subtask_id = ?".to_string();
        txn.execute(Statement::from_sql_and_values(
            sea_orm::DatabaseBackend::Sqlite,
            &delete_tags_sql,
            vec![id.to_string().into()],
        ))
        .await
        .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        // サブタスク本体を削除
        SubtaskEntity::delete_by_id((project_id.to_string(), id.to_string()))
            .exec(&txn)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        txn.commit()
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;
        Ok(())
    }

    async fn exists(
        &self,
        project_id: &ProjectId,
        id: &SubTaskId,
    ) -> Result<bool, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(RepositoryError::from)?;
        let count = SubtaskEntity::find_by_id((project_id.to_string(), id.to_string()))
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
            .map_err(RepositoryError::from)?;
        let count = SubtaskEntity::find()
            .filter(Column::ProjectId.eq(project_id.to_string()))
            .count(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;
        Ok(count)
    }
}
