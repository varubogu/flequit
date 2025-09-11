//! アプリケーション全体で利用される型定義を管理するモジュール。
//!
//! このモジュールは、日付時刻、プロジェクト、タスクなど、
//! ドメイン固有の型をサブモジュールに分割して整理します。

/// 日付とカレンダーに関連する型定義
pub mod datetime_calendar_types;
pub mod id_types;
/// プロジェクトに関連する型定義
pub mod project_types;
/// タスクに関連する型定義
pub mod task_types;
