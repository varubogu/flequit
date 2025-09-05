//! Member用SQLiteリポジトリ

use super::super::database_manager::DatabaseManager;
use flequit_model::models::task_projects::member::Member;
use flequit_types::errors::repository_error::RepositoryError;
use crate::errors::sqlite_error::SQLiteError;
use crate::models::task_projects::member::{Column, Entity as MemberEntity};
use crate::models::{DomainToSqliteConverter, SqliteModelConverter};
use flequit_repository::repositories::project_repository_trait::ProjectRepository;
use flequit_repository::repositories::task_projects::member_repository_trait::MemberRepositoryTrait;
use flequit_model::types::id_types::{UserId, ProjectId};
use async_trait::async_trait;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, EntityTrait, PaginatorTrait, QueryFilter, Set,
};
use std::sync::Arc;
use tokio::sync::RwLock;

#[derive(Debug)]
pub struct MemberLocalSqliteRepository {
    db_manager: Arc<RwLock<DatabaseManager>>,
}

impl MemberLocalSqliteRepository {
    pub fn new(db_manager: Arc<RwLock<DatabaseManager>>) -> Self {
        Self { db_manager }
    }
}


#[async_trait]
impl MemberRepositoryTrait for MemberLocalSqliteRepository {
}


#[async_trait]
impl ProjectRepository<Member, UserId> for MemberLocalSqliteRepository {
    async fn save(&self, project_id: &ProjectId, entity: &Member) -> Result<(), RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await.map_err(|e| RepositoryError::from(e))?;

        let sqlite_model = entity
            .to_sqlite_model()
            .await
            .map_err(|e: String| RepositoryError::from(SQLiteError::ConversionError(e)))?;

        let active_model = crate::models::task_projects::member::ActiveModel {
            id: Set(sqlite_model.id.clone()),
            user_id: Set(sqlite_model.user_id.clone()),
            role: Set(sqlite_model.role.clone()),
            joined_at: Set(sqlite_model.joined_at),
            updated_at: Set(sqlite_model.updated_at),
        };

        active_model.insert(db).await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;
        Ok(())
    }

    async fn find_by_id(&self, project_id: &ProjectId, id: &UserId) -> Result<Option<Member>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await.map_err(|e| RepositoryError::from(e))?;

        if let Some(model) = MemberEntity::find()
            .filter(Column::Id.eq(id.as_str()))
            .one(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?
        {
            let member = model
                .to_domain_model()
                .await
                .map_err(|e: String| RepositoryError::from(SQLiteError::ConversionError(e)))?;
            Ok(Some(member))
        } else {
            Ok(None)
        }
    }

    async fn find_all(&self, project_id: &ProjectId) -> Result<Vec<Member>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await.map_err(|e| RepositoryError::from(e))?;

        let models = MemberEntity::find().all(db).await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        let mut members = Vec::new();
        for model in models {
            let member = model
                .to_domain_model()
                .await
                .map_err(|e: String| RepositoryError::from(SQLiteError::ConversionError(e)))?;
            members.push(member);
        }

        Ok(members)
    }

    async fn delete(&self, project_id: &ProjectId, id: &UserId) -> Result<(), RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await.map_err(|e| RepositoryError::from(e))?;

        MemberEntity::delete_many()
            .filter(Column::Id.eq(id.as_str()))
            .exec(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        Ok(())
    }

    async fn exists(&self, project_id: &ProjectId, id: &UserId) -> Result<bool, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await.map_err(|e| RepositoryError::from(e))?;

        let count = MemberEntity::find()
            .filter(Column::Id.eq(id.as_str()))
            .count(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        Ok(count > 0)
    }

    async fn count(&self, project_id: &ProjectId) -> Result<u64, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await.map_err(|e| RepositoryError::from(e))?;

        let count = MemberEntity::find().count(db).await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;
        Ok(count)
    }
}
