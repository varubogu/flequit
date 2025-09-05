use async_trait::async_trait;
use flequit_model::models::task_projects::member::Member;
use flequit_model::types::id_types::UserId;
use crate::repositories::project_repository_trait::ProjectRepository;

/// メンバーリポジトリのトレイト
#[async_trait]
pub trait MemberRepositoryTrait: ProjectRepository<Member, UserId> + Send + Sync {
    // ProjectRepositoryのメソッドを使用：
    // - find_by_id: プロジェクト内でメンバーIDを検索
    // - find_all: プロジェクト内の全メンバーを取得
    // - save: メンバーを保存（追加・更新）
    // - delete: メンバーを削除
}
