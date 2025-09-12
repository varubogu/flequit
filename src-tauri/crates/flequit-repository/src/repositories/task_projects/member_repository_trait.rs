use crate::repositories::project_repository_trait::ProjectRepository;
use async_trait::async_trait;
use flequit_model::models::task_projects::member::Member;
use flequit_model::types::id_types::UserId;

/// メンバーリポジトリのトレイト
#[async_trait]
pub trait MemberRepositoryTrait: ProjectRepository<Member, UserId> + Send + Sync {}
