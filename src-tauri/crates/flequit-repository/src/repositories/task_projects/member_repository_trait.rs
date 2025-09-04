use async_trait::async_trait;
use flequit_model::models::task_projects::member::Member;
use flequit_model::types::id_types::{UserId, ProjectId};
use flequit_types::errors::repository_error::RepositoryError;
use crate::repositories::base_repository_trait::Repository;

/// メンバーリポジトリのトレイト
#[async_trait]
pub trait MemberRepositoryTrait: Repository<Member, UserId> + Send + Sync {
    /// 指定したIDのメンバーを取得
    async fn get_member(&self, id: &UserId) -> Result<Option<Member>, RepositoryError>;

    /// 指定プロジェクトのメンバー一覧を取得
    async fn find_by_project_id(&self, project_id: &ProjectId) -> Result<Vec<Member>, RepositoryError>;

    /// すべてのメンバーを取得
    async fn get_all_members(&self) -> Result<Vec<Member>, RepositoryError>;

    /// メンバーを新規追加
    async fn add_member(&self, member: &Member) -> Result<(), RepositoryError>;

    /// メンバーを更新
    async fn update_member(&self, member: &Member) -> Result<(), RepositoryError>;

    /// メンバーを削除
    async fn delete_member(&self, id: &UserId) -> Result<(), RepositoryError>;
}
