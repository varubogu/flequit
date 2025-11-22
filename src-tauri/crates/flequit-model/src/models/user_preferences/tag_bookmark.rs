//! タグブックマーク管理モデル
//!
//! このモジュールは、サイドバーに固定表示するタグのブックマーク情報を管理します。
//!
//! ## 概要
//!
//! `TagBookmark`構造体は、ユーザーがサイドバーにピン留めしたタグの情報を管理します。
//! ユーザーの個人設定として扱われ、同じユーザーの複数端末間で同期されます。

use crate::types::id_types::{ProjectId, TagBookmarkId, TagId, UserId};
use chrono::{DateTime, Utc};
use partially::Partial;
use serde::{Deserialize, Serialize};

/// タグブックマーク情報を表現する構造体
///
/// サイドバーにピン留めされたタグの情報を管理します。
/// ユーザーごと、プロジェクトごとに管理され、表示順序もサポートします。
///
/// # フィールド
///
/// * `id` - ブックマークの一意識別子
/// * `user_id` - ユーザーID（現在は固定値 "local_user"）
/// * `project_id` - タグの所属プロジェクトID
/// * `tag_id` - ブックマークするタグID
/// * `order_index` - サイドバー内での表示順序
/// * `created_at` - ブックマーク追加日時
/// * `updated_at` - ブックマーク更新日時
///
/// # 設計思想
///
/// - **ユーザー設定**: タグ自体の属性ではなく、ユーザーの個人設定として管理
/// - **プロジェクトスコープ**: プロジェクトごとに異なるタグをブックマーク可能
/// - **並び順管理**: ドラッグ&ドロップによる並び替えをサポート
/// - **複数端末同期**: Automergeを使用して同じユーザーの他の端末と同期
///
/// # 使用例
///
/// ```rust,no_run
/// # use chrono::Utc;
/// # use flequit_model::models::user_preferences::tag_bookmark::TagBookmark;
/// # use flequit_model::types::id_types::{TagBookmarkId, UserId, ProjectId, TagId};
///
/// let bookmark = TagBookmark {
///     id: TagBookmarkId::new(),
///     user_id: UserId::from("local_user"),
///     project_id: ProjectId::from("project-uuid-1"),
///     tag_id: TagId::from("tag-uuid-1"),
///     order_index: 0,
///     created_at: Utc::now(),
///     updated_at: Utc::now(),
/// };
/// ```
///
/// # 関連機能
///
/// - ブックマークの追加・削除
/// - ドラッグ&ドロップによる並び替え
/// - プロジェクトごとのブックマーク一覧取得
/// - 複数端末間での同期
#[derive(Debug, Clone, Serialize, Deserialize, Partial)]
#[partially(derive(Debug, Clone, Serialize, Deserialize, Default))]
pub struct TagBookmark {
    /// ブックマークの一意識別子
    #[partially(omit)] // IDは更新対象外
    pub id: TagBookmarkId,
    /// ユーザーID（現在は固定値 "local_user"）
    pub user_id: UserId,
    /// タグの所属プロジェクトID
    pub project_id: ProjectId,
    /// ブックマークするタグID
    pub tag_id: TagId,
    /// サイドバー内での表示順序
    pub order_index: i32,
    /// ブックマーク追加日時
    pub created_at: DateTime<Utc>,
    /// ブックマーク更新日時
    pub updated_at: DateTime<Utc>,
}
