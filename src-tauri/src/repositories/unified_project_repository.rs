use std::sync::Arc;
use async_trait::async_trait;
use crate::models::project::Project;
use crate::errors::repository_error::RepositoryError;
use crate::repositories::{
    base_repository_trait::Repository,
    project_repository_trait::ProjectRepositoryTrait,
};

/// 統合プロジェクトリポジトリ実装
/// 
/// SQLiteとAutomergeを内部で統合的に利用:
/// - 検索系: SQLiteから高速検索
/// - 保存系: Automergeに永続化 → SQLiteに同期
/// 
/// Service層はこの実装を直接使用し、内部のストレージ詳細は隠蔽される。
pub struct UnifiedProjectRepository {
    sqlite_repository: Arc<dyn Repository<Project> + Send + Sync>,
    automerge_repository: Arc<dyn Repository<Project> + Send + Sync>,
}

impl UnifiedProjectRepository {
    /// 新しい統合リポジトリインスタンスを作成
    pub async fn new() -> Result<Self, RepositoryError> {
        // SQLiteリポジトリの初期化
        use crate::repositories::local_sqlite::project_repository_impl::LocalSqliteProjectRepository;
        let sqlite_repository = Arc::new(
            LocalSqliteProjectRepository::with_default_path().await?
        );

        // Automergeリポジトリの初期化
        use crate::repositories::local_automerge::project_repository_impl::LocalAutomergeProjectRepository;
        let automerge_repository = Arc::new(
            LocalAutomergeProjectRepository::with_default_path()?
        );

        Ok(Self {
            sqlite_repository,
            automerge_repository,
        })
    }
}

#[async_trait]
impl Repository<Project> for UnifiedProjectRepository {
    /// プロジェクト保存: Automerge → SQLite の順で保存
    async fn save(&self, entity: &Project) -> Result<(), RepositoryError> {
        // 1. 永続化システム（Automerge）に保存
        self.automerge_repository.save(entity).await?;
        
        // 2. 検索用システム（SQLite）に同期
        self.sqlite_repository.save(entity).await?;
        
        Ok(())
    }

    /// プロジェクト検索: SQLiteから高速検索
    async fn find_by_id(&self, id: &str) -> Result<Option<Project>, RepositoryError> {
        self.sqlite_repository.find_by_id(id).await
    }

    /// 全プロジェクト取得: SQLiteから高速検索
    async fn find_all(&self) -> Result<Vec<Project>, RepositoryError> {
        self.sqlite_repository.find_all().await
    }

    /// プロジェクト削除: Automerge → SQLite の順で削除
    async fn delete(&self, id: &str) -> Result<(), RepositoryError> {
        // 1. 永続化システム（Automerge）から削除
        self.automerge_repository.delete(id).await?;
        
        // 2. 検索用システム（SQLite）から削除
        self.sqlite_repository.delete(id).await?;
        
        Ok(())
    }

    /// プロジェクト存在確認: SQLiteから高速確認
    async fn exists(&self, id: &str) -> Result<bool, RepositoryError> {
        self.sqlite_repository.exists(id).await
    }

    /// プロジェクト件数: SQLiteから高速カウント
    async fn count(&self) -> Result<u64, RepositoryError> {
        self.sqlite_repository.count().await
    }
}

#[async_trait]
impl ProjectRepositoryTrait for UnifiedProjectRepository {
    // 統合リポジトリは基本的なRepository<Project>の実装で十分
}