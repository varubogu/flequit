//! WeekdayCondition用Automergeリポジトリ

use super::super::document_manager::{DocumentManager, DocumentType};
use super::super::document::Document;
use flequit_model::models::task_projects::weekday_condition::WeekdayCondition;
use flequit_repository::repositories::base_repository_trait::Repository;
use flequit_repository::repositories::task_projects::weekday_condition_repository_trait::WeekdayConditionRepositoryTrait;
use flequit_model::types::id_types::{WeekdayConditionId, ProjectId};
use async_trait::async_trait;
use flequit_types::errors::repository_error::RepositoryError;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::Mutex;
use log::info;

/// WeekdayCondition Document構造（Automerge専用）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WeekdayConditionDocument {
    /// プロジェクト内の曜日条件一覧
    pub weekday_conditions: Vec<WeekdayCondition>,
}

impl Default for WeekdayConditionDocument {
    fn default() -> Self {
        Self {
            weekday_conditions: Vec::new(),
        }
    }
}

#[derive(Debug)]
pub struct WeekdayConditionLocalAutomergeRepository {
    document: Document,
}

impl WeekdayConditionLocalAutomergeRepository {
    /// 新しいTaskRepositoryを作成
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


    /// 曜日条件ドキュメントを取得または作成
    async fn get_or_create_document(&self) -> Result<WeekdayConditionDocument, RepositoryError> {
        let doc = &self.document;

        match doc.load_data::<WeekdayConditionDocument>("weekday_conditions").await? {
            Some(document) => Ok(document),
            None => {
                // ドキュメントが存在しない場合は新規作成
                let new_document = WeekdayConditionDocument::default();
                doc.save_data("weekday_conditions", &new_document).await?;
                Ok(new_document)
            }
        }
    }

    /// 曜日条件ドキュメントを保存
    async fn save_document(&self, document: &WeekdayConditionDocument) -> Result<(), RepositoryError> {
        let doc = &self.document;
        doc.save_data("weekday_conditions", document).await?;
        Ok(())
    }
}

#[async_trait]
impl Repository<WeekdayCondition, WeekdayConditionId> for WeekdayConditionLocalAutomergeRepository {
    async fn save(&self, entity: &WeekdayCondition) -> Result<(), RepositoryError> {
        info!("WeekdayConditionLocalAutomergeRepository::save - 曜日条件を保存");

        let mut document = self.get_or_create_document().await?;

        // 既存の曜日条件を更新するか、新規追加
        if let Some(pos) = document
            .weekday_conditions
            .iter()
            .position(|c| c.id == entity.id)
        {
            document.weekday_conditions[pos] = entity.clone();
        } else {
            document.weekday_conditions.push(entity.clone());
        }

        self.save_document(&document).await?;
        Ok(())
    }

    async fn find_by_id(&self, id: &WeekdayConditionId) -> Result<Option<WeekdayCondition>, RepositoryError> {
        info!("WeekdayConditionLocalAutomergeRepository::find_by_id - 曜日条件を検索");

        let document = self.get_or_create_document().await?;

        let weekday_condition = document
            .weekday_conditions
            .into_iter()
            .find(|c| c.id.as_str() == id.as_str());

        Ok(weekday_condition)
    }

    async fn find_all(&self) -> Result<Vec<WeekdayCondition>, RepositoryError> {
        info!("WeekdayConditionLocalAutomergeRepository::find_all - 全曜日条件を取得");

        let document = self.get_or_create_document().await?;
        Ok(document.weekday_conditions)
    }

    async fn delete(&self, id: &WeekdayConditionId) -> Result<(), RepositoryError> {
        info!("WeekdayConditionLocalAutomergeRepository::delete - 曜日条件を削除");

        let mut document = self.get_or_create_document().await?;

        document.weekday_conditions.retain(|c| c.id.as_str() != id.as_str());
        self.save_document(&document).await?;
        Ok(())
    }

    async fn exists(&self, id: &WeekdayConditionId) -> Result<bool, RepositoryError> {
        let result = self.find_by_id(id).await?;
        Ok(result.is_some())
    }

    async fn count(&self) -> Result<u64, RepositoryError> {
        let weekday_conditions = self.find_all().await?;
        Ok(weekday_conditions.len() as u64)
    }
}

#[async_trait]
impl WeekdayConditionRepositoryTrait for WeekdayConditionLocalAutomergeRepository {
    async fn get_weekday_condition(&self, id: &str) -> Result<Option<WeekdayCondition>, RepositoryError> {
        let weekday_condition_id = WeekdayConditionId::from(id);
        self.find_by_id(&weekday_condition_id).await
    }

    async fn get_all_weekday_conditions(&self) -> Result<Vec<WeekdayCondition>, RepositoryError> {
        self.find_all().await
    }

    async fn add_weekday_condition(&self, condition: &WeekdayCondition) -> Result<(), RepositoryError> {
        self.save(condition).await
    }

    async fn update_weekday_condition(&self, condition: &WeekdayCondition) -> Result<(), RepositoryError> {
        self.save(condition).await
    }

    async fn delete_weekday_condition(&self, id: &str) -> Result<(), RepositoryError> {
        let weekday_condition_id = WeekdayConditionId::from(id);
        self.delete(&weekday_condition_id).await
    }
}
