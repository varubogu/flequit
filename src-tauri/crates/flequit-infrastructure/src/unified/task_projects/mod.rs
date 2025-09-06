//! タスク・プロジェクト管理統合リポジトリ
//!
//! プロジェクト、タスク、サブタスク、タグ、メンバー、アサイン、繰り返し設定など
//! タスク管理の核心機能を提供する統合リポジトリ群。

// 基本エンティティ
pub mod project;
pub mod task;
pub mod subtask;
pub mod task_list;
pub mod tag;
pub mod member;

// 関連テーブル
pub mod task_tag;
pub mod subtask_tag;
pub mod task_assignments;
pub mod subtask_assignments;

// 公開エクスポート
pub use project::ProjectUnifiedRepository;
pub use task::TaskUnifiedRepository;
pub use subtask::SubTaskUnifiedRepository;
pub use task_list::TaskListUnifiedRepository;
pub use tag::TagUnifiedRepository;