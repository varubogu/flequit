//! Project用SQLiteリポジトリ

use super::{DatabaseManager, RepositoryError};
use crate::models::project::Project;
use crate::models::sqlite::project::{Column, Entity as ProjectEntity};
use crate::models::sqlite::{DomainToSqliteConverter, SqliteModelConverter};
use crate::repositories::base_repository_trait::Repository;
use crate::types::id_types::ProjectId;
use async_trait::async_trait;
use log::info;
use sea_orm::{ActiveModelTrait, ColumnTrait, EntityTrait, QueryFilter, QueryOrder};

pub struct ProjectLocalSqliteRepository {
    db_manager: DatabaseManager,
}

impl ProjectLocalSqliteRepository {
    pub fn new(db_manager: DatabaseManager) -> Self {
        Self { db_manager }
    }

    pub async fn find_by_owner(&self, owner_id: &str) -> Result<Vec<Project>, RepositoryError> {
        let db = self.db_manager.get_connection().await?;

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
        let db = self.db_manager.get_connection().await?;

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
        let db = self.db_manager.get_connection().await?;
        let active_model = project
            .to_sqlite_model()
            .await
            .map_err(RepositoryError::Conversion)?;
        let saved = active_model.insert(db).await?;
        Ok(())
    }

    async fn find_by_id(&self, id: &ProjectId) -> Result<Option<Project>, RepositoryError> {
        let db = self.db_manager.get_connection().await?;

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
        let db = self.db_manager.get_connection().await?;

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
        info!("ProjectUnifiedRepository::delete");
        info!("{:?}", id);
        Ok(())
    }

    async fn exists(&self, id: &ProjectId) -> Result<bool, RepositoryError> {
        info!("ProjectUnifiedRepository::exists");
        info!("{:?}", id);
        Ok(true)
    }

    async fn count(&self) -> Result<u64, RepositoryError> {
        info!("ProjectUnifiedRepository::count");
        Ok(0)
    }
}
