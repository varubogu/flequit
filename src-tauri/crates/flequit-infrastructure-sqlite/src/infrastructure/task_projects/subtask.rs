//! Subtask用SQLiteリポジトリ

use super::super::database_manager::DatabaseManager;
use super::subtask_tag::SubtaskTagLocalSqliteRepository;
use super::tag::TagLocalSqliteRepository;
use crate::errors::sqlite_error::SQLiteError;
use crate::models::subtask::{Column, Entity as SubtaskEntity};
use crate::models::{DomainToSqliteConverter, SqliteModelConverter};
use async_trait::async_trait;
use flequit_model::models::task_projects::subtask::SubTask;
use flequit_model::types::id_types::{ProjectId, SubTaskId};
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
            .map_err(|e| RepositoryError::from(e))?;

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
            .map_err(|e| RepositoryError::from(e))?;

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
}

#[async_trait]
impl ProjectRepository<SubTask, SubTaskId> for SubTaskLocalSqliteRepository {
    async fn save(&self, project_id: &ProjectId, subtask: &SubTask) -> Result<(), RepositoryError> {
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

        let active_model = subtask
            .to_sqlite_model()
            .await
            .map_err(|e: String| RepositoryError::from(SQLiteError::ConversionError(e)))?;

        // 既存レコードを確認
        let existing = SubtaskEntity::find_by_id(&subtask.id.to_string())
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
                valid_tag_ids.push(tag_id.clone());
            } else {
                tracing::warn!("サブタスク保存時に存在しないタグID {}をスキップ", tag_id);
            }
        }

        // 有効なタグIDのみで紐づけを更新
        self.subtask_tag_repository
            .update_subtask_tag_relations(&txn, &subtask.id, &valid_tag_ids)
            .await
            .map_err(|e| RepositoryError::from(e))?;

        txn.commit()
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;
        Ok(())
    }

    async fn find_by_id(
        &self,
        _project_id: &ProjectId,
        id: &SubTaskId,
    ) -> Result<Option<SubTask>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(|e| RepositoryError::from(e))?;

        if let Some(model) = SubtaskEntity::find_by_id(id.to_string())
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

    async fn find_all(&self, _project_id: &ProjectId) -> Result<Vec<SubTask>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(|e| RepositoryError::from(e))?;

        let models = SubtaskEntity::find()
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

    async fn delete(&self, _project_id: &ProjectId, id: &SubTaskId) -> Result<(), RepositoryError> {
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

        // 紐づけテーブルから削除（CASCADE制約があるが明示的に削除）
        let delete_tags_sql = format!("DELETE FROM subtask_tags WHERE subtask_id = ?");
        txn.execute(Statement::from_sql_and_values(
            sea_orm::DatabaseBackend::Sqlite,
            &delete_tags_sql,
            vec![id.to_string().into()],
        ))
        .await
        .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        // サブタスク本体を削除
        SubtaskEntity::delete_by_id(id.to_string())
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
        _project_id: &ProjectId,
        id: &SubTaskId,
    ) -> Result<bool, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(|e| RepositoryError::from(e))?;
        let count = SubtaskEntity::find_by_id(id.to_string())
            .count(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;
        Ok(count > 0)
    }

    async fn count(&self, _project_id: &ProjectId) -> Result<u64, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(|e| RepositoryError::from(e))?;
        let count = SubtaskEntity::find()
            .count(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;
        Ok(count)
    }
}
