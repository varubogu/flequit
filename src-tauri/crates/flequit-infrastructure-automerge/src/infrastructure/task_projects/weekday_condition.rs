use crate::infrastructure::document::Document;

use super::super::document_manager::{DocumentManager, DocumentType};
use flequit_model::models::task_projects::weekday_condition::WeekdayCondition;
use flequit_repository::repositories::project_repository_trait::ProjectRepository;
use flequit_repository::repositories::task_projects::weekday_condition_repository_trait::WeekdayConditionRepositoryTrait;
use flequit_model::types::id_types::{WeekdayConditionId, ProjectId};
use async_trait::async_trait;
use flequit_types::errors::repository_error::RepositoryError;
use std::path::PathBuf;
use std::sync::Arc;

/// Automerge実装の曜日条件リポジトリ
///
/// `Repository<WeekdayCondition>`と`WeekdayConditionRepositoryTrait`を実装し、
/// Automerge-Repoを使用した曜日条件管理を提供する。
///
/// # アーキテクチャ
///
/// ```text
/// WeekdayConditionLocalAutomergeRepository (このクラス)
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
pub struct WeekdayConditionLocalAutomergeRepository {
    document_manager: Arc<tokio::sync::RwLock<DocumentManager>>,
}

impl WeekdayConditionLocalAutomergeRepository {
    #[tracing::instrument(level = "trace")]
    pub async fn new(base_path: PathBuf) -> Result<Self, RepositoryError> {
        let document_manager = DocumentManager::new(base_path)?;
        Ok(Self {
            document_manager: Arc::new(tokio::sync::RwLock::new(document_manager)),
        })
    }

    /// 指定されたプロジェクトのDocumentを取得または作成
    #[tracing::instrument(level = "trace")]
    async fn get_or_create_document(&self, project_id: &ProjectId) -> Result<Document, RepositoryError> {
        let doc_type = DocumentType::Project(project_id.clone());
        let mut manager = self.document_manager.write().await;
        manager.get_or_create(&doc_type).await.map_err(|e| RepositoryError::AutomergeError(e.to_string()))
    }

    /// 指定されたプロジェクトの全曜日条件を取得
    #[tracing::instrument(level = "trace")]
    pub async fn list_weekday_conditions(&self, project_id: &ProjectId) -> Result<Vec<WeekdayCondition>, RepositoryError> {
        let document = self.get_or_create_document(project_id).await?;
        let weekday_conditions = document.load_data::<Vec<WeekdayCondition>>("weekday_conditions").await?;
        if let Some(weekday_conditions) = weekday_conditions {
            Ok(weekday_conditions)
        } else {
            Ok(Vec::new())
        }
    }

    /// IDで曜日条件を取得
    #[tracing::instrument(level = "trace")]
    pub async fn get_weekday_condition(&self, project_id: &ProjectId, condition_id: &str) -> Result<Option<WeekdayCondition>, RepositoryError> {
        let weekday_conditions = self.list_weekday_conditions(project_id).await?;
        Ok(weekday_conditions.into_iter().find(|w| w.id == condition_id.into()))
    }

    /// 曜日条件を作成または更新
    #[tracing::instrument(level = "trace")]
    pub async fn set_weekday_condition(&self, project_id: &ProjectId, weekday_condition: &WeekdayCondition) -> Result<(), RepositoryError> {
        log::info!("set_weekday_condition - 開始: {:?}", weekday_condition.id);
        let mut weekday_conditions = self.list_weekday_conditions(project_id).await?;
        log::info!("set_weekday_condition - 現在の曜日条件数: {}", weekday_conditions.len());

        // 既存の曜日条件を更新、または新規追加
        if let Some(existing) = weekday_conditions.iter_mut().find(|w| w.id == weekday_condition.id) {
            log::info!("set_weekday_condition - 既存曜日条件を更新: {:?}", weekday_condition.id);
            *existing = weekday_condition.clone();
        } else {
            log::info!("set_weekday_condition - 新規曜日条件追加: {:?}", weekday_condition.id);
            weekday_conditions.push(weekday_condition.clone());
        }

        let document = self.get_or_create_document(project_id).await?;
        log::info!("set_weekday_condition - Document取得完了");
        let result = document.save_data("weekday_conditions", &weekday_conditions).await;
        match result {
            Ok(_) => {
                log::info!("set_weekday_condition - Automergeドキュメント保存完了");
                Ok(())
            },
            Err(e) => {
                log::error!("set_weekday_condition - Automergeドキュメント保存エラー: {:?}", e);
                Err(RepositoryError::AutomergeError(e.to_string()))
            }
        }
    }

    /// 曜日条件を削除
    #[tracing::instrument(level = "trace")]
    pub async fn delete_weekday_condition(&self, project_id: &ProjectId, condition_id: &str) -> Result<bool, RepositoryError> {
        let mut weekday_conditions = self.list_weekday_conditions(project_id).await?;
        let initial_len = weekday_conditions.len();
        weekday_conditions.retain(|w| w.id != condition_id.into());

        if weekday_conditions.len() != initial_len {
            let document = self.get_or_create_document(project_id).await?;
            document.save_data("weekday_conditions", &weekday_conditions).await?;
            Ok(true)
        } else {
            Ok(false)
        }
    }
}

// WeekdayConditionRepositoryTraitの実装
#[async_trait]
impl WeekdayConditionRepositoryTrait for WeekdayConditionLocalAutomergeRepository {}

#[async_trait]
impl ProjectRepository<WeekdayCondition, WeekdayConditionId> for WeekdayConditionLocalAutomergeRepository {
    #[tracing::instrument(level = "trace")]
    async fn save(&self, project_id: &ProjectId, entity: &WeekdayCondition) -> Result<(), RepositoryError> {
        log::info!("WeekdayConditionLocalAutomergeRepository::save - 開始: {:?}", entity.id);
        let result = self.set_weekday_condition(project_id, entity).await;
        if result.is_ok() {
            log::info!("WeekdayConditionLocalAutomergeRepository::save - 完了: {:?}", entity.id);
        } else {
            log::error!("WeekdayConditionLocalAutomergeRepository::save - エラー: {:?}", result);
        }
        result
    }

    #[tracing::instrument(level = "trace")]
    async fn find_by_id(&self, project_id: &ProjectId, id: &WeekdayConditionId) -> Result<Option<WeekdayCondition>, RepositoryError> {
        self.get_weekday_condition(project_id, &id.to_string()).await
    }

    #[tracing::instrument(level = "trace")]
    async fn find_all(&self, project_id: &ProjectId) -> Result<Vec<WeekdayCondition>, RepositoryError> {
        self.list_weekday_conditions(project_id).await
    }

    #[tracing::instrument(level = "trace")]
    async fn delete(&self, project_id: &ProjectId, id: &WeekdayConditionId) -> Result<(), RepositoryError> {
        let deleted = self.delete_weekday_condition(project_id, &id.to_string()).await?;
        if deleted {
            Ok(())
        } else {
            Err(RepositoryError::NotFound(format!("WeekdayCondition not found: {}", id)))
        }
    }

    #[tracing::instrument(level = "trace")]
    async fn exists(&self, project_id: &ProjectId, id: &WeekdayConditionId) -> Result<bool, RepositoryError> {
        let found = self.find_by_id(project_id, id).await?;
        Ok(found.is_some())
    }

    #[tracing::instrument(level = "trace")]
    async fn count(&self, project_id: &ProjectId) -> Result<u64, RepositoryError> {
        let weekday_conditions = self.find_all(project_id).await?;
        Ok(weekday_conditions.len() as u64)
    }
}