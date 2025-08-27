//! Subtask用SQLiteリポジトリ

use super::database_manager::DatabaseManager;
use crate::errors::repository_error::RepositoryError;
use crate::models::sqlite::subtask::{Column, Entity as SubtaskEntity};
use crate::models::sqlite::{DomainToSqliteConverter, SqliteModelConverter};
use crate::models::subtask::SubTask;
use crate::repositories::base_repository_trait::Repository;
use crate::types::id_types::SubTaskId;
use async_trait::async_trait;
use sea_orm::{
    ActiveModelTrait, ActiveValue, ColumnTrait, ConnectionTrait, EntityTrait, 
    PaginatorTrait, QueryFilter, QueryOrder, Statement, TransactionTrait,
};
use std::sync::Arc;
use tokio::sync::RwLock;

#[derive(Debug)]
pub struct SubtaskLocalSqliteRepository {
    db_manager: Arc<RwLock<DatabaseManager>>,
}

impl SubtaskLocalSqliteRepository {
    pub fn new(db_manager: Arc<RwLock<DatabaseManager>>) -> Self {
        Self { db_manager }
    }

    pub async fn find_by_task(&self, task_id: &str) -> Result<Vec<SubTask>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await?;

        let models = SubtaskEntity::find()
            .filter(Column::TaskId.eq(task_id))
            .order_by_asc(Column::OrderIndex)
            .all(db)
            .await?;

        let mut subtasks = Vec::new();
        for model in models {
            let mut subtask = model
                .to_domain_model()
                .await
                .map_err(RepositoryError::Conversion)?;
                
            // 紐づけテーブルからタグIDを取得
            subtask.tag_ids = self.get_subtask_tag_ids(db, &subtask.id.to_string()).await?;
            
            subtasks.push(subtask);
        }

        Ok(subtasks)
    }

    pub async fn find_completed_by_task(
        &self,
        task_id: &str,
    ) -> Result<Vec<SubTask>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await?;

        let models = SubtaskEntity::find()
            .filter(Column::TaskId.eq(task_id))
            .filter(Column::Completed.eq(true))
            .order_by_asc(Column::OrderIndex)
            .all(db)
            .await?;

        let mut subtasks = Vec::new();
        for model in models {
            let mut subtask = model
                .to_domain_model()
                .await
                .map_err(RepositoryError::Conversion)?;
                
            // 紐づけテーブルからタグIDを取得
            subtask.tag_ids = self.get_subtask_tag_ids(db, &subtask.id.to_string()).await?;
            
            subtasks.push(subtask);
        }

        Ok(subtasks)
    }
}

#[async_trait]
impl Repository<SubTask, SubTaskId> for SubtaskLocalSqliteRepository {
    async fn save(&self, subtask: &SubTask) -> Result<(), RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await?;
        
        // トランザクション開始
        let txn = db.begin().await?;
        
        let mut active_model = subtask
            .to_sqlite_model()
            .await
            .map_err(RepositoryError::Conversion)?;
        
        // tag_idsフィールドを無効化（紐づけテーブルを使用するため）
        active_model.tag_ids = ActiveValue::NotSet;

        // 既存レコードを確認
        let existing = SubtaskEntity::find_by_id(&subtask.id.to_string())
            .one(&txn)
            .await?;

        if existing.is_some() {
            // 既存レコードがある場合は更新
            active_model.update(&txn).await?;
        } else {
            // 既存レコードがない場合は挿入
            active_model.insert(&txn).await?;
        }

        // タグの紐づけを更新
        self.update_subtask_tags(&txn, &subtask.id.to_string(), &subtask.tag_ids).await?;

