use crate::errors::RepositoryError;
use crate::models::project::Project;
use crate::repositories::base_repository_trait::Repository;
use crate::repositories::project_repository_trait::ProjectRepositoryTrait;
use super::{project_repository::ProjectRepository as InnerProjectRepository, DatabaseManager, Repository as LocalRepository};
use async_trait::async_trait;

/// SQLite実装のプロジェクトリポジトリ
/// 
/// `Repository<Project>`と`ProjectRepositoryTrait`を実装し、
/// SQLiteを使用したプロジェクト管理を提供する。
/// 
/// # アーキテクチャ
/// 
/// ```
/// LocalSqliteProjectRepository (このクラス)
/// ↓ 委譲
/// InnerProjectRepository (既存の実装)
/// ↓ データアクセス
/// SQLite Database
/// ```
/// 
/// # 設計パターン
/// 
/// - **Adapter Pattern**: 既存のInnerProjectRepositoryを新しいトレイト構造に適応
/// - **Delegation Pattern**: 実際の処理は既存実装に委譲
/// - **Facade Pattern**: 複雑な既存実装を単純なインターフェースで隠蔽
pub struct LocalSqliteProjectRepository {
    inner: InnerProjectRepository,
}

impl LocalSqliteProjectRepository {
    /// 新しいLocalSqliteProjectRepositoryを作成
    /// 
    /// # 引数
    /// 
    /// * `db_manager` - データベースマネージャー
    /// 
    /// # 戻り値
    /// 
    /// 初期化されたリポジトリインスタンス、失敗時は`Err(RepositoryError)`
    pub fn new(db_manager: DatabaseManager) -> Result<Self, RepositoryError> {
        let inner = InnerProjectRepository::new(db_manager);
        Ok(Self { inner })
    }

    /// デフォルトパスでLocalSqliteProjectRepositoryを作成
    /// 
    /// # 戻り値
    /// 
    /// 初期化されたリポジトリインスタンス、失敗時は`Err(RepositoryError)`
    pub async fn with_default_path() -> Result<Self, RepositoryError> {
        let db_manager = DatabaseManager::with_default_path().await
            .map_err(|e| RepositoryError::ConnectionError(e.to_string()))?;
        let inner = InnerProjectRepository::new(db_manager);
        Ok(Self { inner })
    }
}

#[async_trait]
impl Repository<Project> for LocalSqliteProjectRepository {
    async fn save(&self, entity: &Project) -> Result<(), RepositoryError> {
        self.inner.save(entity).await.map_err(|e| match e {
            super::RepositoryError::Database(db_err) => RepositoryError::ConnectionError(db_err.to_string()),
            super::RepositoryError::Conversion(msg) => RepositoryError::ConversionError(msg),
            super::RepositoryError::NotFound(msg) => RepositoryError::NotFound(msg),
            super::RepositoryError::ConstraintViolation(msg) => RepositoryError::ValidationError(msg),
        })?;
        Ok(())
    }

    async fn find_by_id(&self, id: &str) -> Result<Option<Project>, RepositoryError> {
        self.inner.find_by_id(id).await.map_err(|e| match e {
            super::RepositoryError::Database(db_err) => RepositoryError::ConnectionError(db_err.to_string()),
            super::RepositoryError::Conversion(msg) => RepositoryError::ConversionError(msg),
            super::RepositoryError::NotFound(msg) => RepositoryError::NotFound(msg),
            super::RepositoryError::ConstraintViolation(msg) => RepositoryError::ValidationError(msg),
        })
    }

    async fn find_all(&self) -> Result<Vec<Project>, RepositoryError> {
        self.inner.find_all().await.map_err(|e| match e {
            super::RepositoryError::Database(db_err) => RepositoryError::ConnectionError(db_err.to_string()),
            super::RepositoryError::Conversion(msg) => RepositoryError::ConversionError(msg),
            super::RepositoryError::NotFound(msg) => RepositoryError::NotFound(msg),
            super::RepositoryError::ConstraintViolation(msg) => RepositoryError::ValidationError(msg),
        })
    }

    async fn delete(&self, id: &str) -> Result<(), RepositoryError> {
        self.inner.delete_by_id(id).await.map_err(|e| match e {
            super::RepositoryError::Database(db_err) => RepositoryError::ConnectionError(db_err.to_string()),
            super::RepositoryError::Conversion(msg) => RepositoryError::ConversionError(msg),
            super::RepositoryError::NotFound(msg) => RepositoryError::NotFound(msg),
            super::RepositoryError::ConstraintViolation(msg) => RepositoryError::ValidationError(msg),
        })?;
        Ok(())
    }

    async fn exists(&self, id: &str) -> Result<bool, RepositoryError> {
        let result = self.inner.find_by_id(id).await.map_err(|e| match e {
            super::RepositoryError::Database(db_err) => RepositoryError::ConnectionError(db_err.to_string()),
            super::RepositoryError::Conversion(msg) => RepositoryError::ConversionError(msg),
            super::RepositoryError::NotFound(msg) => RepositoryError::NotFound(msg),
            super::RepositoryError::ConstraintViolation(msg) => RepositoryError::ValidationError(msg),
        })?;
        Ok(result.is_some())
    }

    async fn count(&self) -> Result<u64, RepositoryError> {
        let projects = self.inner.find_all().await.map_err(|e| match e {
            super::RepositoryError::Database(db_err) => RepositoryError::ConnectionError(db_err.to_string()),
            super::RepositoryError::Conversion(msg) => RepositoryError::ConversionError(msg),
            super::RepositoryError::NotFound(msg) => RepositoryError::NotFound(msg),
            super::RepositoryError::ConstraintViolation(msg) => RepositoryError::ValidationError(msg),
        })?;
        Ok(projects.len() as u64)
    }
}

#[async_trait]
impl ProjectRepositoryTrait for LocalSqliteProjectRepository {
    // 現時点ではプロジェクト固有の追加メソッドは不要
    // 基本CRUD操作は Repository<Project> の実装で十分
    
    // TODO: 将来必要になった場合の実装例
    // async fn archive_project(&self, project_id: &str) -> Result<(), RepositoryError> {
    //     // アーカイブ処理の実装
    // }
}