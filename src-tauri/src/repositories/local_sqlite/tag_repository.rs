//! Tag用SQLiteリポジトリ

use sea_orm::{EntityTrait, QueryFilter, QueryOrder, ColumnTrait, ActiveModelTrait, QuerySelect};
use crate::models::tag::Tag;
use crate::models::sqlite::tag::{Entity as TagEntity, ActiveModel as TagActiveModel, Column};
use crate::models::sqlite::{SqliteModelConverter, DomainToSqliteConverter};
use super::{DatabaseManager, RepositoryError, Repository};

pub struct TagRepository {
    db_manager: DatabaseManager,
}

impl TagRepository {
    pub fn new(db_manager: DatabaseManager) -> Self {
        Self { db_manager }
    }

    pub async fn find_by_name(&self, name: &str) -> Result<Option<Tag>, RepositoryError> {
        let db = self.db_manager.get_connection().await?;
        
        if let Some(model) = TagEntity::find()
            .filter(Column::Name.eq(name))
            .one(db)
            .await?
        {
            let tag = model.to_domain_model().await.map_err(RepositoryError::Conversion)?;
            Ok(Some(tag))
        } else {
            Ok(None)
        }
    }

    pub async fn find_by_color(&self, color: &str) -> Result<Vec<Tag>, RepositoryError> {
        let db = self.db_manager.get_connection().await?;
        
        let models = TagEntity::find()
            .filter(Column::Color.eq(color))
            .order_by_asc(Column::OrderIndex)
            .all(db)
            .await?;
        
        let mut tags = Vec::new();
        for model in models {
            let tag = model.to_domain_model().await.map_err(RepositoryError::Conversion)?;
            tags.push(tag);
        }
        
        Ok(tags)
    }

    pub async fn find_popular_tags(&self, limit: u64) -> Result<Vec<Tag>, RepositoryError> {
        let db = self.db_manager.get_connection().await?;
        
        let models = TagEntity::find()
            .order_by_desc(Column::UsageCount)
            .limit(limit)
            .all(db)
            .await?;
        
        let mut tags = Vec::new();
        for model in models {
            let tag = model.to_domain_model().await.map_err(RepositoryError::Conversion)?;
            tags.push(tag);
        }
        
        Ok(tags)
    }

    pub async fn increment_usage(&self, tag_id: &str) -> Result<Tag, RepositoryError> {
        let db = self.db_manager.get_connection().await?;
        
        let existing = TagEntity::find_by_id(tag_id)
            .one(db)
            .await?
            .ok_or_else(|| RepositoryError::NotFound(format!("Tag not found: {}", tag_id)))?;

        let active_model: TagActiveModel = existing.into();
        let updated_model = active_model.increment_usage();
        
        let updated = updated_model.update(db).await?;
        updated.to_domain_model().await.map_err(RepositoryError::Conversion)
    }

    pub async fn decrement_usage(&self, tag_id: &str) -> Result<Tag, RepositoryError> {
        let db = self.db_manager.get_connection().await?;
        
        let existing = TagEntity::find_by_id(tag_id)
            .one(db)
            .await?
            .ok_or_else(|| RepositoryError::NotFound(format!("Tag not found: {}", tag_id)))?;

        let active_model: TagActiveModel = existing.into();
        let updated_model = active_model.decrement_usage();
        
        let updated = updated_model.update(db).await?;
        updated.to_domain_model().await.map_err(RepositoryError::Conversion)
    }
}

#[async_trait::async_trait]
impl Repository<Tag> for TagRepository {
    async fn save(&self, tag: &Tag) -> Result<Tag, RepositoryError> {
        let db = self.db_manager.get_connection().await?;
        
        // 名前で既存のタグをチェック
        let existing = TagEntity::find()
            .filter(Column::Name.eq(&tag.name))
            .one(db)
            .await?;
        
        if let Some(existing_model) = existing {
            // 更新
            let mut active_model: TagActiveModel = existing_model.into();
            let new_active = tag.to_sqlite_model().await.map_err(RepositoryError::Conversion)?;
            
            active_model.color = new_active.color;
            active_model.order_index = new_active.order_index;
            active_model.updated_at = new_active.updated_at;
            
            let updated = active_model.update(db).await?;
            updated.to_domain_model().await.map_err(RepositoryError::Conversion)
        } else {
            // 新規作成
            let active_model = tag.to_sqlite_model().await.map_err(RepositoryError::Conversion)?;
            let saved = active_model.insert(db).await?;
            saved.to_domain_model().await.map_err(RepositoryError::Conversion)
        }
    }

    async fn find_by_id(&self, id: &str) -> Result<Option<Tag>, RepositoryError> {
        let db = self.db_manager.get_connection().await?;
        
        if let Some(model) = TagEntity::find_by_id(id).one(db).await? {
            let tag = model.to_domain_model().await.map_err(RepositoryError::Conversion)?;
            Ok(Some(tag))
        } else {
            Ok(None)
        }
    }

    async fn update(&self, tag: &Tag) -> Result<Tag, RepositoryError> {
        let db = self.db_manager.get_connection().await?;
        
        let existing = TagEntity::find_by_id(&tag.id.to_string())
            .one(db)
            .await?
            .ok_or_else(|| RepositoryError::NotFound(format!("Tag not found: {}", tag.id)))?;

        let mut active_model: TagActiveModel = existing.into();
        let new_active = tag.to_sqlite_model().await.map_err(RepositoryError::Conversion)?;
        
        active_model.name = new_active.name;
        active_model.color = new_active.color;
        active_model.order_index = new_active.order_index;
        active_model.updated_at = new_active.updated_at;
        
        let updated = active_model.update(db).await?;
        updated.to_domain_model().await.map_err(RepositoryError::Conversion)
    }

    async fn delete_by_id(&self, id: &str) -> Result<bool, RepositoryError> {
        let db = self.db_manager.get_connection().await?;
        let result = TagEntity::delete_by_id(id).exec(db).await?;
        Ok(result.rows_affected > 0)
    }

    async fn find_all(&self) -> Result<Vec<Tag>, RepositoryError> {
        let db = self.db_manager.get_connection().await?;
        
        let models = TagEntity::find()
            .order_by_asc(Column::OrderIndex)
            .all(db)
            .await?;
        
        let mut tags = Vec::new();
        for model in models {
            let tag = model.to_domain_model().await.map_err(RepositoryError::Conversion)?;
            tags.push(tag);
        }
        
        Ok(tags)
    }
}