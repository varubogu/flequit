use async_trait::async_trait;
use crate::repositories::project_repository_trait::ProjectRepositoryTrait;
use crate::repositories::web::WebRepository;

// Repository<Project>実装はmod.rsに移動

// ProjectRepositoryTraitの実装（現在は追加メソッドなし）
#[async_trait]
impl ProjectRepositoryTrait for WebRepository {
    // 現時点では追加メソッドなし
}
