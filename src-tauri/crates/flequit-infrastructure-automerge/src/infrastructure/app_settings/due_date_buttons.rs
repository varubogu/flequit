//! DueDateButtons用Automergeリポジトリ

use super::super::document_manager::{DocumentManager, DocumentType};
use flequit_model::models::app_settings::due_date_buttons::DueDateButtons;
use flequit_repository::repositories::base_repository_trait::Repository;
use flequit_repository::repositories::app_settings::due_date_buttons_repository_trait::DueDateButtonsRepositoryTrait;
use flequit_model::types::id_types::DueDateButtonsId;
use async_trait::async_trait;
use flequit_types::errors::repository_error::RepositoryError;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::Mutex;
use log::info;

/// DueDateButtons Document構造（Automerge専用）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DueDateButtonsDocument {
    /// 期限日ボタン設定
    pub due_date_buttons: Option<DueDateButtons>,
}

impl Default for DueDateButtonsDocument {
    fn default() -> Self {
        Self {
            due_date_buttons: None,
        }
    }
}

#[derive(Debug)]
pub struct DueDateButtonsLocalAutomergeRepository {
    document_manager: Arc<Mutex<DocumentManager>>,
}

impl DueDateButtonsLocalAutomergeRepository {
    pub fn new(document_manager: Arc<Mutex<DocumentManager>>) -> Self {
        Self { document_manager }
    }

    /// 期限日ボタン設定ドキュメントを取得または作成
    async fn get_or_create_document(&self) -> Result<DueDateButtonsDocument, RepositoryError> {
        let mut manager = self.document_manager.lock().await;

        let doc_type = DocumentType::Settings;

        match manager.load_document::<DueDateButtonsDocument>(&doc_type).await {
            Ok(Some(document)) => Ok(document),
            Ok(None) | Err(_) => {
                // ドキュメントが存在しない場合は新規作成
                let new_document = DueDateButtonsDocument::default();
                manager.save_document(&doc_type, &new_document).await?;
                Ok(new_document)
            }
        }
    }

    /// 期限日ボタン設定ドキュメントを保存
    async fn save_document(&self, document: &DueDateButtonsDocument) -> Result<(), RepositoryError> {
        let mut manager = self.document_manager.lock().await;

        let doc_type = DocumentType::Settings;

        manager.save_document(&doc_type, document).await?;
        Ok(())
    }

    /// 固定IDで設定を管理（単一の設定オブジェクト）
    const SETTINGS_ID: &'static str = "due_date_buttons_config";
}

#[async_trait]
impl Repository<DueDateButtons, DueDateButtonsId> for DueDateButtonsLocalAutomergeRepository {
    async fn save(&self, entity: &DueDateButtons) -> Result<(), RepositoryError> {
        info!("DueDateButtonsLocalAutomergeRepository::save - 期限日ボタン設定を保存");

        let mut document = self.get_or_create_document().await?;
        document.due_date_buttons = Some(entity.clone());
        self.save_document(&document).await?;
        Ok(())
    }

    async fn find_by_id(&self, _id: &DueDateButtonsId) -> Result<Option<DueDateButtons>, RepositoryError> {
        info!("DueDateButtonsLocalAutomergeRepository::find_by_id - 期限日ボタン設定を取得");

        let document = self.get_or_create_document().await?;
        Ok(document.due_date_buttons)
    }

    async fn find_all(&self) -> Result<Vec<DueDateButtons>, RepositoryError> {
        info!("DueDateButtonsLocalAutomergeRepository::find_all - 期限日ボタン設定を取得");

        let document = self.get_or_create_document().await?;
        if let Some(buttons) = document.due_date_buttons {
            Ok(vec![buttons])
        } else {
            Ok(vec![])
        }
    }

    async fn delete(&self, _id: &DueDateButtonsId) -> Result<(), RepositoryError> {
        info!("DueDateButtonsLocalAutomergeRepository::delete - 期限日ボタン設定を削除");

        let mut document = self.get_or_create_document().await?;
        document.due_date_buttons = None;
        self.save_document(&document).await?;
        Ok(())
    }

    async fn exists(&self, _id: &DueDateButtonsId) -> Result<bool, RepositoryError> {
        let document = self.get_or_create_document().await?;
        Ok(document.due_date_buttons.is_some())
    }

    async fn count(&self) -> Result<u64, RepositoryError> {
        let document = self.get_or_create_document().await?;
        Ok(if document.due_date_buttons.is_some() { 1 } else { 0 })
    }
}

#[async_trait]
impl DueDateButtonsRepositoryTrait for DueDateButtonsLocalAutomergeRepository {
    async fn get_due_date_buttons(&self) -> Result<Option<DueDateButtons>, RepositoryError> {
        let settings_id = DueDateButtonsId::from(Self::SETTINGS_ID);
        self.find_by_id(&settings_id).await
    }

    async fn save_due_date_buttons(&self, buttons: &DueDateButtons) -> Result<(), RepositoryError> {
        self.save(buttons).await
    }

    async fn reset_due_date_buttons(&self) -> Result<(), RepositoryError> {
        let settings_id = DueDateButtonsId::from(Self::SETTINGS_ID);
        self.delete(&settings_id).await
    }
}
