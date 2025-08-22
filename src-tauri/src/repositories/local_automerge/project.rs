use super::document_manager::{DocumentManager, DocumentType};
use crate::errors::RepositoryError;
use crate::models::project::Project;
use crate::repositories::base_repository_trait::Repository;
use crate::repositories::project_repository_trait::ProjectRepositoryTrait;
use crate::types::id_types::ProjectId;
use async_trait::async_trait;
use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::Mutex;

/// Automerge実装のプロジェクトリポジトリ
///
/// `Repository<Project>`と`ProjectRepositoryTrait`を実装し、
/// Automerge-Repoを使用したプロジェクト管理を提供する。
///
/// # アーキテクチャ
///
/// ```
/// LocalAutomergeProjectRepository (このクラス)
/// ↓ 委譲
/// InnerProjectsRepository (既存の実装)
/// ↓ データアクセス
/// Automerge Documents
/// ```
///
/// # 特徴
///
/// - **分散同期**: CRDTによる競合解決機能
/// - **履歴管理**: すべての変更履歴を保持
/// - **オフライン対応**: ローカル優先で同期可能
/// - **JSON互換**: 構造化データの効率的な管理
#[derive(Debug)]
pub struct ProjectLocalAutomergeRepository {
    document_manager: Arc<Mutex<DocumentManager>>,
}

impl ProjectLocalAutomergeRepository {
    /// 新しいProjectRepositoryを作成
    pub fn new(base_path: PathBuf) -> Result<Self, RepositoryError> {
        let document_manager = DocumentManager::new(base_path)?;
        Ok(Self {
            document_manager: Arc::new(Mutex::new(document_manager)),
        })
    }

    /// 全プロジェクトを取得
    pub async fn list_projects(&self) -> Result<Vec<Project>, RepositoryError> {
        let projects = {
            let mut manager = self.document_manager.lock().await;
            manager
                .load_data::<Vec<Project>>(&DocumentType::Settings, "projects")
                .await?
        };
        if let Some(projects) = projects {
            Ok(projects)
        } else {
            Ok(Vec::new())
        }
    }

    /// IDでプロジェクトを取得
    pub async fn get_project(&self, project_id: &str) -> Result<Option<Project>, RepositoryError> {
        let projects = self.list_projects().await?;
        Ok(projects.into_iter().find(|p| p.id == project_id.into()))
    }

    /// プロジェクトを作成または更新
    pub async fn set_project(&self, project: &Project) -> Result<(), RepositoryError> {
        log::info!("set_project - 開始: {:?}", project.id);
        let mut projects = self.list_projects().await?;
        log::info!("set_project - 現在のプロジェクト数: {}", projects.len());

        // 既存のプロジェクトを更新、または新規追加
        if let Some(existing) = projects.iter_mut().find(|p| p.id == project.id) {
            log::info!("set_project - 既存プロジェクトを更新: {:?}", project.id);
            *existing = project.clone();
        } else {
            log::info!("set_project - 新規プロジェクト追加: {:?}", project.id);
            projects.push(project.clone());
        }

        {
            let mut manager = self.document_manager.lock().await;
            log::info!("set_project - DocumentManager取得完了");
            let result = manager
                .save_data(&DocumentType::Settings, "projects", &projects)
                .await;
            if result.is_ok() {
                log::info!("set_project - Automergeドキュメント保存完了");
            } else {
                log::error!(
                    "set_project - Automergeドキュメント保存エラー: {:?}",
                    result
                );
            }
            result
        }
    }

    /// プロジェクトを削除
    pub async fn delete_project(&self, project_id: &str) -> Result<bool, RepositoryError> {
        let mut projects = self.list_projects().await?;
        let initial_len = projects.len();
        projects.retain(|p| p.id != project_id.into());

        if projects.len() != initial_len {
            {
                let mut manager = self.document_manager.lock().await;
                manager
                    .save_data(&DocumentType::Settings, "projects", &projects)
                    .await?
            };
            Ok(true)
        } else {
            Ok(false)
        }
    }
}

#[async_trait]
impl Repository<Project, ProjectId> for ProjectLocalAutomergeRepository {
    async fn save(&self, entity: &Project) -> Result<(), RepositoryError> {
        log::info!(
            "ProjectLocalAutomergeRepository::save - 開始: {:?}",
            entity.id
        );
        let result = self.set_project(entity).await;
        if result.is_ok() {
            log::info!(
                "ProjectLocalAutomergeRepository::save - 完了: {:?}",
                entity.id
            );
        } else {
            log::error!(
                "ProjectLocalAutomergeRepository::save - エラー: {:?}",
                result
            );
        }
        result
    }

    async fn find_by_id(&self, id: &ProjectId) -> Result<Option<Project>, RepositoryError> {
        self.get_project(&id.to_string()).await
    }

    async fn find_all(&self) -> Result<Vec<Project>, RepositoryError> {
        self.list_projects().await
    }

    async fn delete(&self, id: &ProjectId) -> Result<(), RepositoryError> {
        let deleted = self.delete_project(&id.to_string()).await?;
        if deleted {
            Ok(())
        } else {
            Err(RepositoryError::NotFound(format!(
                "Project not found: {}",
                id
            )))
        }
    }

    async fn exists(&self, id: &ProjectId) -> Result<bool, RepositoryError> {
        let found = self.find_by_id(id).await?;
        Ok(found.is_some())
    }

    async fn count(&self) -> Result<u64, RepositoryError> {
        let projects = self.find_all().await?;
        Ok(projects.len() as u64)
    }
}

#[async_trait]
impl ProjectRepositoryTrait for ProjectLocalAutomergeRepository {}
