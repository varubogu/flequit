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
//! - [`recurrence`] - 日時・カレンダー関連（繰り返しルール、期間など）
//! - [`datetime_format`] - 日時フォーマット（表示形式、ロケール対応）
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
//! ```rust,no_run
//! # use flequit_model::models::task_projects::project::Project;
//! # use flequit_model::types::id_types::{ProjectId, UserId};
//! # use chrono::Utc;
//!
//! // 内部ドメインモデルの使用例
//! let project = Project {
//!     id: ProjectId::new(),
//!     name: "新プロジェクト".to_string(),
//!     description: Some("重要なプロジェクト".to_string()),
//!     color: Some("#4CAF50".to_string()),
//!     order_index: 1,
//!     is_archived: false,
//!     status: None,
//!     owner_id: Some(UserId::new()),
//!     created_at: Utc::now(),
//!     updated_at: Utc::now(),
//!     deleted: false,
//!     updated_by: UserId::new(),
//! };
//! ```
//!
//! ## 関連モジュール
//!
//! - [`crate::types`] - 型定義とenum（TaskStatus、ProjectStatusなど）
//! - [`crate::services`] - ビジネスロジック（モデルを操作するサービス層）
//! - [`crate::repositories`] - データアクセス層（モデルの永続化）
//! - [`crate::facades`] - フロントエンドインターフェース（コマンド用モデルを使用）

use async_trait::async_trait;

pub mod accounts;
pub mod initialized_data;
pub mod task_projects;
pub mod user_preferences;
pub mod users;

pub mod search;

/// 通常モデルとTree系モデル間の相互変換を定義するトレイト
///
/// 通常モデル（SQLite用のテーブル単位構造）とTree系モデル（フロントエンド用の階層構造）
/// の間で相互変換を行うためのトレイトです。
///
/// # 設計思想
///
/// - **from_tree_model**: Tree系モデル → 通常モデル（関連データは除く）
/// - 通常モデル → Tree系モデルの変換は、サービス層で関連データ取得と組み合わせて実現
///
/// # 使用例
///
/// ```rust,no_run
/// # use flequit_model::models::task_projects::project::{Project, ProjectTree};
/// # use flequit_model::models::ModelConverter;
/// # use flequit_model::types::id_types::{ProjectId, UserId};
/// # use chrono::Utc;
/// #
/// # // 例として使用する関数
/// # async fn example() -> Result<(), String> {
/// # // ProjectTree構造体を何らかの方法で作成
/// # let project_tree: ProjectTree = ProjectTree {
/// #     id: ProjectId::new(),
/// #     name: "サンプルプロジェクト".to_string(),
/// #     description: None,
/// #     color: None,
/// #     order_index: 1,
/// #     is_archived: false,
/// #     status: None,
/// #     owner_id: None,
/// #     created_at: Utc::now(),
/// #     updated_at: Utc::now(),
/// #     deleted: false,
/// #     updated_by: UserId::new(),
/// #     task_lists: vec![],
/// # };
/// #
/// // ProjectTree → Project への変換
/// let project: Project = project_tree.to_model().await?;
/// # Ok(())
/// # }
/// ```
/// Tree系モデルから通常モデルに変換するトレイト
#[async_trait]
pub trait ModelConverter<BaseModel> {
    /// Tree系モデルから通常モデルに変換（関連データは除く）
    async fn to_model(&self) -> Result<BaseModel, String>;
}
