//! TaskTag用Automergeリポジトリ

use super::super::document_manager::{DocumentManager, DocumentType};
use crate::infrastructure::document::Document;
use async_trait::async_trait;
use chrono::{DateTime, Utc};
use flequit_model::models::task_projects::task_tag::TaskTag;
use flequit_model::types::id_types::{ProjectId, TagId, TaskId, UserId};
use flequit_repository::repositories::project_relation_repository_trait::ProjectRelationRepository;
use flequit_repository::repositories::task_projects::task_tag_repository_trait::TaskTagRepositoryTrait;
use flequit_types::errors::repository_error::RepositoryError;
use serde::{Deserialize, Serialize};
use std::{path::PathBuf, sync::Arc};
use tokio::sync::Mutex;

#[derive(Debug, Clone, Serialize, Deserialize)]
struct TaskTagRelation {
    task_id: String,
    tag_id: String,
    created_at: chrono::DateTime<Utc>,
    updated_at: chrono::DateTime<Utc>,
    deleted: bool,
    updated_by: String,
}

#[derive(Debug)]
pub struct TaskTagLocalAutomergeRepository {
    document_manager: Arc<Mutex<DocumentManager>>,
}

impl TaskTagLocalAutomergeRepository {
    /// 新しいTaskTagRepositoryを作成
    pub async fn new(base_path: PathBuf) -> Result<Self, RepositoryError> {
        let document_manager = DocumentManager::new(base_path)?;
        Ok(Self {
            document_manager: Arc::new(Mutex::new(document_manager)),
        })
    }

    /// 共有DocumentManagerを使用して新しいインスタンスを作成
    pub async fn new_with_manager(
        document_manager: Arc<Mutex<DocumentManager>>,
    ) -> Result<Self, RepositoryError> {
        Ok(Self { document_manager })
    }

    /// 指定されたプロジェクトのDocumentを取得または作成
    async fn get_or_create_document(
        &self,
        project_id: &ProjectId,
    ) -> Result<Document, RepositoryError> {
        let document_type = DocumentType::Project(project_id.clone());
        let mut manager = self.document_manager.lock().await;
        manager
            .get_or_create(&document_type)
            .await
            .map_err(|e| RepositoryError::AutomergeError(e.to_string()))
    }

    /// 指定タスクのタグIDリストを取得
    pub async fn find_tag_ids_by_task_id(
        &self,
        project_id: &ProjectId,
        task_id: &TaskId,
    ) -> Result<Vec<TagId>, RepositoryError> {
        let document = self.get_or_create_document(project_id).await?;
        let relations: Option<Vec<TaskTagRelation>> = document.load_data("task_tags").await?;

        if let Some(relations) = relations {
            let tag_ids = relations
                .into_iter()
                .filter(|r| r.task_id == task_id.to_string())
                .map(|r| TagId::from(r.tag_id))
                .collect();
            Ok(tag_ids)
        } else {
            Ok(vec![])
        }
    }

    /// 指定タグに関連するタスクIDリストを取得
    pub async fn find_task_ids_by_tag_id(
        &self,
        project_id: &ProjectId,
        tag_id: &TagId,
    ) -> Result<Vec<TaskId>, RepositoryError> {
        let document = self.get_or_create_document(project_id).await?;
        let relations: Option<Vec<TaskTagRelation>> = document.load_data("task_tags").await?;

        if let Some(relations) = relations {
            let task_ids = relations
                .into_iter()
                .filter(|r| r.tag_id == tag_id.to_string())
                .map(|r| TaskId::from(r.task_id))
                .collect();
            Ok(task_ids)
        } else {
            Ok(vec![])
        }
    }

