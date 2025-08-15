use crate::errors::RepositoryError;
use crate::models::project::Project;
use crate::repositories::base_repository_trait::Repository;
use crate::repositories::project_repository_trait::ProjectRepositoryTrait;
use super::projects_repository::ProjectsRepository as InnerProjectsRepository;
use async_trait::async_trait;
use std::path::PathBuf;

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
pub struct LocalAutomergeProjectRepository {
    inner: InnerProjectsRepository,
}

impl LocalAutomergeProjectRepository {
    /// 新しいLocalAutomergeProjectRepositoryを作成
    /// 
    /// # 引数
    /// 
    /// * `base_path` - Automergeドキュメントの保存先ディレクトリ
    /// 
    /// # 戻り値
    /// 
    /// 初期化されたリポジトリインスタンス、失敗時は`Err(RepositoryError)`
    pub fn new(base_path: PathBuf) -> Result<Self, RepositoryError> {
        let inner = InnerProjectsRepository::new(base_path)?;
        Ok(Self { inner })
    }

    /// デフォルトパスでLocalAutomergeProjectRepositoryを作成
    /// 
    /// # 戻り値
    /// 
    /// 初期化されたリポジトリインスタンス、失敗時は`Err(RepositoryError)`
    pub fn with_default_path() -> Result<Self, RepositoryError> {
        let inner = InnerProjectsRepository::with_default_path()?;
        Ok(Self { inner })
    }
}

#[async_trait]
impl Repository<Project> for LocalAutomergeProjectRepository {
    async fn save(&self, entity: &Project) -> Result<(), RepositoryError> {
        self.inner.set_project(entity).await
    }

    async fn find_by_id(&self, id: &str) -> Result<Option<Project>, RepositoryError> {
        self.inner.get_project(id).await
    }

    async fn find_all(&self) -> Result<Vec<Project>, RepositoryError> {
        // 現在のAutomerge実装では単一プロジェクトのみ対応
        // 将来複数プロジェクト対応時に実装
        Ok(Vec::new())
    }

    async fn delete(&self, id: &str) -> Result<(), RepositoryError> {
        self.inner.delete_project(id).await
    }

    async fn exists(&self, id: &str) -> Result<bool, RepositoryError> {
        // get_projectで存在確認
        Ok(self.inner.get_project(id).await?.is_some())
    }

    async fn count(&self) -> Result<u64, RepositoryError> {
        // 現在のAutomerge実装では単一プロジェクトのみ対応
        // 将来複数プロジェクト対応時に実装
        Ok(0)
    }
}

#[async_trait]
impl ProjectRepositoryTrait for LocalAutomergeProjectRepository {
    // 現時点ではプロジェクト固有の追加メソッドは不要
    // 基本CRUD操作は Repository<Project> の実装で十分
    
    // TODO: 将来必要になった場合の実装例
    // async fn archive_project(&self, project_id: &str) -> Result<(), RepositoryError> {
    //     // Automergeドキュメントのアーカイブフラグ設定
    // }
}