use crate::infrastructure::document::Document;

use super::super::document_manager::{DocumentManager, DocumentType};
use async_trait::async_trait;
use flequit_model::models::task_projects::date_condition::DateCondition;
use chrono::{DateTime, Utc};
use flequit_model::types::id_types::{DateConditionId, ProjectId, UserId};
use flequit_repository::repositories::project_repository_trait::ProjectRepository;
use flequit_repository::repositories::task_projects::date_condition_repository_trait::DateConditionRepositoryTrait;
use flequit_types::errors::repository_error::RepositoryError;
use std::path::PathBuf;
use std::sync::Arc;

/// Automerge実装の日付条件リポジトリ
///
/// `Repository<DateCondition>`と`DateConditionRepositoryTrait`を実装し、
/// Automerge-Repoを使用した日付条件管理を提供する。
///
/// # アーキテクチャ
///
/// ```text
/// DateConditionLocalAutomergeRepository (このクラス)
///   | 委譲
/// DocumentManager (プロジェクトごとのドキュメント管理)
///   | データアクセス
/// Automerge Documents
/// ```
///
/// # 特徴
///
/// - **分散同期**: CRDTによる競合解決機能
/// - **履歴管理**: すべての変更履歴を保持
/// - **オフライン対応**: ローカル優先で同期可能
/// - **JSON互換**: 構造化データの効率的な管理
/// - **ステートレス**: プロジェクトIDは必要時に引数で受け取る
#[derive(Debug)]
pub struct DateConditionLocalAutomergeRepository {
    document_manager: Arc<tokio::sync::RwLock<DocumentManager>>,
}

impl DateConditionLocalAutomergeRepository {
    pub async fn new(base_path: PathBuf) -> Result<Self, RepositoryError> {
        let document_manager = DocumentManager::new(base_path)?;
        Ok(Self {
            document_manager: Arc::new(tokio::sync::RwLock::new(document_manager)),
        })
    }

    /// 指定されたプロジェクトのDocumentを取得または作成

    async fn get_or_create_document(
        &self,
        project_id: &ProjectId,
    ) -> Result<Document, RepositoryError> {
        let doc_type = DocumentType::Project(project_id.clone());
        let mut manager = self.document_manager.write().await;
        manager
            .get_or_create(&doc_type)
            .await
            .map_err(|e| RepositoryError::AutomergeError(e.to_string()))
    }

    /// 指定されたプロジェクトの全日付条件を取得

    pub async fn list_date_conditions(
        &self,
        project_id: &ProjectId,
    ) -> Result<Vec<DateCondition>, RepositoryError> {
        let document = self.get_or_create_document(project_id).await?;
        let date_conditions = document
            .load_data::<Vec<DateCondition>>("date_conditions")
            .await?;
        if let Some(date_conditions) = date_conditions {
            Ok(date_conditions)
        } else {
            Ok(Vec::new())
        }
    }

    /// IDで日付条件を取得

    pub async fn get_date_condition(
        &self,
        project_id: &ProjectId,
        condition_id: &str,
    ) -> Result<Option<DateCondition>, RepositoryError> {
        let date_conditions = self.list_date_conditions(project_id).await?;
        Ok(date_conditions
            .into_iter()
            .find(|d| d.id == condition_id.into()))
    }

    /// 日付条件を作成または更新

    pub async fn set_date_condition(
        &self,
        project_id: &ProjectId,
        date_condition: &DateCondition,
    ) -> Result<(), RepositoryError> {
        log::info!("set_date_condition - 開始: {:?}", date_condition.id);
        let mut date_conditions = self.list_date_conditions(project_id).await?;
        log::info!(
            "set_date_condition - 現在の日付条件数: {}",
            date_conditions.len()
        );

        // 既存の日付条件を更新、または新規追加
        if let Some(existing) = date_conditions
            .iter_mut()
            .find(|d| d.id == date_condition.id)
        {
            log::info!(
                "set_date_condition - 既存日付条件を更新: {:?}",
                date_condition.id
            );
            *existing = date_condition.clone();
        } else {
            log::info!(
                "set_date_condition - 新規日付条件追加: {:?}",
                date_condition.id
            );
            date_conditions.push(date_condition.clone());
        }

        let document = self.get_or_create_document(project_id).await?;
        log::info!("set_date_condition - Document取得完了");
        let result = document
            .save_data("date_conditions", &date_conditions)
            .await;
        match result {
            Ok(_) => {
                log::info!("set_date_condition - Automergeドキュメント保存完了");
                Ok(())
            }
            Err(e) => {
                log::error!(
                    "set_date_condition - Automergeドキュメント保存エラー: {:?}",
                    e
                );
                Err(RepositoryError::AutomergeError(e.to_string()))
            }
        }
    }

    /// 日付条件を削除

    pub async fn delete_date_condition(
        &self,
        project_id: &ProjectId,
        condition_id: &str,
    ) -> Result<bool, RepositoryError> {
        let mut date_conditions = self.list_date_conditions(project_id).await?;
        let initial_len = date_conditions.len();
        date_conditions.retain(|d| d.id != condition_id.into());

        if date_conditions.len() != initial_len {
            let document = self.get_or_create_document(project_id).await?;
            document
                .save_data("date_conditions", &date_conditions)
                .await?;
            Ok(true)
        } else {
            Ok(false)
        }
    }
}

// DateConditionRepositoryTraitの実装
#[async_trait]
impl DateConditionRepositoryTrait for DateConditionLocalAutomergeRepository {}

#[async_trait]
impl ProjectRepository<DateCondition, DateConditionId> for DateConditionLocalAutomergeRepository {
    async fn save(
        &self,
        project_id: &ProjectId,
        entity: &DateCondition,
        _user_id: &UserId,
        _timestamp: &DateTime<Utc>,
    ) -> Result<(), RepositoryError> {
        log::info!(
            "DateConditionLocalAutomergeRepository::save - 開始: {:?}",
            entity.id
        );
        let result = self.set_date_condition(project_id, entity).await;
        if result.is_ok() {
            log::info!(
                "DateConditionLocalAutomergeRepository::save - 完了: {:?}",
                entity.id
            );
        } else {
            log::error!(
                "DateConditionLocalAutomergeRepository::save - エラー: {:?}",
                result
            );
        }
        result
    }

    async fn find_by_id(
        &self,
        project_id: &ProjectId,
        id: &DateConditionId,
    ) -> Result<Option<DateCondition>, RepositoryError> {
        self.get_date_condition(project_id, &id.to_string()).await
    }

    async fn find_all(
        &self,
        project_id: &ProjectId,
    ) -> Result<Vec<DateCondition>, RepositoryError> {
        self.list_date_conditions(project_id).await
    }

    async fn delete(
        &self,
        project_id: &ProjectId,
        id: &DateConditionId,
    ) -> Result<(), RepositoryError> {
        let deleted = self
            .delete_date_condition(project_id, &id.to_string())
            .await?;
        if deleted {
            Ok(())
        } else {
            Err(RepositoryError::NotFound(format!(
                "DateCondition not found: {}",
                id
            )))
        }
    }

    async fn exists(
        &self,
        project_id: &ProjectId,
        id: &DateConditionId,
    ) -> Result<bool, RepositoryError> {
        let found = self.find_by_id(project_id, id).await?;
        Ok(found.is_some())
    }

    async fn count(&self, project_id: &ProjectId) -> Result<u64, RepositoryError> {
        let date_conditions = self.find_all(project_id).await?;
        Ok(date_conditions.len() as u64)
    }
}
