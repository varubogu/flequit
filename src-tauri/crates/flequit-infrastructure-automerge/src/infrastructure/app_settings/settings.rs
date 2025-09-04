//! Settings用Automergeリポジトリ

use crate::infrastructure::document::Document;

use super::super::document_manager::{DocumentManager, DocumentType};
use flequit_model::models::app_settings::{
    settings::Settings,
};
use flequit_repository::repositories::base_repository_trait::Repository;
use flequit_repository::repositories::app_settings::SettingsRepositoryTrait;
use flequit_model::types::id_types::{ProjectId, SettingsId};
use async_trait::async_trait;
use flequit_types::errors::repository_error::RepositoryError;
use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::Mutex;

const SETTINGS_KEY: &str = "app_settings";

/// Settings用のAutomerge-Repoリポジトリ
#[derive(Debug, Clone)]
pub struct SettingsLocalAutomergeRepository {
    document: Document,
}

impl SettingsLocalAutomergeRepository {
    pub async fn new(base_path: PathBuf, project_id: ProjectId) -> Result<Self, RepositoryError> {
        let doc_type = &DocumentType::Project(project_id);
        let mut document_manager = DocumentManager::new(base_path)?;
        let doc = document_manager.get_or_create(doc_type).await?;
        Ok(Self {
            document: doc,
        })
    }

    /// 共有DocumentManagerを使用して新しいインスタンスを作成
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
}

#[async_trait]
impl SettingsRepositoryTrait for SettingsLocalAutomergeRepository {
    // ---------------------------
    // 設定（構造体）
    // ---------------------------

    async fn get_settings(&self) -> Result<Option<Settings>, RepositoryError> {
        let settings = {
            self.document
                .load_data::<Settings>(SETTINGS_KEY)
                .await?
        };

        Ok(settings)
    }
}

#[async_trait]
impl Repository<Settings, SettingsId> for SettingsLocalAutomergeRepository {
    async fn save(&self, settings: &Settings) -> Result<(), RepositoryError> {
        let doc = &self.document;
        doc
            .save_data(SETTINGS_KEY, settings)
            .await
            .map_err(|e| RepositoryError::AutomergeError(e.to_string()))
    }

    async fn find_by_id(&self, id: &SettingsId) -> Result<Option<Settings>, RepositoryError> {
        // 設定は固定ID "app_settings" のみサポート
        if id.to_string() == "app_settings" {
            self.get_settings().await
        } else {
            Ok(None)
        }
    }

    async fn find_all(&self) -> Result<Vec<Settings>, RepositoryError> {
        match self.get_settings().await? {
            Some(settings) => Ok(vec![settings]),
            None => Ok(vec![]),
        }
    }

    async fn delete(&self, _id: &SettingsId) -> Result<(), RepositoryError> {
        // 設定は削除をサポートしない
        Err(RepositoryError::InvalidOperation(
            "Settings deletion is not supported".to_string(),
        ))
    }

    async fn exists(&self, id: &SettingsId) -> Result<bool, RepositoryError> {
        let found = self.find_by_id(id).await?;
        Ok(found.is_some())
    }

    async fn count(&self) -> Result<u64, RepositoryError> {
        match self.get_settings().await? {
            Some(_) => Ok(1),
            None => Ok(0),
        }
    }
}
