use async_trait::async_trait;
use flequit_model::{models::users::User, types::id_types::UserId};

use crate::base_repository_trait::Repository;

/// ユーザー専用のリポジトリトレイト
///
/// 基本的なCRUD操作に加えて、ユーザー固有の操作を定義
#[async_trait]
pub trait UserRepositoryTrait: Repository<User, UserId> + Send + Sync {
    // 基本的なCRUD操作は base_repository_trait::Repository で提供される
}
