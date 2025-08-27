//! Task用SQLiteリポジトリ

use super::database_manager::DatabaseManager;
use crate::errors::repository_error::RepositoryError;
use crate::models::sqlite::task::{Column, Entity as TaskEntity};
use crate::models::sqlite::{DomainToSqliteConverter, SqliteModelConverter};
use crate::models::task::Task;
use crate::repositories::base_repository_trait::Repository;
use crate::types::id_types::TaskId;
use async_trait::async_trait;
use sea_orm::{
    ActiveModelTrait, ActiveValue, ColumnTrait, ConnectionTrait, EntityTrait,
    PaginatorTrait, QueryFilter, QueryOrder, Statement, TransactionTrait,
};
use std::sync::Arc;
use tokio::sync::RwLock;

#[derive(Debug)]
pub struct TaskLocalSqliteRepository {
    db_manager: Arc<RwLock<DatabaseManager>>,
}

impl TaskLocalSqliteRepository {
    pub fn new(db_manager: Arc<RwLock<DatabaseManager>>) -> Self {
        Self { db_manager }
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
            task.tag_ids = self.get_task_tag_ids(db, &task.id.to_string()).await?;

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
            task.tag_ids = self.get_task_tag_ids(db, &task.id.to_string()).await?;

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
            task.tag_ids = self.get_task_tag_ids(db, &task.id.to_string()).await?;

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

        let mut active_model = task
            .to_sqlite_model()
            .await
            .map_err(RepositoryError::Conversion)?;

        // tag_idsフィールドを無効化（紐づけテーブルを使用するため）
        active_model.tag_ids = ActiveValue::NotSet;

        // 既存レコードを確認
        let existing = TaskEntity::find_by_id(&task.id.to_string()).one(&txn).await?;

        if existing.is_some() {
            // 既存レコードがある場合は更新
            active_model.update(&txn).await?;
        } else {
            // 既存レコードがない場合は挿入
            active_model.insert(&txn).await?;
        }

        // タグの紐づけを更新
        self.update_task_tags(&txn, &task.id.to_string(), &task.tag_ids).await?;

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
            task.tag_ids = self.get_task_tag_ids(db, &id.to_string()).await?;

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
            task.tag_ids = self.get_task_tag_ids(db, &task.id.to_string()).await?;

            tasks.push(task);
        }

        Ok(tasks)
    }

    async fn delete(&self, id: &TaskId) -> Result<(), RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await?;

        // トランザクション開始
        let txn = db.begin().await?;

        // 紐づけテーブルから削除（CASCADE制約があるが明示的に削除）
        let delete_tags_sql = format!("DELETE FROM task_tags WHERE task_id = ?");
        txn.execute(Statement::from_sql_and_values(
            sea_orm::DatabaseBackend::Sqlite,
            &delete_tags_sql,
            vec![id.to_string().into()],
        ))
        .await?;

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

impl TaskLocalSqliteRepository {
    /// タスクのタグ紐づけを更新
    async fn update_task_tags<C>(
        &self,
        db: &C,
        task_id: &str,
        tag_ids: &[crate::types::id_types::TagId],
    ) -> Result<(), RepositoryError>
    where
        C: ConnectionTrait,
    {
        // 既存の紐づけを削除
        let delete_sql = format!("DELETE FROM task_tags WHERE task_id = ?");
        db.execute(Statement::from_sql_and_values(
            sea_orm::DatabaseBackend::Sqlite,
            &delete_sql,
            vec![task_id.into()],
        ))
        .await?;

        // 新しい紐づけを挿入
        for tag_id in tag_ids {
            let insert_sql = format!(
                "INSERT INTO task_tags (task_id, tag_id, created_at) VALUES (?, ?, datetime('now'))"
            );
            db.execute(Statement::from_sql_and_values(
                sea_orm::DatabaseBackend::Sqlite,
                &insert_sql,
                vec![task_id.into(), tag_id.to_string().into()],
            ))
            .await?;
        }

        // タスクのupdated_atを更新
        let update_task_sql = format!("UPDATE tasks SET updated_at = datetime('now') WHERE id = ?");
        db.execute(Statement::from_sql_and_values(
            sea_orm::DatabaseBackend::Sqlite,
            &update_task_sql,
            vec![task_id.into()],
        ))
        .await?;

        Ok(())
    }

    /// タスクのタグIDを取得
    async fn get_task_tag_ids<C>(
        &self,
        db: &C,
        task_id: &str,
    ) -> Result<Vec<crate::types::id_types::TagId>, RepositoryError>
    where
        C: ConnectionTrait,
    {
        let sql = format!("SELECT tag_id FROM task_tags WHERE task_id = ? ORDER BY created_at");
        let result = db
            .query_all(Statement::from_sql_and_values(
                sea_orm::DatabaseBackend::Sqlite,
                &sql,
                vec![task_id.into()],
            ))
            .await?;

        let mut tag_ids = Vec::new();
        for row in result {
            if let Ok(tag_id_str) = row.try_get::<String>("", "tag_id") {
                if let Ok(tag_id) = crate::types::id_types::TagId::try_from_str(&tag_id_str) {
                    tag_ids.push(tag_id);
                }
            }
        }

        Ok(tag_ids)
    }
}
