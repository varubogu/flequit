//! プロジェクト用統合リポジトリ
//!
//! SQLite（高速検索）とAutomerge（永続化・同期）を統合し、
//! プロジェクトエンティティに最適化されたアクセスパターンを提供する。

use async_trait::async_trait;
use log::info;

use crate::errors::RepositoryError;
use crate::models::project::Project;
use crate::repositories::base_repository_trait::Repository;
use crate::repositories::project_repository_trait::ProjectRepositoryTrait;
use crate::types::id_types::ProjectId;

/// プロジェクト用統合リポジトリ
///
/// 検索系操作はSQLite、保存系操作はAutomerge→SQLiteの順で実行し、
/// プロジェクトエンティティに最適化されたアクセスパターンを提供する。
pub struct ProjectUnifiedRepository {
    // 注意: 親への参照は設計上の理想だが、Rustの所有権制約により
    // 実際の実装では別のアプローチを採用
}

impl ProjectUnifiedRepository {
    pub fn new() -> Self {
        Self {
        }
    }
}

#[async_trait]
impl Repository<Project, ProjectId> for ProjectUnifiedRepository {
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
        info!("ProjectUnifiedRepository::find_all");
        Ok(vec![])
    }

    async fn delete(&self, id: &ProjectId) -> Result<(), RepositoryError> {
        info!("ProjectUnifiedRepository::delete");
        info!("{:?}", id);
        Ok(())
    }

    async fn exists(&self, id: &ProjectId) -> Result<bool, RepositoryError> {
        info!("ProjectUnifiedRepository::exists");
        info!("{:?}", id);
        Ok(true)
    }

    async fn count(&self) -> Result<u64, RepositoryError> {
        info!("ProjectUnifiedRepository::count");
        Ok(0)
    }
}

impl ProjectRepositoryTrait for ProjectUnifiedRepository {

}
