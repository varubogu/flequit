//! タスク割り当てリポジトリトレイト

use async_trait::async_trait;
use flequit_model::models::task_projects::task_assignment::TaskAssignment;
use flequit_model::types::id_types::{TaskId, UserId};

use crate::repositories::project_relation_repository_trait::ProjectRelationRepository;

#[async_trait]
pub trait TaskAssignmentRepositoryTrait:
    ProjectRelationRepository<TaskAssignment, TaskId, UserId>
{
    // ProjectRelationRepositoryのメソッドを使用：
    // - add: プロジェクト内でタスクにユーザーを割り当て
    // - remove: プロジェクト内で割り当てを削除
    // - find_relations: プロジェクト内でタスクの割り当て一覧を取得
    // - find_all: プロジェクト内の全割り当てを取得
}
