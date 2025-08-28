//! Task用SQLiteリポジトリ

use super::database_manager::DatabaseManager;
use super::task_tag::TaskTagLocalSqliteRepository;
use super::tag::TagLocalSqliteRepository;
use crate::errors::repository_error::RepositoryError;
use crate::models::sqlite::task::{Column, Entity as TaskEntity};
use crate::models::sqlite::{DomainToSqliteConverter, SqliteModelConverter};
use flequit_model::models::task::Task;
use crate::repositories::base_repository_trait::Repository;
use flequit_model::types::id_types::TaskId;
use async_trait::async_trait;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, EntityTrait,
    PaginatorTrait, QueryFilter, QueryOrder, TransactionTrait,
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

    pub async fn find_by_project(&self, project_id: &str) -> Result<Vec<Task>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await?;

        let models = TaskEntity::find()
            .filter(Column::ProjectId.eq(project_id))
            .filter(Column::IsArchived.eq(false))
            .order_by_asc(Column::OrderIndex)
            .all(db)
            .await?;

        let mut tasks = Vec::new();
        for model in models {
            let mut task = model
                .to_domain_model()
                .await
                .map_err(RepositoryError::Conversion)?;

            // 紐づけテーブルからタグIDを取得
            task.tag_ids = self.task_tag_repository.find_tag_ids_by_task_id(&task.id).await?;

            tasks.push(task);
        }

        Ok(tasks)
    }

    pub async fn find_by_task_list(&self, list_id: &str) -> Result<Vec<Task>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await?;

        let models = TaskEntity::find()
            .filter(Column::ListId.eq(list_id))
            .filter(Column::IsArchived.eq(false))
            .order_by_asc(Column::OrderIndex)
            .all(db)
            .await?;

        let mut tasks = Vec::new();
        for model in models {
            let mut task = model
                .to_domain_model()
                .await
                .map_err(RepositoryError::Conversion)?;

            // 紐づけテーブルからタグIDを取得
            task.tag_ids = self.task_tag_repository.find_tag_ids_by_task_id(&task.id).await?;

            tasks.push(task);
        }

        Ok(tasks)
    }

    pub async fn find_by_status(&self, status: &str) -> Result<Vec<Task>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await?;

        let models = TaskEntity::find()
            .filter(Column::Status.eq(status))
            .filter(Column::IsArchived.eq(false))
            .order_by_asc(Column::OrderIndex)
            .all(db)
            .await?;

        let mut tasks = Vec::new();
        for model in models {
            let mut task = model
                .to_domain_model()
                .await
                .map_err(RepositoryError::Conversion)?;

            // 紐づけテーブルからタグIDを取得
            task.tag_ids = self.task_tag_repository.find_tag_ids_by_task_id(&task.id).await?;

            tasks.push(task);
        }

        Ok(tasks)
    }
}

#[async_trait]
impl Repository<Task, TaskId> for TaskLocalSqliteRepository {
    #[tracing::instrument(level = "trace")]
    async fn save(&self, task: &Task) -> Result<(), RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await?;

        // トランザクション開始
        let txn = db.begin().await?;

        let active_model = task
            .to_sqlite_model()
            .await
            .map_err(RepositoryError::Conversion)?;

        // 既存レコードを確認
        let existing = TaskEntity::find_by_id(&task.id.to_string()).one(&txn).await?;

        if existing.is_some() {
            // 既存レコードがある場合は更新
            active_model.update(&txn).await?;
        } else {
            // 既存レコードがない場合は挿入
            active_model.insert(&txn).await?;
        }

        // タグIDの存在確認と絞り込み
        let mut valid_tag_ids = Vec::new();
        for tag_id in &task.tag_ids {
            // タグが存在するかチェック
            let tag_repo = TagLocalSqliteRepository::new(self.db_manager.clone());
            if let Ok(Some(_)) = tag_repo.find_by_id(tag_id).await {
                valid_tag_ids.push(tag_id.clone());
            } else {
                tracing::warn!("タスク保存時に存在しないタグID {}をスキップ", tag_id);
            }
        }

        // 有効なタグIDのみで紐づけを更新
        self.task_tag_repository.update_task_tag_relations(&txn, &task.id, &valid_tag_ids).await?;

        txn.commit().await?;
        Ok(())
    }

    async fn find_by_id(&self, id: &TaskId) -> Result<Option<Task>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await?;

        if let Some(model) = TaskEntity::find_by_id(id.to_string()).one(db).await? {
            let mut task = model
                .to_domain_model()
                .await
                .map_err(RepositoryError::Conversion)?;

            // 紐づけテーブルからタグIDを取得
            task.tag_ids = self.task_tag_repository.find_tag_ids_by_task_id(id).await?;

            Ok(Some(task))
        } else {
            Ok(None)
        }
    }

    async fn find_all(&self) -> Result<Vec<Task>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await?;

        let models = TaskEntity::find()
            .filter(Column::IsArchived.eq(false))
            .order_by_asc(Column::OrderIndex)
            .all(db)
            .await?;

        let mut tasks = Vec::new();
        for model in models {
            let mut task = model
                .to_domain_model()
                .await
                .map_err(RepositoryError::Conversion)?;

            // 紐づけテーブルからタグIDを取得
            task.tag_ids = self.task_tag_repository.find_tag_ids_by_task_id(&task.id).await?;

            tasks.push(task);
        }

        Ok(tasks)
    }

    async fn delete(&self, id: &TaskId) -> Result<(), RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await?;

        // トランザクション開始
        let txn = db.begin().await?;

        // 紐づけテーブルから削除
        self.task_tag_repository.remove_all_relations_by_task_id(id).await?;

        // タスク本体を削除
        TaskEntity::delete_by_id(id.to_string()).exec(&txn).await?;

        txn.commit().await?;
        Ok(())
    }

    async fn exists(&self, id: &TaskId) -> Result<bool, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await?;
        let count = TaskEntity::find_by_id(id.to_string()).count(db).await?;
        Ok(count > 0)
    }

    async fn count(&self) -> Result<u64, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await?;
        let count = TaskEntity::find().count(db).await?;
        Ok(count)
    }
}
