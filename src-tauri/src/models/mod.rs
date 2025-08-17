//! データモデル層
//!
//! このモジュールは、Flequitアプリケーションで使用される全てのデータ構造体を定義します。
//! モデルは主に2つのカテゴリに分類されます：
//!
//! ## 構成
//!
//! ### 内部ドメインモデル（直下のモジュール）
//!
//! アプリケーション内部で使用される、型安全性を重視したデータ構造体群：
//!
//! - [`account`] - アカウント情報（認証プロバイダ、アクティブ状態など）
//! - [`user`] - ユーザー情報（名前、メール、アバターなど）
//! - [`project`] - プロジェクト管理（プロジェクト、メンバー、ツリー構造）
//! - [`task`] - タスク管理（基本タスク、サブタスク付きタスク）
//! - [`sub_task`] - サブタスク（タスクの細分化）
//! - [`task_list`] - タスクリスト（タスクの分類・整理）
//! - [`tag`] - タグ（ラベリング、カテゴライズ）
//! - [`setting`] - 設定情報（アプリケーション設定、ローカル設定）
//! - [`datetime_calendar`] - 日時・カレンダー関連（繰り返しルール、期間など）
//! - [`datetime_format`] - 日時フォーマット（表示形式、ロケール対応）
//!
//! ### Tauriコマンド用モデル（commandサブモジュール）
//!
//! - [`command`] - フロントエンド ⇔ バックエンド間のデータ交換用構造体
//!
//! ## 設計原則
//!
//! ### 型安全性
//!
//! - **日時フィールド**: 内部モデルは`DateTime<Utc>`を使用し、タイムゾーンの問題を防ぐ
//! - **Enum使用**: 文字列定数ではなく、型安全なenumを積極的に活用
//! - **Option型**: null値を明示的にOption型で表現
//!
//! ### シリアライゼーション対応
//!
//! - **Serde対応**: 全ての構造体でSerialize/Deserializeを実装
//! - **フロントエンド互換**: Svelte側のインターフェースと整合性を保つ
//!
//! ### データ整合性
//!
//! - **ID管理**: UUID v4形式の文字列IDを使用
//! - **タイムスタンプ**: 作成日時・更新日時を必須フィールドとして管理
//! - **外部キー**: 関連エンティティとの結合用IDフィールドを提供
//!
//! ## 使用例
//!
//! ```rust
//! use crate::models::{project::Project, task::Task};
//! use chrono::Utc;
//!
//! // 内部ドメインモデルの使用例
//! let project = Project {
//!     id: "proj_123".to_string(),
//!     name: "新プロジェクト".to_string(),
//!     description: Some("重要なプロジェクト".to_string()),
//!     created_at: Utc::now(),
//!     updated_at: Utc::now(),
//!     // その他のフィールド...
//! };
//! ```
//!
//! ## 関連モジュール
//!
//! - [`crate::types`] - 型定義とenum（TaskStatus、ProjectStatusなど）
//! - [`crate::services`] - ビジネスロジック（モデルを操作するサービス層）
//! - [`crate::repositories`] - データアクセス層（モデルの永続化）
//! - [`crate::facades`] - フロントエンドインターフェース（コマンド用モデルを使用）

pub mod account;
pub mod command;
pub mod datetime_calendar;
pub mod datetime_format;
pub mod project;
pub mod setting;
pub mod sqlite;
pub mod subtask;
pub mod tag;
pub mod task;
pub mod task_list;
pub mod user;

pub trait CommandModelConverter<T> {
    async fn to_command_model(&self) -> Result<T, String>;
}
