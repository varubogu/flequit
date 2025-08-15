//! Project用SQLiteリポジトリ

use sea_orm::{EntityTrait, QueryFilter, QueryOrder, ColumnTrait, ActiveModelTrait};
use crate::models::project::Project;
use crate::models::sqlite::project::{Entity as ProjectEntity, ActiveModel as ProjectActiveModel, Column};
use crate::models::sqlite::{SqliteModelConverter, DomainToSqliteConverter};
use super::{DatabaseManager, RepositoryError, Repository};

pub struct ProjectRepository {
    db_manager: DatabaseManager,
}

impl ProjectRepository {
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
            let project = model.to_domain_model().await.map_err(RepositoryError::Conversion)?;
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
            let project = model.to_domain_model().await.map_err(RepositoryError::Conversion)?;
            projects.push(project);
        }

        Ok(projects)
    }
}

#[async_trait::async_trait]
impl Repository<Project> for ProjectRepository {
    async fn save(&self, project: &Project) -> Result<Project, RepositoryError> {
        let db = self.db_manager.get_connection().await?;
        let active_model = project.to_sqlite_model().await.map_err(RepositoryError::Conversion)?;
        let saved = active_model.insert(db).await?;
        saved.to_domain_model().await.map_err(RepositoryError::Conversion)
    }

    async fn find_by_id(&self, id: &str) -> Result<Option<Project>, RepositoryError> {
        let db = self.db_manager.get_connection().await?;

        if let Some(model) = ProjectEntity::find_by_id(id).one(db).await? {
            let project = model.to_domain_model().await.map_err(RepositoryError::Conversion)?;
            Ok(Some(project))
        } else {
            Ok(None)
        }
    }

    async fn update(&self, project: &Project) -> Result<Project, RepositoryError> {
        let db = self.db_manager.get_connection().await?;

        let existing = ProjectEntity::find_by_id(&project.id.to_string())
            .one(db)
            .await?
            .ok_or_else(|| RepositoryError::NotFound(format!("Project not found: {}", project.id)))?;

        let mut active_model: ProjectActiveModel = existing.into();
        let new_active = project.to_sqlite_model().await.map_err(RepositoryError::Conversion)?;

        active_model.name = new_active.name;
        active_model.description = new_active.description;
        active_model.color = new_active.color;
        active_model.order_index = new_active.order_index;
        active_model.is_archived = new_active.is_archived;
        active_model.status = new_active.status;
        active_model.owner_id = new_active.owner_id;
        active_model.updated_at = new_active.updated_at;

        let updated = active_model.update(db).await?;
        updated.to_domain_model().await.map_err(RepositoryError::Conversion)
    }

    async fn delete_by_id(&self, id: &str) -> Result<bool, RepositoryError> {
        let db = self.db_manager.get_connection().await?;
        let result = ProjectEntity::delete_by_id(id).exec(db).await?;
        Ok(result.rows_affected > 0)
    }

    async fn find_all(&self) -> Result<Vec<Project>, RepositoryError> {
        let db = self.db_manager.get_connection().await?;

        let models = ProjectEntity::find()
            .order_by_asc(Column::OrderIndex)
            .all(db)
            .await?;

        let mut projects = Vec::new();
        for model in models {
            let project = model.to_domain_model().await.map_err(RepositoryError::Conversion)?;
            projects.push(project);
        }

        Ok(projects)
    }
}

// ProjectRepositoryTrait実装は project_repository_impl.rs に移行しました