    /// タスクとタグの関連付けを追加
    pub async fn add_relation(
        &self,
        project_id: &ProjectId,
        task_id: &TaskId,
        tag_id: &TagId,
    ) -> Result<(), RepositoryError> {
        let document = self.get_or_create_document(project_id).await?;

        // 既存の関連リストを取得
        let mut relations: Vec<TaskTagRelation> =
            document.load_data("task_tags").await?.unwrap_or_default();

        // 既存の関連が存在するかチェック
        let exists = relations
            .iter()
            .any(|r| r.task_id == task_id.to_string() && r.tag_id == tag_id.to_string());

        if !exists {
            // 関連が存在しない場合のみ追加
            relations.push(TaskTagRelation {
                task_id: task_id.to_string(),
                tag_id: tag_id.to_string(),
                created_at: Utc::now(),
                updated_at: Utc::now(),
                deleted: false,
                updated_by: UserId::from("system").to_string(),
            });

            document.save_data("task_tags", &relations).await?;
        }

        Ok(())
    }

    /// タスクとタグの関連付けを削除
    pub async fn remove_relation(
        &self,
        project_id: &ProjectId,
        task_id: &TaskId,
        tag_id: &TagId,
    ) -> Result<(), RepositoryError> {
        let document = self.get_or_create_document(project_id).await?;

        // 既存の関連リストを取得
        let mut relations: Vec<TaskTagRelation> =
            document.load_data("task_tags").await?.unwrap_or_default();

        // 指定された関連を削除
        relations.retain(|r| !(r.task_id == task_id.to_string() && r.tag_id == tag_id.to_string()));

        document.save_data("task_tags", &relations).await?;

        Ok(())
    }

    /// 指定タスクの全ての関連付けを削除
    pub async fn remove_all_relations_by_task_id(
        &self,
        project_id: &ProjectId,
        task_id: &TaskId,
    ) -> Result<(), RepositoryError> {
        let document = self.get_or_create_document(project_id).await?;

        // 既存の関連リストを取得
        let mut relations: Vec<TaskTagRelation> =
            document.load_data("task_tags").await?.unwrap_or_default();

        // 指定されたタスクの全ての関連を削除
        relations.retain(|r| r.task_id != task_id.to_string());

        document.save_data("task_tags", &relations).await?;

        Ok(())
    }

    /// 指定タグの全ての関連付けを削除
    pub async fn remove_all_relations_by_tag_id(
        &self,
        project_id: &ProjectId,
        tag_id: &TagId,
    ) -> Result<(), RepositoryError> {
        let document = self.get_or_create_document(project_id).await?;

        // 既存の関連リストを取得
        let mut relations: Vec<TaskTagRelation> =
            document.load_data("task_tags").await?.unwrap_or_default();

        // 指定されたタグの全ての関連を削除
        relations.retain(|r| r.tag_id != tag_id.to_string());

        document.save_data("task_tags", &relations).await?;

        Ok(())
    }

    /// タスクのタグ関連付けを一括更新（既存をすべて削除して新しい関連を追加）
    pub async fn update_task_tag_relations(
        &self,
        project_id: &ProjectId,
        task_id: &TaskId,
        tag_ids: &[TagId],
    ) -> Result<(), RepositoryError> {
        let document = self.get_or_create_document(project_id).await?;

        // 既存の関連リストを取得
        let mut relations: Vec<TaskTagRelation> =
            document.load_data("task_tags").await?.unwrap_or_default();

        // 既存の関連付けを削除
        relations.retain(|r| r.task_id != task_id.to_string());

        // 新しい関連付けを追加
        for tag_id in tag_ids {
            relations.push(TaskTagRelation {
                task_id: task_id.to_string(),
                tag_id: tag_id.to_string(),
                created_at: Utc::now(),
                updated_at: Utc::now(),
                deleted: false,
                updated_by: UserId::from("system").to_string(),
            });
        }

        document.save_data("task_tags", &relations).await?;

        Ok(())
    }
}

// TaskTagRepositoryTrait の実装
impl TaskTagRepositoryTrait for TaskTagLocalAutomergeRepository {}

