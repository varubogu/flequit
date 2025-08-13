use async_trait::async_trait;
use crate::errors::RepositoryError;
use crate::models::tag::Tag;
use crate::repositories::sqlite::SqliteRepository;
use crate::repositories::core::tag_repository_trait::TagRepositoryTrait;


#[async_trait]
impl TagRepositoryTrait for SqliteRepository {
    async fn set_tag(&self, _tag: &Tag) -> Result<(), RepositoryError> {
        todo!("SQLiteでのタグ保存実装")
    }

    async fn get_tag(&self, _tag_id: &str) -> Result<Option<Tag>, RepositoryError> {
        todo!("SQLiteでのタグ取得実装")
    }

    async fn list_tags(&self) -> Result<Vec<Tag>, RepositoryError> {
        todo!("SQLiteでのタグ一覧実装")
    }

    async fn delete_tag(&self, _tag_id: &str) -> Result<(), RepositoryError> {
        todo!("SQLiteでのタグ削除実装")
    }

    async fn find_tags_by_name(&self, _name_pattern: &str) -> Result<Vec<Tag>, RepositoryError> {
        todo!("SQLiteでの名前別タグ検索実装")
    }

    async fn find_tags_by_color(&self, _color: &str) -> Result<Vec<Tag>, RepositoryError> {
        todo!("SQLiteでの色別タグ検索実装")
    }

    async fn get_tag_usage_count(&self, _tag_id: &str) -> Result<u32, RepositoryError> {
        todo!("SQLiteでのタグ使用回数取得実装")
    }

    async fn get_tags_with_usage_count(&self) -> Result<Vec<(Tag, u32)>, RepositoryError> {
        todo!("SQLiteでのタグ使用回数付き一覧実装")
    }

    async fn get_popular_tags(&self, _limit: u32) -> Result<Vec<(Tag, u32)>, RepositoryError> {
        todo!("SQLiteでの人気タグ取得実装")
    }

    async fn get_unused_tags(&self) -> Result<Vec<Tag>, RepositoryError> {
        todo!("SQLiteでの未使用タグ取得実装")
    }

    async fn validate_tag_exists(&self, _tag_id: &str) -> Result<bool, RepositoryError> {
        todo!("SQLiteでのタグ存在検証実装")
    }

    async fn is_tag_name_unique(&self, _name: &str, _exclude_id: Option<&str>) -> Result<bool, RepositoryError> {
        todo!("SQLiteでのタグ名ユニーク性検証実装")
    }

    async fn can_delete_tag(&self, _tag_id: &str) -> Result<bool, RepositoryError> {
        todo!("SQLiteでのタグ削除可能性検証実装")
    }

    async fn get_tag_count(&self) -> Result<u64, RepositoryError> {
        todo!("SQLiteでのタグ数取得実装")
    }

    async fn get_color_distribution(&self) -> Result<Vec<(Option<String>, u32)>, RepositoryError> {
        todo!("SQLiteでのタグ色分布取得実装")
    }
}
