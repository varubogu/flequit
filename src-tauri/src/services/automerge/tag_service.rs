use crate::errors::ServiceError;
use crate::types::user_types::Tag;
use crate::repositories::automerge::TagRepository;
use tauri::{AppHandle, State};

pub struct TagService;

impl TagService {
    pub fn new() -> Self {
        Self
    }

    // グローバルタグ操作
    pub async fn create_tag(&self, tag_repository: State<'_, TagRepository>, tag: &Tag) -> Result<(), ServiceError> {
        todo!("Implementation pending - use tag_repository")
    }

    pub async fn get_tag(&self, tag_repository: State<'_, TagRepository>, tag_id: &str) -> Result<Option<Tag>, ServiceError> {
        todo!("Implementation pending - use tag_repository")
    }

    pub async fn update_tag(&self, tag_repository: State<'_, TagRepository>, tag: &Tag) -> Result<(), ServiceError> {
        todo!("Implementation pending - use tag_repository")
    }

    pub async fn delete_tag(&self, tag_repository: State<'_, TagRepository>, tag_id: &str) -> Result<(), ServiceError> {
        todo!("Implementation pending - use tag_repository")
    }

    pub async fn list_tags(&self, tag_repository: State<'_, TagRepository>) -> Result<Vec<Tag>, ServiceError> {
        todo!("Implementation pending - use tag_repository")
    }

    // タグ使用状況
    pub async fn get_tag_usage_count(&self, tag_repository: State<'_, TagRepository>, tag_id: &str) -> Result<u32, ServiceError> {
        todo!("Implementation pending - count tasks using this tag with tag_repository")
    }

    pub async fn list_popular_tags(&self, tag_repository: State<'_, TagRepository>, limit: u32) -> Result<Vec<Tag>, ServiceError> {
        todo!("Implementation pending - return tags sorted by usage count using tag_repository")
    }

    // ビジネスロジック
    pub async fn validate_tag(&self, tag_repository: State<'_, TagRepository>, tag: &Tag) -> Result<(), ServiceError> {
        if tag.name.trim().is_empty() {
            return Err(ServiceError::ValidationError("Tag name cannot be empty".to_string()));
        }

        if tag.name.len() > 50 {
            return Err(ServiceError::ValidationError("Tag name too long".to_string()));
        }

        // タグ名の重複チェック
        if self.is_tag_name_exists(tag_repository, &tag.name, Some(&tag.id)).await? {
            return Err(ServiceError::ValidationError("Tag name already exists".to_string()));
        }

        Ok(())
    }

    pub async fn search_tags_by_name(&self, tag_repository: State<'_, TagRepository>, name: &str, limit: usize) -> Result<Vec<Tag>, ServiceError> {
        todo!("Implementation pending - search tags by name using tag_repository")
    }

    pub async fn is_tag_name_exists(&self, tag_repository: State<'_, TagRepository>, name: &str, exclude_id: Option<&str>) -> Result<bool, ServiceError> {
        todo!("Implementation pending - check if tag name already exists using tag_repository")
    }

    pub async fn can_delete_tag(&self, tag_repository: State<'_, TagRepository>, tag_id: &str) -> Result<bool, ServiceError> {
        let usage_count = self.get_tag_usage_count(tag_repository, tag_id).await?;
        Ok(usage_count == 0)
    }
}
