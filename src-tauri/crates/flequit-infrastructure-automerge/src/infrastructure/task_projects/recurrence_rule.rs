//! RecurrenceRule用Automergeリポジトリ

use crate::infrastructure::document::Document;

use super::super::document_manager::{DocumentManager, DocumentType};
use async_trait::async_trait;
use chrono::{DateTime, Utc};
use flequit_model::models::task_projects::recurrence_rule::RecurrenceRule;
use flequit_model::types::id_types::{ProjectId, RecurrenceRuleId, UserId};
use flequit_repository::repositories::project_repository_trait::ProjectRepository;
use flequit_repository::repositories::task_projects::recurrence_rule_repository_trait::RecurrenceRuleRepositoryTrait;
use flequit_types::errors::repository_error::RepositoryError;
use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::Mutex;

/// Automerge実装のRecurrenceRuleリポジトリ
///
/// `RecurrenceRuleRepositoryTrait`を実装し、
/// Automerge-Repoを使用したRecurrenceRule管理を提供する。
///
/// # アーキテクチャ
///
/// ```text
/// RecurrenceRuleLocalAutomergeRepository (このクラス)
///   | 委譲
/// DocumentManager (RecurrenceRuleドキュメント管理)
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
/// - **ID管理**: RecurrenceRuleはプロジェクトに依存しないグローバルなリソース
#[derive(Debug)]
pub struct RecurrenceRuleLocalAutomergeRepository {
    document_manager: Arc<Mutex<DocumentManager>>,
}

impl RecurrenceRuleLocalAutomergeRepository {
    /// 新しいインスタンスを作成
    pub async fn new(base_path: PathBuf) -> Result<Self, RepositoryError> {
        let document_manager = DocumentManager::new(base_path)
            .map_err(|e| RepositoryError::AutomergeError(e.to_string()))?;
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
        let doc_type = DocumentType::Project(*project_id);
        let mut manager = self.document_manager.lock().await;
        manager
            .get_or_create(&doc_type)
            .await
            .map_err(|e| RepositoryError::AutomergeError(e.to_string()))
    }

    /// プロジェクト内の全RecurrenceRuleを取得
    pub async fn list_recurrence_rules(
        &self,
        project_id: &ProjectId,
    ) -> Result<Vec<RecurrenceRule>, RepositoryError> {
        let document = self.get_or_create_document(project_id).await?;
        let rules = document
            .load_data::<Vec<RecurrenceRule>>("recurrence_rules")
            .await
            .map_err(|e| RepositoryError::AutomergeError(e.to_string()))?;
        if let Some(rules) = rules {
            Ok(rules)
        } else {
            Ok(Vec::new())
        }
    }

    /// IDでRecurrenceRuleを取得
    pub async fn get_rule(
        &self,
        project_id: &ProjectId,
        id: &RecurrenceRuleId,
    ) -> Result<Option<RecurrenceRule>, RepositoryError> {
        let rules = self.list_recurrence_rules(project_id).await?;
        Ok(rules.into_iter().find(|r| r.id == *id))
    }

    /// RecurrenceRuleを作成または更新
    pub async fn set_recurrence_rule(
        &self,
        project_id: &ProjectId,
        rule: &RecurrenceRule,
    ) -> Result<(), RepositoryError> {
        let mut rules = self.list_recurrence_rules(project_id).await?;

        // 既存のルールを更新、または新規追加
        if let Some(existing) = rules.iter_mut().find(|r| r.id == rule.id) {
            *existing = rule.clone();
        } else {
            rules.push(rule.clone());
        }

        let document = self.get_or_create_document(project_id).await?;
        document
            .save_data("recurrence_rules", &rules)
            .await
            .map_err(|e| RepositoryError::AutomergeError(e.to_string()))
    }

    /// RecurrenceRuleを削除
    pub async fn delete_rule(
        &self,
        project_id: &ProjectId,
        id: &RecurrenceRuleId,
    ) -> Result<bool, RepositoryError> {
        let mut rules = self.list_recurrence_rules(project_id).await?;
        let initial_len = rules.len();
        rules.retain(|r| r.id != *id);

        if rules.len() != initial_len {
            let document = self.get_or_create_document(project_id).await?;
            document
                .save_data("recurrence_rules", &rules)
                .await
                .map_err(|e| RepositoryError::AutomergeError(e.to_string()))?;
            Ok(true)
        } else {
            Ok(false)
        }
    }
}

#[async_trait]
impl RecurrenceRuleRepositoryTrait for RecurrenceRuleLocalAutomergeRepository {}

#[async_trait]
impl ProjectRepository<RecurrenceRule, RecurrenceRuleId>
    for RecurrenceRuleLocalAutomergeRepository
{
    /// 指定したIDの繰り返しルールを取得
    async fn find_by_id(
        &self,
        project_id: &ProjectId,
        id: &RecurrenceRuleId,
    ) -> Result<Option<RecurrenceRule>, RepositoryError> {
        self.get_rule(project_id, id).await
    }

    /// すべての繰り返しルールを取得
    async fn find_all(
        &self,
        project_id: &ProjectId,
    ) -> Result<Vec<RecurrenceRule>, RepositoryError> {
        self.list_recurrence_rules(project_id).await
    }

    /// 繰り返しルールを新規追加
    async fn save(
        &self,
        project_id: &ProjectId,
        entity: &RecurrenceRule,
        _user_id: &UserId,
        _timestamp: &DateTime<Utc>,
    ) -> Result<(), RepositoryError> {
        self.set_recurrence_rule(project_id, entity).await
    }

    /// 繰り返しルールを削除
    async fn delete(
        &self,
        project_id: &ProjectId,
        id: &RecurrenceRuleId,
    ) -> Result<(), RepositoryError> {
        let deleted = self.delete_rule(project_id, id).await?;
        if deleted {
            Ok(())
        } else {
            Err(RepositoryError::NotFound(format!(
                "RecurrenceRule not found: {}",
                id
            )))
        }
    }

    async fn exists(
        &self,
        project_id: &ProjectId,
        id: &RecurrenceRuleId,
    ) -> Result<bool, RepositoryError> {
        let found = self.find_by_id(project_id, id).await?;
        Ok(found.is_some())
    }

    async fn count(&self, project_id: &ProjectId) -> Result<u64, RepositoryError> {
        let recurrence_rules = self.find_all(project_id).await?;
        Ok(recurrence_rules.len() as u64)
    }
}