#[async_trait]
impl ProjectRelationRepository<TaskTag, TaskId, TagId> for TaskTagLocalAutomergeRepository {
    async fn add(
        &self,
        project_id: &ProjectId,
        parent_id: &TaskId,
        child_id: &TagId,
        _user_id: &UserId,
        _timestamp: &DateTime<Utc>,
    ) -> Result<(), RepositoryError> {
        self.add_relation(project_id, parent_id, child_id).await
    }

    async fn remove(
        &self,
        project_id: &ProjectId,
        parent_id: &TaskId,
        child_id: &TagId,
    ) -> Result<(), RepositoryError> {
        self.remove_relation(project_id, parent_id, child_id).await
    }

    async fn remove_all(
        &self,
        project_id: &ProjectId,
        parent_id: &TaskId,
    ) -> Result<(), RepositoryError> {
        self.remove_all_relations_by_task_id(project_id, parent_id)
            .await
    }

    async fn find_relations(
        &self,
        project_id: &ProjectId,
        parent_id: &TaskId,
    ) -> Result<Vec<TaskTag>, RepositoryError> {
        let tag_ids = self.find_tag_ids_by_task_id(project_id, parent_id).await?;
        let mut relations = Vec::new();

        // 各タグIDに対して TaskTag を作成
        for tag_id in tag_ids {
            let tag_relation = TaskTag {
                task_id: parent_id.clone(),
                tag_id: tag_id.clone(),
                created_at: chrono::Utc::now(),
                updated_at: chrono::Utc::now(),
                updated_by: UserId::from("system"),
                deleted: false,
            };
            relations.push(tag_relation);
        }

        Ok(relations)
    }

    async fn exists(
        &self,
        project_id: &ProjectId,
        parent_id: &TaskId,
    ) -> Result<bool, RepositoryError> {
        let tag_ids = self.find_tag_ids_by_task_id(project_id, parent_id).await?;
        Ok(!tag_ids.is_empty())
    }

    async fn count(
        &self,
        project_id: &ProjectId,
        parent_id: &TaskId,
    ) -> Result<u64, RepositoryError> {
        let tag_ids = self.find_tag_ids_by_task_id(project_id, parent_id).await?;
        Ok(tag_ids.len() as u64)
    }

    async fn find_relation(
        &self,
        project_id: &ProjectId,
        parent_id: &TaskId,
        child_id: &TagId,
    ) -> Result<Option<TaskTag>, RepositoryError> {
        let document = self.get_or_create_document(project_id).await?;
        let relations: Option<Vec<TaskTagRelation>> = document.load_data("task_tags").await?;

        if let Some(relations) = relations {
            if let Some(task_tag_relation) = relations
                .iter()
                .find(|r| r.task_id == parent_id.to_string() && r.tag_id == child_id.to_string())
            {
                let task_tag = TaskTag {
                    task_id: parent_id.clone(),
                    tag_id: child_id.clone(),
                    created_at: task_tag_relation.created_at,
                    updated_at: task_tag_relation.updated_at,
                    deleted: task_tag_relation.deleted,
                    updated_by: UserId::from(task_tag_relation.updated_by.clone()),
                };
                Ok(Some(task_tag))
            } else {
                Ok(None)
            }
        } else {
            Ok(None)
        }
    }

    async fn find_all(&self, project_id: &ProjectId) -> Result<Vec<TaskTag>, RepositoryError> {
        let document = self.get_or_create_document(project_id).await?;
        let relations: Option<Vec<TaskTagRelation>> = document.load_data("task_tags").await?;

        if let Some(task_tag_relations) = relations {
            let task_tags = task_tag_relations
                .into_iter()
                .map(|rel| TaskTag {
                    task_id: TaskId::from(rel.task_id.clone()),
                    tag_id: TagId::from(rel.tag_id.clone()),
                    created_at: rel.created_at,
                    updated_at: rel.updated_at,
                    updated_by: UserId::from(rel.updated_by),
                    deleted: rel.deleted,
                })
                .collect();
            Ok(task_tags)
        } else {
            Ok(vec![])
        }
    }
}
