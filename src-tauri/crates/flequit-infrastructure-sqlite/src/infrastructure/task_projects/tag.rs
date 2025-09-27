//! Tag用SQLiteリポジトリ

use super::super::database_manager::DatabaseManager;
use crate::errors::sqlite_error::SQLiteError;
use crate::models::tag::{ActiveModel as TagActiveModel, Column, Entity as TagEntity};
use crate::models::{DomainToSqliteConverter, DomainToSqliteConverterWithProjectId, SqliteModelConverter};
use async_trait::async_trait;
use flequit_model::models::task_projects::tag::Tag;
use flequit_model::types::id_types::{ProjectId, TagId};
use flequit_repository::repositories::project_repository_trait::ProjectRepository;
use flequit_types::errors::repository_error::RepositoryError;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, EntityTrait, PaginatorTrait, QueryFilter, QueryOrder,
    QuerySelect,
};
use std::sync::Arc;
use tokio::sync::RwLock;

#[derive(Debug)]
pub struct TagLocalSqliteRepository {
    db_manager: Arc<RwLock<DatabaseManager>>,
}

impl TagLocalSqliteRepository {
    pub fn new(db_manager: Arc<RwLock<DatabaseManager>>) -> Self {
        Self { db_manager }
    }

    pub async fn find_by_name(&self, name: &str) -> Result<Option<Tag>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(|e| RepositoryError::from(e))?;

        if let Some(model) = TagEntity::find()
            .filter(Column::Name.eq(name))
            .one(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?
        {
            let tag = model
                .to_domain_model()
                .await
                .map_err(|e: String| RepositoryError::from(SQLiteError::ConversionError(e)))?;
            Ok(Some(tag))
        } else {
            Ok(None)
        }
    }

    pub async fn find_by_color(&self, color: &str) -> Result<Vec<Tag>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(|e| RepositoryError::from(e))?;

        let models = TagEntity::find()
            .filter(Column::Color.eq(color))
            .order_by_asc(Column::OrderIndex)
            .all(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        let mut tags = Vec::new();
        for model in models {
            let tag = model
                .to_domain_model()
                .await
                .map_err(|e: String| RepositoryError::from(SQLiteError::ConversionError(e)))?;
            tags.push(tag);
        }

        Ok(tags)
    }

    pub async fn find_popular_tags(&self, limit: u64) -> Result<Vec<Tag>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(|e| RepositoryError::from(e))?;

        let models = TagEntity::find()
            .order_by_desc(Column::UsageCount)
            .limit(limit)
            .all(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        let mut tags = Vec::new();
        for model in models {
            let tag = model
                .to_domain_model()
                .await
                .map_err(|e: String| RepositoryError::from(SQLiteError::ConversionError(e)))?;
            tags.push(tag);
        }

        Ok(tags)
    }

    pub async fn increment_usage(&self, project_id: &str, tag_id: &str) -> Result<Tag, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(|e| RepositoryError::from(e))?;