        txn.commit().await?;
        Ok(())
    }

    async fn find_by_id(&self, id: &SubTaskId) -> Result<Option<SubTask>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await?;

        if let Some(model) = SubtaskEntity::find_by_id(id.to_string()).one(db).await? {
            let mut subtask = model
                .to_domain_model()
                .await
                .map_err(RepositoryError::Conversion)?;
            
            // 紐づけテーブルからタグIDを取得
            subtask.tag_ids = self.get_subtask_tag_ids(db, &id.to_string()).await?;
            
            Ok(Some(subtask))
        } else {
            Ok(None)
        }
    }

    async fn find_all(&self) -> Result<Vec<SubTask>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await?;

        let models = SubtaskEntity::find()
            .order_by_asc(Column::OrderIndex)
            .all(db)
            .await?;

        let mut subtasks = Vec::new();
        for model in models {
            let mut subtask = model
                .to_domain_model()
                .await
                .map_err(RepositoryError::Conversion)?;
                
            // 紐づけテーブルからタグIDを取得
            subtask.tag_ids = self.get_subtask_tag_ids(db, &subtask.id.to_string()).await?;
            
            subtasks.push(subtask);
        }

        Ok(subtasks)
    }

    async fn delete(&self, id: &SubTaskId) -> Result<(), RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await?;
        
        // トランザクション開始
        let txn = db.begin().await?;
        
        // 紐づけテーブルから削除（CASCADE制約があるが明示的に削除）
        let delete_tags_sql = format!("DELETE FROM subtask_tags WHERE subtask_id = ?");
        txn.execute(Statement::from_sql_and_values(
            sea_orm::DatabaseBackend::Sqlite,
            &delete_tags_sql,
            vec![id.to_string().into()],
        ))
        .await?;
        
        // サブタスク本体を削除
        SubtaskEntity::delete_by_id(id.to_string()).exec(&txn).await?;
        
        txn.commit().await?;
        Ok(())
    }

    async fn exists(&self, id: &SubTaskId) -> Result<bool, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await?;
        let count = SubtaskEntity::find_by_id(id.to_string()).count(db).await?;
        Ok(count > 0)
    }

    async fn count(&self) -> Result<u64, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await?;
        let count = SubtaskEntity::find().count(db).await?;
        Ok(count)
    }
}

impl SubtaskLocalSqliteRepository {
    /// サブタスクのタグ紐づけを更新
    async fn update_subtask_tags<C>(
        &self,
        db: &C,
        subtask_id: &str,
        tag_ids: &[crate::types::id_types::TagId],
    ) -> Result<(), RepositoryError> 
    where
        C: ConnectionTrait,
    {
        // 既存の紐づけを削除
        let delete_sql = format!("DELETE FROM subtask_tags WHERE subtask_id = ?");
        db.execute(Statement::from_sql_and_values(
            sea_orm::DatabaseBackend::Sqlite,
            &delete_sql,
            vec![subtask_id.into()],
        ))
        .await?;

        // 新しい紐づけを挿入
        for tag_id in tag_ids {
            let insert_sql = format!(
                "INSERT INTO subtask_tags (subtask_id, tag_id, created_at) VALUES (?, ?, datetime('now'))"
            );
            db.execute(Statement::from_sql_and_values(
                sea_orm::DatabaseBackend::Sqlite,
                &insert_sql,
                vec![subtask_id.into(), tag_id.to_string().into()],
            ))
            .await?;
        }

        // サブタスクのupdated_atを更新
        let update_subtask_sql = format!("UPDATE subtasks SET updated_at = datetime('now') WHERE id = ?");
        db.execute(Statement::from_sql_and_values(
            sea_orm::DatabaseBackend::Sqlite,
            &update_subtask_sql,
            vec![subtask_id.into()],
        ))
        .await?;

        Ok(())
    }

    /// サブタスクのタグIDを取得
    async fn get_subtask_tag_ids<C>(
        &self,
        db: &C,
        subtask_id: &str,
    ) -> Result<Vec<crate::types::id_types::TagId>, RepositoryError>
    where
        C: ConnectionTrait,
    {
        let sql = format!("SELECT tag_id FROM subtask_tags WHERE subtask_id = ? ORDER BY created_at");
        let result = db
            .query_all(Statement::from_sql_and_values(
                sea_orm::DatabaseBackend::Sqlite,
                &sql,
                vec![subtask_id.into()],
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
