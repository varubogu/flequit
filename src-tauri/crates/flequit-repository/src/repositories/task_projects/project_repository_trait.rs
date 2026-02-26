use crate::base_repository_trait::Repository;
use async_trait::async_trait;
use flequit_model::models::task_projects::project::Project;
use flequit_model::types::id_types::ProjectId;

/// 統合プロジェクトリポジトリトレイト
///
/// Service層はこのトレイトを直接使用し、内部でSQLiteとAutomergeを統合的に処理する。
/// - SQLite: 高速検索とクエリ処理
/// - Automerge: データ永続化と履歴管理
///
/// # 使用方法
///
/// ```rust,no_run
/// # use flequit_model::models::task_projects::project::Project;
/// # use flequit_model::types::id_types::ProjectId;
/// # use flequit_repository::repositories::task_projects::project_repository_trait::ProjectRepositoryTrait;
/// fn assert_project_repository_trait<R>()
/// where
///     R: ProjectRepositoryTrait,
/// {
///     let _ = (ProjectId::new(), std::mem::size_of::<Project>());
/// }
/// ```
///
/// Repository内部でストレージ選択を自動実行:
/// - 検索系操作: SQLite
/// - 保存系操作: Automerge → SQLiteに同期
#[async_trait]
pub trait ProjectRepositoryTrait: Repository<Project, ProjectId> + Send + Sync {}
