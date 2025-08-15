use async_trait::async_trait;
use crate::errors::RepositoryError;
use crate::repositories::cloud_automerge::CloudAutomergeRepository;
use crate::models::project::Project;
use crate::repositories::base_repository_trait::Repository;
use crate::repositories::project_repository_trait::ProjectRepositoryTrait;

// TODO: 将来実装予定
// Repository<Project>の基本CRUD実装
#[async_trait]
impl Repository<Project> for CloudAutomergeRepository {
    async fn save(&self, _entity: &Project) -> Result<(), RepositoryError> {
        todo!("クラウドAutomergeでの保存実装")
    }

    async fn find_by_id(&self, _id: &str) -> Result<Option<Project>, RepositoryError> {
        todo!("クラウドAutomergeでの検索実装")
    }

    async fn find_all(&self) -> Result<Vec<Project>, RepositoryError> {
        todo!("クラウドAutomergeでの全件取得実装")
    }

    async fn delete(&self, _id: &str) -> Result<(), RepositoryError> {
        todo!("クラウドAutomergeでの削除実装")
    }

    async fn exists(&self, _id: &str) -> Result<bool, RepositoryError> {
        todo!("クラウドAutomergeでの存在確認実装")
    }

    async fn count(&self) -> Result<u64, RepositoryError> {
        todo!("クラウドAutomergeでの件数取得実装")
    }
}

// ProjectRepositoryTraitの実装（現在は追加メソッドなし）
#[async_trait]
impl ProjectRepositoryTrait for CloudAutomergeRepository {
    // 現時点では追加メソッドなし
}
