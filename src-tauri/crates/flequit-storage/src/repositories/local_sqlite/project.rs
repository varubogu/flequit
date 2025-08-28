//! Project用SQLiteリポジトリ

use super::database_manager::DatabaseManager;
use crate::errors::repository_error::RepositoryError;
use flequit_model::models::project::Project;
use crate::models::sqlite::project::{Column, Entity as ProjectEntity};
use crate::models::sqlite::{DomainToSqliteConverter, SqliteModelConverter};
use crate::repositories::base_repository_trait::Repository;
use flequit_model::types::id_types::ProjectId;
use async_trait::async_trait;
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
        let db = db_manager.get_connection().await?;

        let models = ProjectEntity::find()
            .filter(Column::OwnerId.eq(owner_id))
            .order_by_asc(Column::OrderIndex)
            .all(db)
            .await?;

        let mut projects = Vec::new();
        for model in models {
            let project = model
                .to_domain_model()
                .await
                .map_err(RepositoryError::Conversion)?;
            projects.push(project);
        }

        Ok(projects)
    }

    pub async fn find_active_projects(&self) -> Result<Vec<Project>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await?;

        let models = ProjectEntity::find()
            .filter(Column::IsArchived.eq(false))
            .order_by_asc(Column::OrderIndex)
            .all(db)
            .await?;

        let mut projects = Vec::new();
        for model in models {
            let project = model
                .to_domain_model()
                .await
                .map_err(RepositoryError::Conversion)?;
            projects.push(project);
        }

        Ok(projects)
    }
}

#[async_trait]
impl Repository<Project, ProjectId> for ProjectLocalSqliteRepository {
    async fn save(&self, project: &Project) -> Result<(), RepositoryError> {
        log::info!(
            "ProjectLocalSqliteRepository::save - 開始: {:?}",
            project.id
        );
        let db_manager = self.db_manager.read().await;
        log::info!("ProjectLocalSqliteRepository::save - DB Manager取得完了");
        let db = db_manager.get_connection().await?;
        log::info!("ProjectLocalSqliteRepository::save - DB接続取得完了");
        let active_model = project
            .to_sqlite_model()
            .await
            .map_err(RepositoryError::Conversion)?;
        log::info!("ProjectLocalSqliteRepository::save - ActiveModel作成完了");

        // 既存レコードを確認
        let existing = ProjectEntity::find_by_id(&project.id.to_string())
            .one(db)
            .await?;

        let result = if existing.is_some() {
            // 既存レコードがある場合は更新
            active_model.update(db).await?
        } else {
            // 既存レコードがない場合は挿入
            active_model.insert(db).await?
        };

        log::info!(
            "ProjectLocalSqliteRepository::save - DB操作完了: {:?}",
            result
        );
        Ok(())
    }

    async fn find_by_id(&self, id: &ProjectId) -> Result<Option<Project>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await?;

        if let Some(model) = ProjectEntity::find_by_id(id.to_string()).one(db).await? {
            let project = model
                .to_domain_model()
                .await
                .map_err(RepositoryError::Conversion)?;
            Ok(Some(project))
        } else {
            Ok(None)
        }
    }

    async fn find_all(&self) -> Result<Vec<Project>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await?;

        let models = ProjectEntity::find()
            .order_by_asc(Column::OrderIndex)
            .all(db)
            .await?;

        let mut projects = Vec::new();
        for model in models {
            let project = model
                .to_domain_model()
                .await
                .map_err(RepositoryError::Conversion)?;
            projects.push(project);
        }

        Ok(projects)
    }

    async fn delete(&self, id: &ProjectId) -> Result<(), RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await?;
        ProjectEntity::delete_by_id(id.to_string()).exec(db).await?;
        Ok(())
    }

    async fn exists(&self, id: &ProjectId) -> Result<bool, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await?;
        let count = ProjectEntity::find_by_id(id.to_string()).count(db).await?;
        Ok(count > 0)
    }

    async fn count(&self) -> Result<u64, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await?;
        let count = ProjectEntity::find().count(db).await?;
        Ok(count)
    }
}
