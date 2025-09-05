//! プロジェクト一覧管理用Automergeリポジトリ

use crate::infrastructure::document::Document;
use super::super::document_manager::{DocumentManager, DocumentType};
use flequit_model::models::task_projects::project::Project;
use flequit_model::types::id_types::ProjectId;
use flequit_types::errors::repository_error::RepositoryError;
use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::RwLock;

/// プロジェクト一覧管理のためのAutomergeリポジトリ
/// 
/// Settings文書を使用してプロジェクト一覧を管理する。
/// 個別プロジェクトの詳細は別途ProjectLocalAutomergeRepositoryで管理される。
#[derive(Debug)]
pub struct ProjectListLocalAutomergeRepository {
    document_manager: Arc<RwLock<DocumentManager>>,
}

impl ProjectListLocalAutomergeRepository {
    /// 新しいProjectListRepositoryを作成
    pub async fn new(base_path: PathBuf) -> Result<Self, RepositoryError> {
        let document_manager = DocumentManager::new(base_path)?;
        Ok(Self {
            document_manager: Arc::new(RwLock::new(document_manager)),
        })
    }

    /// Settings文書を取得または作成（プロジェクト一覧管理用）
    async fn get_or_create_settings_document(&self) -> Result<Document, RepositoryError> {
        let doc_type = DocumentType::Settings;
        let mut manager = self.document_manager.write().await;
        manager.get_or_create(&doc_type).await.map_err(|e| RepositoryError::AutomergeError(e.to_string()))
    }

    /// 全プロジェクト一覧を取得
    #[tracing::instrument(level = "trace")]
    pub async fn list_projects(&self) -> Result<Vec<Project>, RepositoryError> {
        let document = self.get_or_create_settings_document().await?;
        let projects = document.load_data::<Vec<Project>>("projects").await?;
        if let Some(projects) = projects {
            Ok(projects)
        } else {
            Ok(Vec::new())
        }
    }

    /// プロジェクトをプロジェクト一覧に追加または更新
    #[tracing::instrument(level = "trace")]
    pub async fn add_or_update_project(&self, project: &Project) -> Result<(), RepositoryError> {
        log::info!("add_or_update_project - 開始: {:?}", project.id);
        
        let mut projects = self.list_projects().await?;
        log::info!("add_or_update_project - 現在のプロジェクト数: {}", projects.len());

        // 既存のプロジェクトを更新、または新規追加
        if let Some(existing) = projects.iter_mut().find(|p| p.id == project.id) {
            log::info!("add_or_update_project - 既存プロジェクト更新: {:?}", project.id);
            *existing = project.clone();
        } else {
            log::info!("add_or_update_project - 新規プロジェクト追加: {:?}", project.id);
            projects.push(project.clone());
        }

        let document = self.get_or_create_settings_document().await?;
        log::info!("add_or_update_project - Settings文書取得完了");
        
        let result = document.save_data("projects", &projects).await;
        match result {
            Ok(_) => {
                log::info!("add_or_update_project - Settings文書保存完了");
                Ok(())
            },
            Err(e) => {
                log::error!("add_or_update_project - Settings文書保存エラー: {:?}", e);
                Err(RepositoryError::AutomergeError(e.to_string()))
            }
        }
    }

    /// IDでプロジェクトを取得（一覧から）
    #[tracing::instrument(level = "trace")]
    pub async fn get_project_from_list(&self, project_id: &str) -> Result<Option<Project>, RepositoryError> {
        let projects = self.list_projects().await?;
        Ok(projects.into_iter().find(|p| p.id == project_id.into()))
    }

    /// プロジェクトをプロジェクト一覧から削除
    #[tracing::instrument(level = "trace")]
    pub async fn remove_project_from_list(&self, project_id: &str) -> Result<bool, RepositoryError> {
        let mut projects = self.list_projects().await?;
        let initial_len = projects.len();
        projects.retain(|p| p.id != project_id.into());

        if projects.len() != initial_len {
            let document = self.get_or_create_settings_document().await?;
            document.save_data("projects", &projects).await?;
            Ok(true)
        } else {
            Ok(false)
        }
    }

    /// プロジェクト数を取得
    #[tracing::instrument(level = "trace")]
    pub async fn count_projects(&self) -> Result<u64, RepositoryError> {
        let projects = self.list_projects().await?;
        Ok(projects.len() as u64)
    }

    /// プロジェクトが一覧に存在するかチェック
    #[tracing::instrument(level = "trace")]
    pub async fn project_exists_in_list(&self, project_id: &ProjectId) -> Result<bool, RepositoryError> {
        let found = self.get_project_from_list(&project_id.to_string()).await?;
        Ok(found.is_some())
    }
}