//! SubtaskTag用Automergeリポジトリ

use crate::infrastructure::document::Document;

use super::super::document_manager::{DocumentManager, DocumentType};
use flequit_model::types::id_types::{SubTaskId, TagId, ProjectId};
use chrono::Utc;
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
    document: Document
}

impl SubtaskTagLocalAutomergeRepository {
    /// 新しいSubTaskRepositoryを作成
    #[tracing::instrument(level = "trace")]
    pub async fn new(base_path: PathBuf, project_id: ProjectId) -> Result<Self, RepositoryError> {
        let doc_type = &DocumentType::Project(project_id);
        let mut document_manager = DocumentManager::new(base_path)?;
        let doc = document_manager.get_or_create(doc_type).await?;
        Ok(Self {
            document: doc,
        })
    }

    /// 共有DocumentManagerを使用して新しいインスタンスを作成
    #[tracing::instrument(level = "trace")]
    pub async fn new_with_manager(
        document_manager: Arc<Mutex<DocumentManager>>,
        project_id: ProjectId
    ) -> Result<Self, RepositoryError> {
        let doc_type = &DocumentType::Project(project_id);
        let doc = {
            let mut manager = document_manager.lock().await;
            manager.get_or_create(doc_type).await?
        };
        Ok(Self {
            document: doc,
        })
    }

    /// 指定サブタスクのタグIDリストを取得
    pub async fn find_tag_ids_by_subtask_id(
        &self,
        subtask_id: &SubTaskId,
    ) -> Result<Vec<TagId>, RepositoryError> {
        let doc = &self.document;
        let relations: Option<Vec<SubtaskTagRelation>> = doc
            .load_data("subtask_tags")
            .await?;

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
        tag_id: &TagId,
    ) -> Result<Vec<SubTaskId>, RepositoryError> {
        let doc = &self.document;
        let relations: Option<Vec<SubtaskTagRelation>> = doc
            .load_data("subtask_tags")
            .await?;

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
        subtask_id: &SubTaskId,
        tag_id: &TagId,
    ) -> Result<(), RepositoryError> {
        let doc = &self.document;

        // 既存の関連リストを取得
        let mut relations: Vec<SubtaskTagRelation> = doc
            .load_data("subtask_tags")
            .await?
            .unwrap_or_default();

        // 既存の関連が存在するかチェック
        let exists = relations.iter().any(|r| {
            r.subtask_id == subtask_id.to_string() && r.tag_id == tag_id.to_string()
        });

        if !exists {
            // 関連が存在しない場合のみ追加
            relations.push(SubtaskTagRelation {
                subtask_id: subtask_id.to_string(),
                tag_id: tag_id.to_string(),
                created_at: Utc::now(),
            });

            doc.save_data("subtask_tags", &relations).await?;
        }

        Ok(())
    }

    /// サブタスクとタグの関連付けを削除
    pub async fn remove_relation(
        &self,
        subtask_id: &SubTaskId,
        tag_id: &TagId,
    ) -> Result<(), RepositoryError> {

        let doc = &self.document;
        // 既存の関連リストを取得
        let mut relations: Vec<SubtaskTagRelation> = doc
            .load_data("subtask_tags")
            .await?
            .unwrap_or_default();

        // 指定された関連を削除
        relations.retain(|r| {
            !(r.subtask_id == subtask_id.to_string() && r.tag_id == tag_id.to_string())
        });

        doc.save_data("subtask_tags", &relations).await?;

        Ok(())
    }

    /// 指定サブタスクの全ての関連付けを削除
    pub async fn remove_all_relations_by_subtask_id(
        &self,
        subtask_id: &SubTaskId,
    ) -> Result<(), RepositoryError> {
        let doc = &self.document;
        // 既存の関連リストを取得
        let mut relations: Vec<SubtaskTagRelation> = doc
            .load_data("subtask_tags")
            .await?
            .unwrap_or_default();

        // 指定されたサブタスクの全ての関連を削除
        relations.retain(|r| r.subtask_id != subtask_id.to_string());

        doc.save_data("subtask_tags", &relations).await?;

        Ok(())
    }

    /// 指定タグの全ての関連付けを削除
    pub async fn remove_all_relations_by_tag_id(
        &self,
        tag_id: &TagId,
    ) -> Result<(), RepositoryError> {
        let doc = &self.document;

        // 既存の関連リストを取得
        let mut relations: Vec<SubtaskTagRelation> = doc
            .load_data("subtask_tags")
            .await?
            .unwrap_or_default();

        // 指定されたタグの全ての関連を削除
        relations.retain(|r| r.tag_id != tag_id.to_string());

        doc.save_data("subtask_tags", &relations).await?;

        Ok(())
    }

    /// サブタスクのタグ関連付けを一括更新（既存をすべて削除して新しい関連を追加）
    pub async fn update_subtask_tag_relations(
        &self,
        subtask_id: &SubTaskId,
        tag_ids: &[TagId],
    ) -> Result<(), RepositoryError> {
        let doc = &self.document;

        // 既存の関連リストを取得
        let mut relations: Vec<SubtaskTagRelation> = doc
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

        doc.save_data("subtask_tags", &relations).await?;

        Ok(())
    }
}
