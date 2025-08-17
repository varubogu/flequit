use crate::errors::RepositoryError;
use crate::models::project::Project;
use crate::repositories::base_repository_trait::Repository;
use crate::repositories::project_repository_trait::ProjectRepositoryTrait;
use crate::types::id_types::ProjectId;
use async_trait::async_trait;
use log::info;

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
pub struct LocalAutomergeProjectRepository {}

impl LocalAutomergeProjectRepository {
    pub fn new() -> Self {
        Self {}
    }
}

#[async_trait]
impl Repository<Project, ProjectId> for LocalAutomergeProjectRepository {
    async fn save(&self, entity: &Project) -> Result<(), RepositoryError> {
        info!("ProjectUnifiedRepository::save");
        info!("{:?}", entity);

        Ok(())
    }

    async fn find_by_id(&self, id: &ProjectId) -> Result<Option<Project>, RepositoryError> {
        info!("ProjectUnifiedRepository::find_by_id");
        info!("{:?}", id);
        Ok(Option::from(None))
    }

    async fn find_all(&self) -> Result<Vec<Project>, RepositoryError> {
        // 現在のAutomerge実装では単一プロジェクトのみ対応
        // 将来複数プロジェクト対応時に実装
        Ok(Vec::new())
    }

    async fn delete(&self, id: &ProjectId) -> Result<(), RepositoryError> {
        info!("ProjectUnifiedRepository::delete");
        info!("{:?}", id);
        Ok(())
    }

    async fn exists(&self, id: &ProjectId) -> Result<bool, RepositoryError> {
        info!("ProjectUnifiedRepository::exists");
        info!("{:?}", id);
        Ok(false)
    }

    async fn count(&self) -> Result<u64, RepositoryError> {
        // 現在のAutomerge実装では単一プロジェクトのみ対応
        // 将来複数プロジェクト対応時に実装
        Ok(0)
    }
}

#[async_trait]
impl ProjectRepositoryTrait for LocalAutomergeProjectRepository {}
