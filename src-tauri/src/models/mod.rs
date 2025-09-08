use async_trait::async_trait;

// 1構造体1ファイルに分割されたモジュール
pub mod account;
pub mod date_condition;
pub mod datetime_format;
pub mod datetime;
pub mod due_date_buttons;
pub mod individual;
pub mod initialize;
pub mod initialized_data;
pub mod member;
pub mod project;
pub mod project_search_request;
pub mod recurrence;
pub mod recurrence_adjustment;
pub mod recurrence_details;
pub mod recurrence_rule;
pub mod search;
pub mod setting_response;
pub mod settings;
pub mod subtask;
pub mod subtask_assignment;
pub mod subtask_recurrence;
pub mod subtask_tag;
pub mod tag;
pub mod tag_search_request;
pub mod task;
pub mod task_assignment;
pub mod task_list;
pub mod task_list_search_request;
pub mod task_recurrence;
pub mod task_search_request;
pub mod task_tag;
pub mod time_label;
pub mod user;
pub mod view_item;
pub mod weekday_condition;

/// 内部ドメインモデルからTauriコマンド用モデルへの変換を提供するトレイト
///
/// このトレイトは、Tauriのコマンド引数・戻り値で使用される構造体（String型の日時フィールドを持つ）と、
/// アプリケーション内部で使用される構造体（DateTime<Utc>型の日時フィールドを持つ）間の
/// 双方向変換を統一的に提供します。
///
/// # 目的
///
/// - **Tauriの制約対応**: JavaScript ⇔ Rust間でのシリアライゼーション問題を回避
/// - **型安全性**: 内部処理では型安全なDateTime<Utc>を使用
/// - **一貫性**: 全てのモデルで統一された変換インターフェースを提供
///
/// # 使用例
///
/// ```rust,no_run
/// # use serde::{Serialize, Deserialize};
/// # use chrono::{DateTime, Utc};
///
/// // CommandModelConverterトレイトの定義例
/// trait CommandModelConverter<T> {
///     async fn to_command_model(&self) -> Result<T, String>;
/// }
///
/// // Tauriコマンド用構造体
/// #[derive(Serialize, Deserialize)]
/// struct TaskCommand {
///     id: String,
///     title: String,
///     created_at: String,  // RFC3339フォーマット文字列
/// }
///
/// // 内部ドメインモデル
/// struct Task {
///     id: String,
///     title: String,
///     created_at: DateTime<Utc>,
/// }
///
/// impl CommandModelConverter<TaskCommand> for Task {
///     async fn to_command_model(&self) -> Result<TaskCommand, String> {
///         Ok(TaskCommand {
///             id: self.id.clone(),
///             title: self.title.clone(),
///             created_at: self.created_at.to_rfc3339(),
///         })
///     }
/// }
/// ```
///
/// # 型パラメータ
///
/// * `T` - 変換先のTauriコマンド用構造体
#[async_trait]
pub trait CommandModelConverter<T> {
    async fn to_command_model(&self) -> Result<T, String>;
}
