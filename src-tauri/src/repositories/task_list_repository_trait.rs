// use crate::errors::repository_error::RepositoryError;
use crate::models::project::Project;
use crate::repositories::base_repository_trait::Repository;
use async_trait::async_trait;

/// 統合プロジェクトリポジトリトレイト
///
/// Service層はこのトレイトを直接使用し、内部でSQLiteとAutomergeを統合的に処理する。
/// - SQLite: 高速検索とクエリ処理
/// - Automerge: データ永続化と履歴管理
///
/// # 使用方法
///
/// ```rust
/// // Service層での使用例
/// let repository = UnifiedProjectRepository::new().await?;
///
/// // 保存（Automerge + SQLiteに自動保存）
/// repository.save(&project).await?;
///
/// // 検索（SQLiteから高速検索）
/// let projects = repository.find_all().await?;
/// ```
///
/// Repository内部でストレージ選択を自動実行:
/// - 検索系操作: SQLite
/// - 保存系操作: Automerge → SQLiteに同期
#[async_trait]
pub trait TaskListRepositoryTrait: Repository<Project> + Send + Sync {
    // 統合リポジトリでのみ使用するため、基本的なRepository<Project>の機能で十分
    // 必要に応じて将来的に専用メソッドを追加
}
