use crate::models::tag::Tag;
use crate::errors::service_error::ServiceError;
use crate::repositories::local_automerge::projects_repository::ProjectsRepository;

#[allow(dead_code)]
pub struct TagService;

#[allow(dead_code)]
impl TagService {
    pub async fn create_tag(
        &self,
        tag: &Tag,
    ) -> Result<(), ServiceError> {
        if tag.name.trim().is_empty() {
            return Err(ServiceError::ValidationError("Tag name cannot be empty".to_string()));
        }
        let mut repository = ProjectsRepository::with_default_path()?;
        repository.save_tag(tag).await?;
        Ok(())
    }

    pub async fn get_tag(
        &self,
        tag_id: &str,
    ) -> Result<Option<Tag>, ServiceError> {
        if tag_id.trim().is_empty() {
            return Err(ServiceError::ValidationError("Tag ID cannot be empty".to_string()));
        }
        let mut repository = ProjectsRepository::with_default_path()?;
        Ok(repository.get_tag(tag_id).await?)
    }

    pub async fn list_tags(
        &self,
    ) -> Result<Vec<Tag>, ServiceError> {
        // 一時的に空のVecを返す
        Ok(Vec::new())
    }

    pub async fn update_tag(
        &self,
        tag: &Tag,
    ) -> Result<(), ServiceError> {
        if tag.name.trim().is_empty() {
            return Err(ServiceError::ValidationError("Tag name cannot be empty".to_string()));
        }
        let mut repository = ProjectsRepository::with_default_path()?;
        repository.save_tag(tag).await?;
        Ok(())
    }

    pub async fn delete_tag(
        &self,
        tag_id: &str,
    ) -> Result<(), ServiceError> {
        // 一時的に何もしない
        let _ = tag_id;
        Ok(())
    }

    pub async fn search_tags_by_name(
        &self,
        name: &str,
    ) -> Result<Vec<Tag>, ServiceError> {
        // 一時的に空のVecを返す
        let _ = name;
        Ok(Vec::new())
    }

    pub async fn get_tag_usage_count(
        &self,
        tag_id: &str,
    ) -> Result<u32, ServiceError> {
        // 一時的に0を返す
        let _ = tag_id;
        Ok(0)
    }

    pub async fn is_tag_name_exists(
        &self,
        _name: &str,
        _exclude_id: Option<&str>,
    ) -> Result<bool, ServiceError> {
        Err(ServiceError::InternalError("Temporarily disabled".to_string()))
    }

    pub async fn list_popular_tags(
        &self,
        limit: u32,
    ) -> Result<Vec<Tag>, ServiceError> {
        // 一時的に空のVecを返す
        let _ = limit;
        Ok(Vec::new())
    }
}
