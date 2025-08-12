use crate::types::tag_types::Tag;
use crate::repositories::core::CoreRepositoryTrait;
use crate::errors::service_error::ServiceError;

pub struct TagService;

impl TagService {
    pub async fn create_tag(
        &self,
        repositories: &mut [Box<dyn CoreRepositoryTrait>],
        tag: &Tag,
    ) -> Result<(), ServiceError> {
        for repo in repositories {
            repo.set_tag(tag).await?;
        }
        Ok(())
    }

    pub async fn get_tag(
        &self,
        repository: &dyn CoreRepositoryTrait,
        tag_id: &str,
    ) -> Result<Option<Tag>, ServiceError> {
        Ok(repository.get_tag(tag_id).await?)
    }

    pub async fn list_tags(
        &self,
        repository: &dyn CoreRepositoryTrait,
    ) -> Result<Vec<Tag>, ServiceError> {
        Ok(repository.list_tags().await?)
    }

    pub async fn update_tag(
        &self,
        repositories: &mut [Box<dyn CoreRepositoryTrait>],
        tag: &Tag,
    ) -> Result<(), ServiceError> {
        for repo in repositories {
            repo.set_tag(tag).await?;
        }
        Ok(())
    }

    pub async fn delete_tag(
        &self,
        repositories: &mut [Box<dyn CoreRepositoryTrait>],
        tag_id: &str,
    ) -> Result<(), ServiceError> {
        for repo in repositories {
            repo.delete_tag(tag_id).await?;
        }
        Ok(())
    }

    pub async fn search_tags_by_name(
        &self,
        repository: &dyn CoreRepositoryTrait,
        name: &str,
    ) -> Result<Vec<Tag>, ServiceError> {
        Ok(repository.find_tags_by_name(name).await?)
    }

    pub async fn get_tag_usage_count(
        &self,
        repository: &dyn CoreRepositoryTrait,
        tag_id: &str,
    ) -> Result<u32, ServiceError> {
        Ok(repository.get_tag_usage_count(tag_id).await?)
    }

    pub async fn is_tag_name_exists(
        &self,
        _repository: &dyn CoreRepositoryTrait,
        _name: &str,
        _exclude_id: Option<&str>,
    ) -> Result<bool, ServiceError> {
        Err(ServiceError::InternalError("Temporarily disabled".to_string()))
    }

    pub async fn list_popular_tags(
        &self,
        repository: &dyn CoreRepositoryTrait,
        limit: u32,
    ) -> Result<Vec<Tag>, ServiceError> {
        let popular_tags = repository.get_popular_tags(limit).await?;
        Ok(popular_tags.into_iter().map(|(tag, _)| tag).collect())
    }
}