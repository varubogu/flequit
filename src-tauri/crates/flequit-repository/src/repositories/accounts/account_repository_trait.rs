use async_trait::async_trait;

/// アカウント専用のリポジトリトレイト
///
/// 基本的なCRUD操作に加えて、アカウント固有の操作を定義
#[async_trait]
pub trait AccountRepositoryTrait: Send + Sync {
    // 基本的なCRUD操作は base_repository_trait::Repository で提供される
}
