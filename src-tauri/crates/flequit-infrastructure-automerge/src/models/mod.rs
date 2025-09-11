//! AutoMergeモデル定義
//!
//! SQLiteテーブル構造に対応したAutoMerge用のデータ構造を定義
//! 各テーブルが独立したモジュールとして実装され、低結合・高凝集を実現

pub mod task_projects;
pub mod accounts;
pub mod users;
pub mod search;
pub mod initialized_data;

// Re-export individual modules for backward compatibility
pub use task_projects::{
    date_condition, member, project, subtask, subtask_tag, tag, task, task_list, task_tag,
    task_assignments, subtask_assignments, task_recurrence, subtask_recurrence,
    recurrence_rule, recurrence_adjustment, recurrence_detail, recurrence_date_condition,
    recurrence_weekday_condition, recurrence_days_of_week, weekday_condition,
};
pub use accounts::account;
pub use users::user;

// 再エクスポートして使いやすくする
pub use task_projects::{
    project::*, subtask::*, subtask_tag::*, tag::*, task::*, task_list::*, task_tag::*,
};