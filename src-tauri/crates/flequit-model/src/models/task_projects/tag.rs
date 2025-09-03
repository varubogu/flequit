//! タグ管理モデル
//!
//! このモジュールはタスクやプロジェクトの分類・ラベル付けに使用するタグを定義します。
//!
//! ## 概要
//!
//! `Tag`構造体は、タスクやプロジェクトに付与するラベル情報を管理します。
//! カテゴリ分けや検索性の向上、視覚的な識別に活用されます。

use crate::models::ModelConverter;
use super::task_tag::TaskTag;
use super::subtask_tag::SubTaskTag;
use crate::types::id_types::TagId;
use async_trait::async_trait;
use chrono::{DateTime, Utc};
use partially::Partial;
use serde::{Deserialize, Serialize};


/// タグ情報を表現する構造体
///
/// タスクやプロジェクトの分類・ラベル付けに使用されるタグの情報を管理します。
/// 色による視覚的な区別や表示順序の制御をサポートします。
///
/// # フィールド
///
/// * `id` - タグの一意識別子
/// * `name` - タグ名（表示名、検索キー）
/// * `color` - タグの色（16進数カラーコード等、UI表示用）
/// * `order_index` - 表示順序（昇順ソート用、Svelteフロントエンド対応）
/// * `created_at` - タグ作成日時
/// * `updated_at` - 最終更新日時
///
/// # 設計思想
///
/// - **多目的利用**: タスク、プロジェクト等、複数エンティティでの共用
/// - **視覚化重視**: 色情報による直感的な識別
/// - **フロントエンド最適化**: Svelte UIでの表示・操作に対応
///
/// # 使用例
///
/// ```rust,no_run
/// # use chrono::Utc;
/// # use flequit_model::models::tag::Tag;
/// # use flequit_model::types::id_types::TagId;
///
/// let urgent_tag = Tag {
///     id: TagId::new(),
///     name: "緊急".to_string(),
///     color: Some("#ff4444".to_string()),
///     order_index: Some(1),
///     created_at: Utc::now(),
///     updated_at: Utc::now(),
/// };
///
/// let feature_tag = Tag {
///     id: TagId::new(),
///     name: "新機能".to_string(),
///     color: Some("#4444ff".to_string()),
///     order_index: Some(2),
///     created_at: Utc::now(),
///     updated_at: Utc::now(),
/// };
/// ```
///
/// # 関連機能
///
/// - タスクへの複数タグ付与
/// - タグによるフィルタリング・検索
/// - タグ使用頻度の統計
/// - 人気タグランキング
#[derive(Debug, Clone, Serialize, Deserialize, Partial)]
#[partially(derive(Debug, Clone, Serialize, Deserialize, Default))]
pub struct Tag {
    /// タグの一意識別子
    #[partially(omit)] // IDは更新対象外
    pub id: TagId,
    /// タグ名（表示名、検索キー）
    pub name: String,
    /// タグの色（16進数カラーコード等、UI表示用）
    pub color: Option<String>,
    /// 表示順序（昇順ソート用、Svelteフロントエンド対応）
    pub order_index: Option<i32>, // Svelte側に合わせて追加
    /// タグ作成日時
    pub created_at: DateTime<Utc>,
    /// 最終更新日時
    pub updated_at: DateTime<Utc>,
}

/// タグとその関連情報を含むTree構造体
///
/// タグ情報に加えて、そのタグが付与されたタスクや
/// サブタスクの関連付け情報を階層構造で管理します。
/// フロントエンドでタグベースの分類表示や統計情報を表示する際に使用されます。
///
/// # フィールド
///
/// * `id` - タグの一意識別子
/// * `name` - タグ名（表示名、検索キー）
/// * `color` - タグの色（16進数カラーコード等、UI表示用）
/// * `order_index` - 表示順序（昇順ソート用）
/// * `created_at` - タグ作成日時
/// * `updated_at` - 最終更新日時
/// * `task_tags` - このタグが付与されたタスクとの関連付け情報一覧
/// * `subtask_tags` - このタグが付与されたサブタスクとの関連付け情報一覧
///
/// # 使用例
///
/// ```rust,no_run
/// # use chrono::Utc;
/// # use flequit_model::models::tag::TagTree;
/// # use flequit_model::models::tagging::{TaskTag, SubtaskTag};
/// # use flequit_model::types::id_types::{TagId, TaskId, SubTaskId};
///
/// let tag_tree = TagTree {
///     id: TagId::new(),
///     name: "緊急".to_string(),
///     color: Some("#ff4444".to_string()),
///     order_index: Some(1),
///     created_at: Utc::now(),
///     updated_at: Utc::now(),
///     task_tags: vec![
///         TaskTag {
///             task_id: TaskId::from("task_123".to_string()),
///             tag_id: TagId::from("tag_456".to_string()),
///             created_at: Utc::now(),
///         }
///     ],
///     subtask_tags: vec![],
/// };
/// ```
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TagTree {
    /// タグの一意識別子
    pub id: TagId,
    /// タグ名（表示名、検索キー）
    pub name: String,
    /// タグの色（16進数カラーコード等、UI表示用）
    pub color: Option<String>,
    /// 表示順序（昇順ソート用、Svelteフロントエンド対応）
    pub order_index: Option<i32>,
    /// タグ作成日時
    pub created_at: DateTime<Utc>,
    /// 最終更新日時
    pub updated_at: DateTime<Utc>,
    /// このタグが付与されたタスクとの関連付け情報一覧
    pub task_tags: Vec<TaskTag>,
    /// このタグが付与されたサブタスクとの関連付け情報一覧
    pub subtask_tags: Vec<SubTaskTag>,
}

#[async_trait]
impl ModelConverter<Tag> for TagTree {
    async fn to_model(&self) -> Result<Tag, String> {
        // TagTreeからTag基本構造体に変換（関連データのtask_tags, subtask_tagsは除く）
        Ok(Tag {
            id: self.id.clone(),
            name: self.name.clone(),
            color: self.color.clone(),
            order_index: self.order_index,
            created_at: self.created_at,
            updated_at: self.updated_at,
        })
    }
}
