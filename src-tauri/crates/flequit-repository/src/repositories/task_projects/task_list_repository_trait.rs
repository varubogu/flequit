use async_trait::async_trait;
use flequit_model::models::task_projects::task_list::TaskList;
use flequit_model::types::id_types::TaskListId;
use crate::repositories::base_repository_trait::Repository;

/// 統合タスクリストリポジトリトレイト
///
/// Service層はこのトレイトを直接使用し、内部でSQLiteとAutomergeを統合的に処理する。
/// - SQLite: 高速検索とクエリ処理
/// - Automerge: データ永続化と履歴管理
///
/// # 使用方法
///
/// ```rust,no_run
/// # use flequit_model::models::task_list::TaskList;
/// # use flequit_model::types::id_types::TaskListId;
/// # use flequit_storage::repositories::task_list_repository_trait::TaskListRepositoryTrait;
/// # async fn example() -> Result<(), Box<dyn std::error::Error>> {
/// // Service層での使用例
/// // let repository = SomeTaskListRepository::new().await?;
/// // let task_list = TaskList::default();
/// //
/// // // 保存（Automerge + SQLiteに自動保存）
/// // repository.save(&task_list).await?;
/// //
/// // // 検索（SQLiteから高速検索）
/// // let task_lists = repository.find_all().await?;
/// # Ok(())
/// # }
/// ```
///
/// Repository内部でストレージ選択を自動実行:
/// - 検索系操作: SQLite
/// - 保存系操作: Automerge → SQLiteに同期
#[async_trait]
pub trait TaskListRepositoryTrait: Repository<TaskList, TaskListId> + Send + Sync {}
