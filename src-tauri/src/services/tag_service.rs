use crate::models::tag::Tag;
use crate::errors::service_error::ServiceError;

#[allow(dead_code)]
pub struct TagService;

#[allow(dead_code)]
impl TagService {
    pub async fn create_tag(
        &self,
        tag: &Tag,
    ) -> Result<(), ServiceError> {
        // 一時的に何もしない
        let _ = tag;
        Ok(())
    }

    pub async fn get_tag(
        &self,
        tag_id: &str,
    ) -> Result<Option<Tag>, ServiceError> {
        // 一時的にNoneを返す
        let _ = tag_id;
        Ok(None)
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
        // 一時的に何もしない
        let _ = tag;
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
