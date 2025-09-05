//! タスク割り当てリポジトリトレイト

use async_trait::async_trait;
use flequit_model::models::task_projects::subtask_assignment::SubTaskAssignment;
use flequit_model::types::id_types::{SubTaskId, UserId};

use crate::repositories::project_relation_repository_trait::ProjectRelationRepository;

#[async_trait]
pub trait SubTaskAssignmentRepositoryTrait: ProjectRelationRepository<SubTaskAssignment, SubTaskId, UserId> {
    // ProjectRelationRepositoryのメソッドを使用：
    // - add: プロジェクト内でサブタスクにユーザーを割り当て
    // - remove: プロジェクト内で割り当てを削除
    // - find_relations: プロジェクト内でサブタスクの割り当て一覧を取得
    // - find_all: プロジェクト内の全割り当てを取得
}
