use std::sync::Arc;
use crate::repositories::project_repository_trait::ProjectRepositoryTrait;
use crate::errors::repository_error::RepositoryError;

/// リポジトリファクトリー
/// 
/// 設定に基づいて適切なリポジトリ実装を作成し、
/// サービス層が具体的な実装を知る必要をなくす
pub struct RepositoryFactory;

impl RepositoryFactory {
    /// デフォルト設定でProjectRepositoryを作成
    /// 
    /// 現在はLocalAutomergeProjectRepositoryをデフォルトとするが、
    /// 将来的には設定ファイルや環境変数に基づいて実装を選択可能
    pub async fn create_project_repository() -> Result<Arc<dyn ProjectRepositoryTrait + Send + Sync>, RepositoryError> {
        // TODO: 設定に基づいてリポジトリを選択
        // - local_automerge (現在のデフォルト)  
        // - local_sqlite (検索用)
        // - web (将来実装)
        // - hybrid (複数組み合わせ)
        
        use crate::repositories::local_automerge::project_repository_impl::LocalAutomergeProjectRepository;
        let repository = LocalAutomergeProjectRepository::with_default_path()?;
        Ok(Arc::new(repository))
    }

    /// 検索専用のProjectRepositoryを作成
    /// 
    /// 検索性能に優れたSQLite実装を使用
    #[allow(dead_code)]
    pub async fn create_search_project_repository() -> Result<Arc<dyn ProjectRepositoryTrait + Send + Sync>, RepositoryError> {
        use crate::repositories::local_sqlite::project_repository_impl::LocalSqliteProjectRepository;
        let repository = LocalSqliteProjectRepository::with_default_path().await?;
        Ok(Arc::new(repository))
    }
}