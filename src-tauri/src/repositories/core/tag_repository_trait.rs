use crate::errors::RepositoryError;
use crate::models::tag_models::Tag;
use async_trait::async_trait;

#[async_trait]
#[allow(dead_code)]
pub trait TagRepositoryTrait {
    async fn set_tag(&self, tag: &Tag) -> Result<(), RepositoryError>;
    
    async fn get_tag(&self, tag_id: &str) -> Result<Option<Tag>, RepositoryError>;
    
    async fn list_tags(&self) -> Result<Vec<Tag>, RepositoryError>;
    
    async fn delete_tag(&self, tag_id: &str) -> Result<(), RepositoryError>;

    async fn find_tags_by_name(&self, name_pattern: &str) -> Result<Vec<Tag>, RepositoryError>;
    
    async fn find_tags_by_color(&self, color: &str) -> Result<Vec<Tag>, RepositoryError>;

    async fn get_tag_usage_count(&self, tag_id: &str) -> Result<u32, RepositoryError>;
    
    async fn get_tags_with_usage_count(&self) -> Result<Vec<(Tag, u32)>, RepositoryError>;
    
    async fn get_popular_tags(&self, limit: u32) -> Result<Vec<(Tag, u32)>, RepositoryError>;
    
    async fn get_unused_tags(&self) -> Result<Vec<Tag>, RepositoryError>;

    async fn validate_tag_exists(&self, tag_id: &str) -> Result<bool, RepositoryError>;
    
    async fn is_tag_name_unique(&self, name: &str, exclude_id: Option<&str>) -> Result<bool, RepositoryError>;
    
    async fn can_delete_tag(&self, tag_id: &str) -> Result<bool, RepositoryError>;

    async fn get_tag_count(&self) -> Result<u64, RepositoryError>;
    
    async fn get_color_distribution(&self) -> Result<Vec<(Option<String>, u32)>, RepositoryError>;
}