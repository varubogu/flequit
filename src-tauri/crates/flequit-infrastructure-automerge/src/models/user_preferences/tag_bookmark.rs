//! TagBookmark AutoMergeモデル
//!
//! タグブックマーク（サイドバーのピン留め）用のAutoMerge構造体

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

/// TagBookmark AutoMergeモデル
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct AutoMergeTagBookmark {
    /// ブックマークの一意識別子
    pub id: String,
    /// ユーザーID（現在は固定値 "local_user"）
    pub user_id: String,
    /// タグの所属プロジェクトID
    pub project_id: String,
    /// ブックマークするタグID
    pub tag_id: String,
    /// サイドバー内での表示順序
    pub order_index: i32,
    /// ブックマーク追加日時
    pub created_at: DateTime<Utc>,
    /// ブックマーク更新日時
    pub updated_at: DateTime<Utc>,
}

impl AutoMergeTagBookmark {
    /// 新しいブックマークを作成
    pub fn new(
        id: String,
        user_id: String,
        project_id: String,
        tag_id: String,
        order_index: i32,
    ) -> Self {
        let now = Utc::now();
        Self {
            id,
            user_id,
            project_id,
            tag_id,
            order_index,
            created_at: now,
            updated_at: now,
        }
    }

    /// 表示順序を更新
    pub fn update_order_index(&mut self, order_index: i32) {
        self.order_index = order_index;
        self.updated_at = Utc::now();
    }

    /// プロジェクトIDでフィルタリング用のヘルパー
    pub fn belongs_to_project(&self, project_id: &str) -> bool {
        self.project_id == project_id
    }

    /// ユーザーIDでフィルタリング用のヘルパー
    pub fn belongs_to_user(&self, user_id: &str) -> bool {
        self.user_id == user_id
    }

    /// タグIDとの一致チェック
    pub fn is_for_tag(&self, tag_id: &str) -> bool {
        self.tag_id == tag_id
    }
}

impl Default for AutoMergeTagBookmark {
    fn default() -> Self {
        Self::new(
            String::new(),
            String::from("local_user"),
            String::new(),
            String::new(),
            0,
        )
    }
}

/// ブックマークコレクション操作ヘルパー
pub struct AutoMergeTagBookmarkCollection;

impl AutoMergeTagBookmarkCollection {
    /// ユーザーとプロジェクトでフィルタリング
    pub fn get_bookmarks_for_user_and_project<'a>(
        bookmarks: &'a [AutoMergeTagBookmark],
        user_id: &str,
        project_id: &str,
    ) -> Vec<&'a AutoMergeTagBookmark> {
        bookmarks
            .iter()
            .filter(|b| b.belongs_to_user(user_id) && b.belongs_to_project(project_id))
            .collect()
    }

    /// ユーザーの全ブックマークを取得
    pub fn get_bookmarks_for_user<'a>(
        bookmarks: &'a [AutoMergeTagBookmark],
        user_id: &str,
    ) -> Vec<&'a AutoMergeTagBookmark> {
        bookmarks
            .iter()
            .filter(|b| b.belongs_to_user(user_id))
            .collect()
    }

    /// 表示順序でソート
    pub fn sort_by_order_index(
        mut bookmarks: Vec<AutoMergeTagBookmark>,
    ) -> Vec<AutoMergeTagBookmark> {
        bookmarks.sort_by(|a, b| a.order_index.cmp(&b.order_index));
        bookmarks
    }

    /// ブックマーク済みかチェック
    pub fn is_bookmarked(
        bookmarks: &[AutoMergeTagBookmark],
        user_id: &str,
        project_id: &str,
        tag_id: &str,
    ) -> bool {
        bookmarks.iter().any(|b| {
            b.belongs_to_user(user_id) && b.belongs_to_project(project_id) && b.is_for_tag(tag_id)
        })
    }

    /// 最大order_indexを取得
    pub fn get_max_order_index(
        bookmarks: &[AutoMergeTagBookmark],
        user_id: &str,
        project_id: &str,
    ) -> i32 {
        bookmarks
            .iter()
            .filter(|b| b.belongs_to_user(user_id) && b.belongs_to_project(project_id))
            .map(|b| b.order_index)
            .max()
            .unwrap_or(-1)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_new_bookmark() {
        let bookmark = AutoMergeTagBookmark::new(
            "bookmark-1".to_string(),
            "local_user".to_string(),
            "project-1".to_string(),
            "tag-1".to_string(),
            0,
        );

        assert_eq!(bookmark.id, "bookmark-1");
        assert_eq!(bookmark.user_id, "local_user");
        assert_eq!(bookmark.project_id, "project-1");
        assert_eq!(bookmark.tag_id, "tag-1");
        assert_eq!(bookmark.order_index, 0);
    }

    #[test]
    fn test_update_order_index() {
        let mut bookmark = AutoMergeTagBookmark::default();
        let original_updated_at = bookmark.updated_at;

        std::thread::sleep(std::time::Duration::from_millis(1));

        bookmark.update_order_index(5);

        assert_eq!(bookmark.order_index, 5);
        assert!(bookmark.updated_at > original_updated_at);
    }

    #[test]
    fn test_collection_operations() {
        let bookmarks = vec![
            AutoMergeTagBookmark::new(
                "b1".to_string(),
                "user1".to_string(),
                "proj1".to_string(),
                "tag1".to_string(),
                2,
            ),
            AutoMergeTagBookmark::new(
                "b2".to_string(),
                "user1".to_string(),
                "proj1".to_string(),
                "tag2".to_string(),
                1,
            ),
            AutoMergeTagBookmark::new(
                "b3".to_string(),
                "user1".to_string(),
                "proj2".to_string(),
                "tag3".to_string(),
                0,
            ),
        ];

        // プロジェクト別フィルタリング
        let proj1_bookmarks = AutoMergeTagBookmarkCollection::get_bookmarks_for_user_and_project(
            &bookmarks, "user1", "proj1",
        );
        assert_eq!(proj1_bookmarks.len(), 2);

        // ソート
        let proj1_vec: Vec<AutoMergeTagBookmark> = proj1_bookmarks.into_iter().cloned().collect();
        let sorted = AutoMergeTagBookmarkCollection::sort_by_order_index(proj1_vec);
        assert_eq!(sorted[0].tag_id, "tag2"); // order_index = 1
        assert_eq!(sorted[1].tag_id, "tag1"); // order_index = 2

        // ブックマーク済みチェック
        let is_bookmarked =
            AutoMergeTagBookmarkCollection::is_bookmarked(&bookmarks, "user1", "proj1", "tag1");
        assert!(is_bookmarked);

        // 最大order_index取得
        let max_order =
            AutoMergeTagBookmarkCollection::get_max_order_index(&bookmarks, "user1", "proj1");
        assert_eq!(max_order, 2);
    }
}
