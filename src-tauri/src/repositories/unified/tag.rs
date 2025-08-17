//! タグ用統合リポジトリ
//!
//! SQLite（高速検索）とAutomerge（永続化・同期）を統合し、
//! タグエンティティに最適化されたアクセスパターンを提供する。

use async_trait::async_trait;
use log::info;

use crate::errors::RepositoryError;
use crate::models::tag::Tag;
use crate::repositories::{
    base_repository_trait::Repository, tag_repository_trait::TagRepositoryTrait,
};
use crate::types::id_types::TagId;

/// タグ用統合リポジトリ
///
/// 検索系操作はSQLite、保存系操作はAutomerge→SQLiteの順で実行し、
/// タグエンティティに最適化されたアクセスパターンを提供する。
pub struct TagUnifiedRepository {}

impl TagUnifiedRepository {
    pub fn new() -> Self {
        Self {}
    }
}

#[async_trait]
impl Repository<Tag, TagId> for TagUnifiedRepository {
    async fn save(&self, entity: &Tag) -> Result<(), RepositoryError> {
        info!("TagUnifiedRepository::save");
        info!("{:?}", entity);

        Ok(())
    }

    async fn find_by_id(&self, id: &TagId) -> Result<Option<Tag>, RepositoryError> {
        info!("TagUnifiedRepository::find_by_id");
        info!("{:?}", id);
        Ok(Option::from(None))
    }

    async fn find_all(&self) -> Result<Vec<Tag>, RepositoryError> {
        info!("TagUnifiedRepository::find_all");
        Ok(vec![])
    }

    async fn delete(&self, id: &TagId) -> Result<(), RepositoryError> {
        info!("TagUnifiedRepository::delete");
        info!("{:?}", id);
        Ok(())
    }

    async fn exists(&self, id: &TagId) -> Result<bool, RepositoryError> {
        info!("TagUnifiedRepository::exists");
        info!("{:?}", id);
        Ok(true)
    }

    async fn count(&self) -> Result<u64, RepositoryError> {
        info!("TagUnifiedRepository::count");
        Ok(0)
    }
}

impl TagRepositoryTrait for TagUnifiedRepository {}
