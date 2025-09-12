//! タスク割り当てリポジトリトレイト

use async_trait::async_trait;
use flequit_model::models::task_projects::subtask_tag::SubTaskTag;
use flequit_model::types::id_types::{SubTaskId, TagId};

use crate::repositories::project_relation_repository_trait::ProjectRelationRepository;

#[async_trait]
pub trait SubTaskTagRepositoryTrait:
    ProjectRelationRepository<SubTaskTag, SubTaskId, TagId>
{
    // ProjectRelationRepositoryのメソッドを使用：
    // - add: プロジェクト内でサブタスクにタグを紐付け
    // - remove: プロジェクト内でタグ紐付けを削除
    // - find_relations: プロジェクト内でサブタスクのタグ一覧を取得
    // - find_all: プロジェクト内の全サブタスクタグを取得
}
