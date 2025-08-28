use async_trait::async_trait;
use flequit_model::models::project::Project;
use flequit_model::types::id_types::ProjectId;
use crate::repositories::base_repository_trait::Repository;

/// 統合プロジェクトリポジトリトレイト
///
/// Service層はこのトレイトを直接使用し、内部でSQLiteとAutomergeを統合的に処理する。
/// - SQLite: 高速検索とクエリ処理
/// - Automerge: データ永続化と履歴管理
///
/// # 使用方法
///
/// ```rust,no_run
/// # use flequit_lib::models::project::Project;
/// # use flequit_lib::types::id_types::ProjectId;
/// # use flequit_lib::repositories::project_repository_trait::ProjectRepositoryTrait;
/// # async fn example() -> Result<(), Box<dyn std::error::Error>> {
/// // Service層での使用例
/// // let repository = SomeProjectRepository::new().await?;
/// // let project = Project::default();
/// //
/// // // 保存（Automerge + SQLiteに自動保存）
/// // repository.save(&project).await?;
/// //
/// // // 検索（SQLiteから高速検索）
/// // let projects = repository.find_all().await?;
/// # Ok(())
/// # }
/// ```
///
/// Repository内部でストレージ選択を自動実行:
/// - 検索系操作: SQLite
/// - 保存系操作: Automerge → SQLiteに同期
#[async_trait]
pub trait ProjectRepositoryTrait: Repository<Project, ProjectId> + Send + Sync {}
