//! SubtaskTag用Automergeリポジトリ

use crate::infrastructure::document::Document;

use super::super::document_manager::{DocumentManager, DocumentType};
use async_trait::async_trait;
use chrono::Utc;
use flequit_model::models::task_projects::subtask_tag::SubTaskTag;
use flequit_model::types::id_types::{ProjectId, SubTaskId, TagId};
use flequit_repository::repositories::project_relation_repository_trait::ProjectRelationRepository;
use flequit_repository::repositories::task_projects::subtask_tag_repository_trait::SubTaskTagRepositoryTrait;
use flequit_types::errors::repository_error::RepositoryError;
use serde::{Deserialize, Serialize};
use std::{path::PathBuf, sync::Arc};
use tokio::sync::Mutex;

#[derive(Debug, Clone, Serialize, Deserialize)]
struct SubtaskTagRelation {
    subtask_id: String,
    tag_id: String,
    created_at: chrono::DateTime<Utc>,
}

#[derive(Debug)]
pub struct SubtaskTagLocalAutomergeRepository {
    document_manager: Arc<Mutex<DocumentManager>>,
}

impl SubtaskTagLocalAutomergeRepository {
    /// 新しいSubtaskTagRepositoryを作成
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
        Ok(Self {
            document_manager,
        })
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

    /// 指定サブタスクのタグIDリストを取得
    pub async fn find_tag_ids_by_subtask_id(
        &self,
        project_id: &ProjectId,
        subtask_id: &SubTaskId,
    ) -> Result<Vec<TagId>, RepositoryError> {
        let document = self.get_or_create_document(project_id).await?;
        let relations: Option<Vec<SubtaskTagRelation>> = document.load_data("subtask_tags").await?;

        if let Some(relations) = relations {
            let tag_ids = relations
                .into_iter()
                .filter(|r| r.subtask_id == subtask_id.to_string())
                .map(|r| TagId::from(r.tag_id))
                .collect();
            Ok(tag_ids)
        } else {
            Ok(vec![])
        }
    }

    /// 指定タグに関連するサブタスクIDリストを取得
    pub async fn find_subtask_ids_by_tag_id(
        &self,
        project_id: &ProjectId,
        tag_id: &TagId,
    ) -> Result<Vec<SubTaskId>, RepositoryError> {
        let document = self.get_or_create_document(project_id).await?;
        let relations: Option<Vec<SubtaskTagRelation>> = document.load_data("subtask_tags").await?;

        if let Some(relations) = relations {
            let subtask_ids = relations
                .into_iter()
                .filter(|r| r.tag_id == tag_id.to_string())
                .map(|r| SubTaskId::from(r.subtask_id))
                .collect();
            Ok(subtask_ids)
        } else {
            Ok(vec![])
        }
    }

    /// サブタスクとタグの関連付けを追加
    pub async fn add_relation(
        &self,
        project_id: &ProjectId,
        subtask_id: &SubTaskId,
        tag_id: &TagId,
    ) -> Result<(), RepositoryError> {
        let document = self.get_or_create_document(project_id).await?;

        // 既存の関連リストを取得
        let mut relations: Vec<SubtaskTagRelation> = document
            .load_data("subtask_tags")
            .await?
            .unwrap_or_default();

        // 既存の関連が存在するかチェック
        let exists = relations
            .iter()
            .any(|r| r.subtask_id == subtask_id.to_string() && r.tag_id == tag_id.to_string());

        if !exists {
            // 関連が存在しない場合のみ追加
            relations.push(SubtaskTagRelation {
                subtask_id: subtask_id.to_string(),
                tag_id: tag_id.to_string(),
                created_at: Utc::now(),
            });

            document.save_data("subtask_tags", &relations).await?;
        }

        Ok(())
    }

    /// サブタスクとタグの関連付けを削除
    pub async fn remove_relation(
        &self,
        project_id: &ProjectId,
        subtask_id: &SubTaskId,
        tag_id: &TagId,
    ) -> Result<(), RepositoryError> {
        let document = self.get_or_create_document(project_id).await?;
        // 既存の関連リストを取得
        let mut relations: Vec<SubtaskTagRelation> = document
            .load_data("subtask_tags")
            .await?
            .unwrap_or_default();

        // 指定された関連を削除
        relations.retain(|r| {
            !(r.subtask_id == subtask_id.to_string() && r.tag_id == tag_id.to_string())
        });

        document.save_data("subtask_tags", &relations).await?;

        Ok(())
    }

    /// 指定サブタスクの全ての関連付けを削除
    pub async fn remove_all_relations_by_subtask_id(
        &self,
        project_id: &ProjectId,
        subtask_id: &SubTaskId,
    ) -> Result<(), RepositoryError> {
        let document = self.get_or_create_document(project_id).await?;
        // 既存の関連リストを取得
        let mut relations: Vec<SubtaskTagRelation> = document
            .load_data("subtask_tags")
            .await?
            .unwrap_or_default();

        // 指定されたサブタスクの全ての関連を削除
        relations.retain(|r| r.subtask_id != subtask_id.to_string());

        document.save_data("subtask_tags", &relations).await?;

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
        let mut relations: Vec<SubtaskTagRelation> = document
            .load_data("subtask_tags")
            .await?
            .unwrap_or_default();

        // 指定されたタグの全ての関連を削除
        relations.retain(|r| r.tag_id != tag_id.to_string());

        document.save_data("subtask_tags", &relations).await?;

        Ok(())
    }

