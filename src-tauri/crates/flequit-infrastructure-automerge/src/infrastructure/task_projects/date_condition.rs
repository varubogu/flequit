//! DateCondition用Automergeリポジトリ

use super::super::document_manager::{DocumentManager, DocumentType};
use flequit_model::models::task_projects::date_condition::DateCondition;
use flequit_repository::repositories::base_repository_trait::Repository;
use flequit_repository::repositories::task_projects::date_condition_repository_trait::DateConditionRepositoryTrait;
use flequit_model::types::id_types::{DateConditionId, ProjectId};
use async_trait::async_trait;
use flequit_types::errors::repository_error::RepositoryError;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::Mutex;
use log::info;

/// DateCondition Document構造（Automerge専用）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DateConditionDocument {
    /// プロジェクト内の日付条件一覧
    pub date_conditions: Vec<DateCondition>,
}

impl Default for DateConditionDocument {
    fn default() -> Self {
        Self {
            date_conditions: Vec::new(),
        }
    }
}

#[derive(Debug)]
pub struct DateConditionLocalAutomergeRepository {
    document_manager: Arc<Mutex<DocumentManager>>,
}

impl DateConditionLocalAutomergeRepository {
    pub fn new(document_manager: Arc<Mutex<DocumentManager>>) -> Self {
        Self { document_manager }
    }

    /// プロジェクトIDから日付条件ドキュメントを取得または作成
    async fn get_or_create_document(
        &self,
        project_id: &ProjectId,
    ) -> Result<DateConditionDocument, RepositoryError> {
        let mut manager = self.document_manager.lock().await;

        let doc_type = DocumentType::Project(project_id.clone());

        match manager.load_document::<DateConditionDocument>(&doc_type).await {
            Ok(Some(document)) => Ok(document),
            Ok(None) | Err(_) => {
                // ドキュメントが存在しない場合は新規作成
                let new_document = DateConditionDocument::default();
                manager.save_document(&doc_type, &new_document).await?;
                Ok(new_document)
            }
        }
    }

    /// 日付条件ドキュメントを保存
    async fn save_document(
        &self,
        project_id: &ProjectId,
        document: &DateConditionDocument,
    ) -> Result<(), RepositoryError> {
        let mut manager = self.document_manager.lock().await;

        let doc_type = DocumentType::Project(project_id.clone());

        manager.save_document(&doc_type, document).await?;
        Ok(())
    }

    /// 日付条件から推測されるプロジェクトIDを取得（実装では仮のプロジェクトIDを使用）
    fn get_project_id_for_date_condition(&self, _date_condition: &DateCondition) -> ProjectId {
        // NOTE: 実際の実装では、DateConditionからProjectIdを特定するロジックが必要
        // 現在はデフォルトプロジェクトとして処理
        ProjectId::from("default_project")
    }

    /// IDから推測されるプロジェクトIDを取得
    fn get_project_id_from_condition_id(&self, _condition_id: &str) -> ProjectId {
        // NOTE: 実際の実装では、DateConditionIDからProjectIdを特定するロジックが必要
        // 現在はデフォルトプロジェクトとして処理
        ProjectId::from("default_project")
    }
}

#[async_trait]
impl Repository<DateCondition, DateConditionId> for DateConditionLocalAutomergeRepository {
    async fn save(&self, entity: &DateCondition) -> Result<(), RepositoryError> {
        info!("DateConditionLocalAutomergeRepository::save - 日付条件を保存");

        let project_id = self.get_project_id_for_date_condition(entity);
        let mut document = self.get_or_create_document(&project_id).await?;

        // 既存の日付条件を更新するか、新規追加
        if let Some(pos) = document
            .date_conditions
            .iter()
            .position(|c| c.id == entity.id)
        {
            document.date_conditions[pos] = entity.clone();
        } else {
            document.date_conditions.push(entity.clone());
        }

        self.save_document(&project_id, &document).await?;
        Ok(())
    }

    async fn find_by_id(&self, id: &DateConditionId) -> Result<Option<DateCondition>, RepositoryError> {
        info!("DateConditionLocalAutomergeRepository::find_by_id - 日付条件を検索");

        let project_id = self.get_project_id_from_condition_id(&id.to_string());
        let document = self.get_or_create_document(&project_id).await?;

        let date_condition = document
            .date_conditions
            .into_iter()
            .find(|c| c.id.as_str() == id.as_str());

        Ok(date_condition)
    }

    async fn find_all(&self) -> Result<Vec<DateCondition>, RepositoryError> {
        info!("DateConditionLocalAutomergeRepository::find_all - 全日付条件を取得");

        // NOTE: 実際の実装では、すべてのプロジェクトから日付条件を集める必要があります
        // 現在はデフォルトプロジェクトのみから取得
        let project_id = ProjectId::from("default_project");
        let document = self.get_or_create_document(&project_id).await?;

        Ok(document.date_conditions)
    }

    async fn delete(&self, id: &DateConditionId) -> Result<(), RepositoryError> {
        info!("DateConditionLocalAutomergeRepository::delete - 日付条件を削除");

        let project_id = self.get_project_id_from_condition_id(&id.to_string());
        let mut document = self.get_or_create_document(&project_id).await?;

        document.date_conditions.retain(|c| c.id.as_str() != id.as_str());
        self.save_document(&project_id, &document).await?;
        Ok(())
    }

    async fn exists(&self, id: &DateConditionId) -> Result<bool, RepositoryError> {
        let result = self.find_by_id(id).await?;
        Ok(result.is_some())
    }

    async fn count(&self) -> Result<u64, RepositoryError> {
        let date_conditions = self.find_all().await?;
        Ok(date_conditions.len() as u64)
    }
}

#[async_trait]
impl DateConditionRepositoryTrait for DateConditionLocalAutomergeRepository {
    async fn get_date_condition(&self, id: &str) -> Result<Option<DateCondition>, RepositoryError> {
        let date_condition_id = DateConditionId::from(id);
        self.find_by_id(&date_condition_id).await
    }

    async fn get_all_date_conditions(&self) -> Result<Vec<DateCondition>, RepositoryError> {
        self.find_all().await
    }

    async fn add_date_condition(&self, condition: &DateCondition) -> Result<(), RepositoryError> {
        self.save(condition).await
    }

    async fn update_date_condition(&self, condition: &DateCondition) -> Result<(), RepositoryError> {
        self.save(condition).await
    }

    async fn delete_date_condition(&self, id: &str) -> Result<(), RepositoryError> {
        let date_condition_id = DateConditionId::from(id);
        self.delete(&date_condition_id).await
    }
}
