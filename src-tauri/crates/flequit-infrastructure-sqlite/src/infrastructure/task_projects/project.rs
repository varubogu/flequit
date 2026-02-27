//! Project用SQLiteリポジトリ

use super::super::database_manager::DatabaseManager;
use crate::errors::sqlite_error::SQLiteError;
use crate::models::project::{Column, Entity as ProjectEntity};
use crate::models::{DomainToSqliteConverter, SqliteModelConverter};
use async_trait::async_trait;
use chrono::{DateTime, Utc};
use flequit_model::models::task_projects::project::Project;
use flequit_model::types::id_types::{ProjectId, UserId};
use flequit_repository::base_repository_trait::Repository;
use flequit_types::errors::repository_error::RepositoryError;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, EntityTrait, PaginatorTrait, QueryFilter, QueryOrder,
};
use std::sync::Arc;
use tokio::sync::RwLock;

#[derive(Debug)]
pub struct ProjectLocalSqliteRepository {
    db_manager: Arc<RwLock<DatabaseManager>>,
}

impl ProjectLocalSqliteRepository {
    pub fn new(db_manager: Arc<RwLock<DatabaseManager>>) -> Self {
        Self { db_manager }
    }

    pub async fn find_by_owner(&self, owner_id: &str) -> Result<Vec<Project>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(RepositoryError::from)?;

        let models = ProjectEntity::find()
            .filter(Column::OwnerId.eq(owner_id))
            .order_by_asc(Column::OrderIndex)
            .all(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        let mut projects = Vec::new();
        for model in models {
            let project = model
                .to_domain_model()
                .await
                .map_err(|e: String| RepositoryError::from(SQLiteError::ConversionError(e)))?;
            projects.push(project);
        }

        Ok(projects)
    }

    pub async fn find_active_projects(&self) -> Result<Vec<Project>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(RepositoryError::from)?;

        let models = ProjectEntity::find()
            .filter(Column::IsArchived.eq(false))
            .order_by_asc(Column::OrderIndex)
            .all(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        let mut projects = Vec::new();
        for model in models {
            let project = model
                .to_domain_model()
                .await
                .map_err(|e: String| RepositoryError::from(SQLiteError::ConversionError(e)))?;
            projects.push(project);
        }

        Ok(projects)
    }

    /// プロジェクトをトランザクション内で削除
    ///
    /// トランザクションは呼び出し側（Facade層）が管理します。
    pub async fn delete_with_txn(
        &self,
        txn: &sea_orm::DatabaseTransaction,
        id: &ProjectId,
    ) -> Result<(), RepositoryError> {
        ProjectEntity::delete_by_id(id.to_string())
            .exec(txn)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;
        Ok(())
    }
}

#[async_trait]
impl Repository<Project, ProjectId> for ProjectLocalSqliteRepository {
    async fn save(
        &self,
        project: &Project,
        _user_id: &UserId,
        _timestamp: &DateTime<Utc>,
    ) -> Result<(), RepositoryError> {
        tracing::info!(
            "ProjectLocalSqliteRepository::save - 開始: {:?}",
            project.id
        );
        let db_manager = self.db_manager.read().await;
        tracing::info!("ProjectLocalSqliteRepository::save - DB Manager取得完了");
        let db = db_manager
            .get_connection()
            .await
            .map_err(RepositoryError::from)?;
        tracing::info!("ProjectLocalSqliteRepository::save - DB接続取得完了");
        let active_model = project
            .to_sqlite_model()
            .await
            .map_err(|e: String| RepositoryError::from(SQLiteError::ConversionError(e)))?;
        tracing::info!("ProjectLocalSqliteRepository::save - ActiveModel作成完了");

        // 既存レコードを確認
        let existing = ProjectEntity::find_by_id(project.id.to_string())
            .one(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        let result = if existing.is_some() {
            // 既存レコードがある場合は更新
            active_model
                .update(db)
                .await
                .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?
        } else {
            // 既存レコードがない場合は挿入
            active_model
                .insert(db)
                .await
                .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?
        };

        tracing::info!(
            "ProjectLocalSqliteRepository::save - DB操作完了: {:?}",
            result
        );
        Ok(())
    }

    async fn find_by_id(&self, id: &ProjectId) -> Result<Option<Project>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(RepositoryError::from)?;

        if let Some(model) = ProjectEntity::find_by_id(id.to_string())
            .one(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?
        {
            let project = model
                .to_domain_model()
                .await
                .map_err(|e: String| RepositoryError::from(SQLiteError::ConversionError(e)))?;
            Ok(Some(project))
        } else {
            Ok(None)
        }
    }

    async fn find_all(&self) -> Result<Vec<Project>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(RepositoryError::from)?;

        let models = ProjectEntity::find()
            .order_by_asc(Column::OrderIndex)
            .all(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        let mut projects = Vec::new();
        for model in models {
            let project = model
                .to_domain_model()
                .await
                .map_err(|e: String| RepositoryError::from(SQLiteError::ConversionError(e)))?;
            projects.push(project);
        }

        Ok(projects)
    }

    async fn delete(&self, id: &ProjectId) -> Result<(), RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(RepositoryError::from)?;
        ProjectEntity::delete_by_id(id.to_string())
            .exec(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;
        Ok(())
    }

    async fn exists(&self, id: &ProjectId) -> Result<bool, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(RepositoryError::from)?;
        let count = ProjectEntity::find_by_id(id.to_string())
            .count(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;
        Ok(count > 0)
    }

    async fn count(&self) -> Result<u64, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(RepositoryError::from)?;
        let count = ProjectEntity::find()
            .count(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;
        Ok(count)
    }
}