    /// サブタスクのタグ関連付けを一括更新（既存をすべて削除して新しい関連を追加）
    pub async fn update_subtask_tag_relations(
        &self,
        project_id: &ProjectId,
        subtask_id: &SubTaskId,
        tag_ids: &[TagId],
    ) -> Result<(), RepositoryError> {
        let document = self.get_or_create_document(project_id).await?;

        // 既存の関連リストを取得
        let mut relations: Vec<SubtaskTagRelation> = document
            .load_data("subtask_tags")
            .await?
            .unwrap_or_default();

        // 既存の関連付けを削除
        relations.retain(|r| r.subtask_id != subtask_id.to_string());

        // 新しい関連付けを追加
        for tag_id in tag_ids {
            relations.push(SubtaskTagRelation {
                subtask_id: subtask_id.to_string(),
                tag_id: tag_id.to_string(),
                created_at: Utc::now(),
            });
        }

        document.save_data("subtask_tags", &relations).await?;

        Ok(())
    }
}

// SubTaskTagRepositoryTrait の実装
impl SubTaskTagRepositoryTrait for SubtaskTagLocalAutomergeRepository {}

#[async_trait]
impl ProjectRelationRepository<SubTaskTag, SubTaskId, TagId>
    for SubtaskTagLocalAutomergeRepository
{
    async fn add(
        &self,
        project_id: &ProjectId,
        parent_id: &SubTaskId,
        child_id: &TagId,
    ) -> Result<(), RepositoryError> {
        self.add_relation(project_id, parent_id, child_id).await
    }

    async fn remove(
        &self,
        project_id: &ProjectId,
        parent_id: &SubTaskId,
        child_id: &TagId,
    ) -> Result<(), RepositoryError> {
        self.remove_relation(project_id, parent_id, child_id).await
    }

    async fn remove_all(
        &self,
        project_id: &ProjectId,
        parent_id: &SubTaskId,
    ) -> Result<(), RepositoryError> {
        self.remove_all_relations_by_subtask_id(project_id, parent_id)
            .await
    }

    async fn find_relations(
        &self,
        project_id: &ProjectId,
        parent_id: &SubTaskId,
    ) -> Result<Vec<SubTaskTag>, RepositoryError> {
        let tag_ids = self
            .find_tag_ids_by_subtask_id(project_id, parent_id)
            .await?;
        let mut relations = Vec::new();

        // 各タグIDに対して SubTaskTag を作成
        for tag_id in tag_ids {
            let tag_relation = SubTaskTag {
                subtask_id: parent_id.clone(),
                tag_id,
                created_at: chrono::Utc::now(), // 実際の作成日時の取得は追加実装が必要
            };
            relations.push(tag_relation);
        }

        Ok(relations)
    }

    async fn exists(
        &self,
        project_id: &ProjectId,
        parent_id: &SubTaskId,
    ) -> Result<bool, RepositoryError> {
        let tag_ids = self
            .find_tag_ids_by_subtask_id(project_id, parent_id)
            .await?;
        Ok(!tag_ids.is_empty())
    }

    async fn count(
        &self,
        project_id: &ProjectId,
        parent_id: &SubTaskId,
    ) -> Result<u64, RepositoryError> {
        let tag_ids = self
            .find_tag_ids_by_subtask_id(project_id, parent_id)
            .await?;
        Ok(tag_ids.len() as u64)
    }

    async fn find_relation(
        &self,
        project_id: &ProjectId,
        parent_id: &SubTaskId,
        child_id: &TagId,
    ) -> Result<Option<SubTaskTag>, RepositoryError> {
        let document = self.get_or_create_document(project_id).await?;
        let relations: Option<Vec<SubtaskTagRelation>> = document.load_data("subtask_tags").await?;

        if let Some(relations) = relations {
            if let Some(subtask_tag_relation) = relations
                .iter()
                .find(|r| r.subtask_id == parent_id.to_string() && r.tag_id == child_id.to_string())
            {
                let subtask_tag = SubTaskTag {
                    subtask_id: parent_id.clone(),
                    tag_id: child_id.clone(),
                    created_at: subtask_tag_relation.created_at,
                };
                Ok(Some(subtask_tag))
            } else {
                Ok(None)
            }
        } else {
            Ok(None)
        }
    }

    async fn find_all(&self, project_id: &ProjectId) -> Result<Vec<SubTaskTag>, RepositoryError> {
        let document = self.get_or_create_document(project_id).await?;
        let relations: Option<Vec<SubtaskTagRelation>> = document.load_data("subtask_tags").await?;

        if let Some(subtask_tag_relations) = relations {
            let subtask_tags = subtask_tag_relations
                .into_iter()
                .map(|rel| SubTaskTag {
                    subtask_id: SubTaskId::from(rel.subtask_id),
                    tag_id: TagId::from(rel.tag_id),
                    created_at: rel.created_at,
                })
                .collect();
            Ok(subtask_tags)
        } else {
            Ok(vec![])
        }
    }
}
