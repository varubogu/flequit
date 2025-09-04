//! TaskTag用Automergeリポジトリ

use crate::infrastructure::document::Document;
use super::super::document_manager::{DocumentManager, DocumentType};
use flequit_model::types::id_types::{ProjectId, TagId, TaskId};
use chrono::Utc;
use flequit_types::errors::repository_error::RepositoryError;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::RwLock;

#[derive(Debug, Clone, Serialize, Deserialize)]
struct TaskTagRelation {
    task_id: String,
    tag_id: String,
    created_at: chrono::DateTime<Utc>,
}

#[derive(Debug)]
pub struct TaskTagLocalAutomergeRepository {
    document: Document,
}

impl TaskTagLocalAutomergeRepository {
    pub async fn new(doc_manager: Arc<RwLock<DocumentManager>>, project_id: &ProjectId) -> Result<Self, RepositoryError> {
        let doc_type = DocumentType::Project(project_id.clone());
        let doc = {
            let mut manager = doc_manager.write().await;
            manager.get_or_create(&doc_type).await?
        };
        Ok(Self {
            document: doc,
        })
    }

    /// 指定タスクのタグIDリストを取得
    pub async fn find_tag_ids_by_task_id(
        &self,
        task_id: &TaskId,
    ) -> Result<Vec<TagId>, RepositoryError> {
        let relations: Option<Vec<TaskTagRelation>> = self.document
            .load_data("task_tags")
            .await?;

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
        tag_id: &TagId,
    ) -> Result<Vec<TaskId>, RepositoryError> {
        let relations: Option<Vec<TaskTagRelation>> = self.document
            .load_data("task_tags")
            .await?;

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
        task_id: &TaskId,
        tag_id: &TagId,
    ) -> Result<(), RepositoryError> {
        // 既存の関連リストを取得
        let mut relations: Vec<TaskTagRelation> = self.document
            .load_data("task_tags")
            .await?
            .unwrap_or_default();

        // 既存の関連が存在するかチェック
        let exists = relations.iter().any(|r| {
            r.task_id == task_id.to_string() && r.tag_id == tag_id.to_string()
        });

        if !exists {
            // 関連が存在しない場合のみ追加
            relations.push(TaskTagRelation {
                task_id: task_id.to_string(),
                tag_id: tag_id.to_string(),
                created_at: Utc::now(),
            });

            self.document.save_data("task_tags", &relations).await?;
        }

        Ok(())
    }

    /// タスクとタグの関連付けを削除
    pub async fn remove_relation(
        &self,
        task_id: &TaskId,
        tag_id: &TagId,
    ) -> Result<(), RepositoryError> {
        // 既存の関連リストを取得
        let mut relations: Vec<TaskTagRelation> = self.document
            .load_data("task_tags")
            .await?
            .unwrap_or_default();

        // 指定された関連を削除
        relations.retain(|r| {
            !(r.task_id == task_id.to_string() && r.tag_id == tag_id.to_string())
        });

        self.document.save_data("task_tags", &relations).await?;

        Ok(())
    }

    /// 指定タスクの全ての関連付けを削除
    pub async fn remove_all_relations_by_task_id(
        &self,
        task_id: &TaskId,
    ) -> Result<(), RepositoryError> {
        // 既存の関連リストを取得
        let mut relations: Vec<TaskTagRelation> = self.document
            .load_data("task_tags")
            .await?
            .unwrap_or_default();

        // 指定されたタスクの全ての関連を削除
        relations.retain(|r| r.task_id != task_id.to_string());

        self.document.save_data("task_tags", &relations).await?;

        Ok(())
    }

    /// 指定タグの全ての関連付けを削除
    pub async fn remove_all_relations_by_tag_id(
        &self,
        tag_id: &TagId,
    ) -> Result<(), RepositoryError> {
        // 既存の関連リストを取得
        let mut relations: Vec<TaskTagRelation> = self.document
            .load_data("task_tags")
            .await?
            .unwrap_or_default();

        // 指定されたタグの全ての関連を削除
        relations.retain(|r| r.tag_id != tag_id.to_string());

        self.document.save_data("task_tags", &relations).await?;

        Ok(())
    }

    /// タスクのタグ関連付けを一括更新（既存をすべて削除して新しい関連を追加）
    pub async fn update_task_tag_relations(
        &self,
        task_id: &TaskId,
        tag_ids: &[TagId],
    ) -> Result<(), RepositoryError> {
        // 既存の関連リストを取得
        let mut relations: Vec<TaskTagRelation> = self.document
            .load_data("task_tags")
            .await?
            .unwrap_or_default();

        // 既存の関連付けを削除
        relations.retain(|r| r.task_id != task_id.to_string());

        // 新しい関連付けを追加
        for tag_id in tag_ids {
            relations.push(TaskTagRelation {
                task_id: task_id.to_string(),
                tag_id: tag_id.to_string(),
                created_at: Utc::now(),
            });
        }

        self.document.save_data("task_tags", &relations).await?;

        Ok(())
    }
}