        let existing = TagEntity::find_by_id((project_id.to_string(), tag_id.to_string()))
            .one(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?
            .ok_or_else(|| RepositoryError::NotFound(format!("Tag not found: {}", tag_id)))?;

        let active_model: TagActiveModel = existing.into();
        let updated_model = active_model.increment_usage();

        let updated = updated_model
            .update(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;
        updated
            .to_domain_model()
            .await
            .map_err(RepositoryError::Conversion)
    }

    pub async fn decrement_usage(&self, project_id: &str, tag_id: &str) -> Result<Tag, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(|e| RepositoryError::from(e))?;

        let existing = TagEntity::find_by_id((project_id.to_string(), tag_id.to_string()))
            .one(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?
            .ok_or_else(|| RepositoryError::NotFound(format!("Tag not found: {}", tag_id)))?;

        let active_model: TagActiveModel = existing.into();
        let updated_model = active_model.decrement_usage();

        let updated = updated_model
            .update(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;
        updated
            .to_domain_model()
            .await
            .map_err(RepositoryError::Conversion)
    }

    pub async fn find_by_name_in_project(&self, project_id: &ProjectId, name: &str) -> Result<Option<Tag>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(|e| RepositoryError::from(e))?;

        if let Some(model) = TagEntity::find()
            .filter(Column::ProjectId.eq(project_id.to_string()))
            .filter(Column::Name.eq(name))
            .one(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?
        {
            let tag = model
                .to_domain_model()
                .await
                .map_err(|e: String| RepositoryError::from(SQLiteError::ConversionError(e)))?;
            Ok(Some(tag))
        } else {
            Ok(None)
        }
    }
}

#[async_trait]
impl ProjectRepository<Tag, TagId> for TagLocalSqliteRepository {
    async fn save(&self, project_id: &ProjectId, tag: &Tag) -> Result<(), RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(|e| RepositoryError::from(e))?;

        // 名前での重複チェック（プロジェクト内のみ）
        let existing_by_name = self.find_by_name_in_project(project_id, &tag.name).await?;
        if let Some(existing_tag) = existing_by_name {
            if existing_tag.id != tag.id {
                // 既存の同名タグがある場合は、何もせずに正常終了
                // （フロントエンドからの重複登録要求を無視）
                return Ok(());
            }
        }

        // IDで既存のタグをチェック
        let existing = TagEntity::find_by_id((project_id.to_string(), tag.id.to_string()))
            .one(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        if let Some(existing_model) = existing {
            // 更新
            let mut active_model: TagActiveModel = existing_model.into();
            let new_active = tag
                .to_sqlite_model()
                .await
                .map_err(|e: String| RepositoryError::from(SQLiteError::ConversionError(e)))?;

            active_model.name = new_active.name;
            active_model.color = new_active.color;
            active_model.order_index = new_active.order_index;
            active_model.updated_at = new_active.updated_at;

            active_model
                .update(db)
                .await
                .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;
            Ok(())
        } else {
            // 新規作成
            let active_model = tag
                .to_sqlite_model_with_project_id(&project_id)
                .await
                .map_err(|e: String| RepositoryError::from(SQLiteError::ConversionError(e)))?;
            active_model
                .insert(db)
                .await
                .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;
            Ok(())
        }
    }

    async fn find_by_id(
        &self,
        project_id: &ProjectId,
        id: &TagId,
    ) -> Result<Option<Tag>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(|e| RepositoryError::from(e))?;

        if let Some(model) = TagEntity::find_by_id((project_id.to_string(), id.to_string()))
            .one(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?
        {
            let tag = model
                .to_domain_model()
                .await
                .map_err(|e: String| RepositoryError::from(SQLiteError::ConversionError(e)))?;
            Ok(Some(tag))
        } else {
            Ok(None)
        }
    }

    async fn find_all(&self, project_id: &ProjectId) -> Result<Vec<Tag>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(|e| RepositoryError::from(e))?;

        let models = TagEntity::find()
            .filter(Column::ProjectId.eq(project_id.to_string()))
            .order_by_asc(Column::OrderIndex)
            .all(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        let mut tags = Vec::new();
        for model in models {
            let tag = model
                .to_domain_model()
                .await
                .map_err(|e: String| RepositoryError::from(SQLiteError::ConversionError(e)))?;
            tags.push(tag);
        }

        Ok(tags)
    }

    async fn delete(&self, project_id: &ProjectId, id: &TagId) -> Result<(), RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(|e| RepositoryError::from(e))?;
        TagEntity::delete_by_id((project_id.to_string(), id.to_string()))
            .exec(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;
        Ok(())
    }

    async fn exists(&self, project_id: &ProjectId, id: &TagId) -> Result<bool, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(|e| RepositoryError::from(e))?;
        let count = TagEntity::find_by_id((project_id.to_string(), id.to_string()))
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
            .map_err(|e| RepositoryError::from(e))?;
        let count = TagEntity::find()
            .filter(Column::ProjectId.eq(project_id.to_string()))
            .count(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;
        Ok(count)
    }
}
