use async_trait::async_trait;

pub mod account;
pub mod initialize;
pub mod project;
pub mod setting;
pub mod subtask;
pub mod tag;
pub mod task;
pub mod task_list;
pub mod user;

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
///         Ok(Task {
///             id: self.id.clone(),
///             title: self.title.clone(),
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
