//! AutoMergeモデル定義
//!
//! SQLiteテーブル構造に対応したAutoMerge用のデータ構造を定義
//! 各テーブルが独立したモジュールとして実装され、低結合・高凝集を実現

pub mod accounts;
pub mod initialized_data;
pub mod search;
pub mod task_projects;
pub mod users;

// Re-export individual modules for backward compatibility
pub use accounts::account;
pub use task_projects::{
    date_condition, member, project, recurrence_adjustment, recurrence_date_condition,
    recurrence_days_of_week, recurrence_detail, recurrence_rule, recurrence_weekday_condition,
    subtask, subtask_assignments, subtask_recurrence, subtask_tag, tag, task, task_assignments,
    task_list, task_recurrence, task_tag, weekday_condition,
};
pub use users::user;

// 再エクスポートして使いやすくする
pub use task_projects::{
    project::*, subtask::*, subtask_tag::*, tag::*, task::*, task_list::*, task_tag::*,
};
