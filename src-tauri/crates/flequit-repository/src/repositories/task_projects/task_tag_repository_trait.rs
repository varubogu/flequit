//! タスク割り当てリポジトリトレイト

use async_trait::async_trait;
use flequit_model::models::task_projects::task_tag::TaskTag;
use flequit_model::types::id_types::{TaskId, TagId};

use crate::repositories::project_relation_repository_trait::ProjectRelationRepository;

#[async_trait]
pub trait TaskTagRepositoryTrait: ProjectRelationRepository<TaskTag, TaskId, TagId> {
    // ProjectRelationRepositoryのメソッドを使用：
    // - add: プロジェクト内でタスクにタグを紐付け
    // - remove: プロジェクト内でタグ紐付けを削除
    // - find_relations: プロジェクト内でタスクのタグ一覧を取得
    // - find_all: プロジェクト内の全タスクタグを取得
}
