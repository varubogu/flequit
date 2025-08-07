use std::sync::Arc;
use crate::repositories::automerge::tag_repository::{TagRepository, TagRepositoryTrait};
use crate::types::Tag;
use crate::errors::ServiceError;
use chrono::Utc;

pub struct TagService {
    tag_repo: Arc<TagRepository>,
}

impl TagService {
    pub fn new(tag_repo: Arc<TagRepository>) -> Self {
        Self { tag_repo }
    }
    
    pub async fn create_tag(
        &self,
        name: String,
        color: Option<String>,
    ) -> Result<Tag, ServiceError> {
        // 入力検証
        if name.trim().is_empty() {
            return Err(ServiceError::ValidationError("Tag name cannot be empty".to_string()));
        }
        
        if name.len() > 50 {
            return Err(ServiceError::ValidationError("Tag name too long".to_string()));
        }
        
        // カラー検証（HEX形式のチェック）
        if let Some(ref color_val) = color {
            if !color_val.starts_with('#') || color_val.len() != 7 {
                return Err(ServiceError::ValidationError("Color must be in HEX format (#RRGGBB)".to_string()));
            }
        }
        
        let tag = Tag {
            id: uuid::Uuid::new_v4().to_string(),
            name: name.trim().to_string(),
            color,
            created_at: Utc::now().timestamp_millis(),
            updated_at: Utc::now().timestamp_millis(),
        };
        
        self.tag_repo.create(&tag).await?;
        
        Ok(tag)
    }
    
    pub async fn get_tag(&self, tag_id: &str) -> Result<Option<Tag>, ServiceError> {
        if tag_id.trim().is_empty() {
            return Err(ServiceError::ValidationError("Tag ID cannot be empty".to_string()));
        }
        
        self.tag_repo.get(tag_id).await
    }
    
    pub async fn list_tags(&self) -> Result<Vec<Tag>, ServiceError> {
        self.tag_repo.list().await
    }
    
    pub async fn update_tag(
        &self,
        tag_id: &str,
        name: Option<String>,
        color: Option<String>,
    ) -> Result<Tag, ServiceError> {
        let mut tag = self.tag_repo.get(tag_id).await?
            .ok_or_else(|| ServiceError::NotFound("Tag not found".to_string()))?;
        
        // 名前更新
        if let Some(new_name) = name {
            if new_name.trim().is_empty() {
                return Err(ServiceError::ValidationError("Tag name cannot be empty".to_string()));
            }
            if new_name.len() > 50 {
                return Err(ServiceError::ValidationError("Tag name too long".to_string()));
            }
            tag.name = new_name.trim().to_string();
        }
        
        // カラー更新
        if let Some(new_color) = color {
            if !new_color.starts_with('#') || new_color.len() != 7 {
                return Err(ServiceError::ValidationError("Color must be in HEX format (#RRGGBB)".to_string()));
            }
            tag.color = Some(new_color);
        }
        
        tag.updated_at = Utc::now().timestamp_millis();
        
        self.tag_repo.update(&tag).await?;
        
        Ok(tag)
    }
    
    pub async fn delete_tag(&self, tag_id: &str) -> Result<(), ServiceError> {
        // タグ存在確認
        self.tag_repo.get(tag_id).await?
            .ok_or_else(|| ServiceError::NotFound("Tag not found".to_string()))?;
        
        // TODO: 関連タスクからのタグ削除も検討
        
        self.tag_repo.delete(tag_id).await?;
        
        Ok(())
    }
}