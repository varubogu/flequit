use crate::repositories::project_patchable_trait::ProjectPatchable;
use crate::repositories::project_repository_trait::ProjectRepository;
use async_trait::async_trait;
use flequit_model::models::task_projects::task_list::TaskList;
use flequit_model::types::id_types::TaskListId;

/// 統合タスクリストリポジトリトレイト
///
/// Service層はこのトレイトを直接使用し、内部でSQLiteとAutomergeを統合的に処理する。
/// - SQLite: 高速検索とクエリ処理
/// - Automerge: データ永続化と履歴管理
///
/// # 使用方法
///
/// ```rust,no_run
/// # use flequit_model::models::task_projects::task_list::TaskList;
/// # use flequit_model::types::id_types::TaskListId;
/// # use flequit_repository::repositories::task_projects::task_list_repository_trait::TaskListRepositoryTrait;
/// fn assert_task_list_repository_trait<R>()
/// where
///     R: TaskListRepositoryTrait,
/// {
///     let _ = (TaskListId::new(), std::mem::size_of::<TaskList>());
/// }
/// ```
///
/// Repository内部でストレージ選択を自動実行:
/// - 検索系操作: SQLite
/// - 保存系操作: Automerge → SQLiteに同期
#[async_trait]
pub trait TaskListRepositoryTrait:
    ProjectRepository<TaskList, TaskListId> + ProjectPatchable<TaskList, TaskListId> + Send + Sync
{
    // ProjectRepositoryのfind_allでプロジェクト内の全タスクリストを取得可能
}
