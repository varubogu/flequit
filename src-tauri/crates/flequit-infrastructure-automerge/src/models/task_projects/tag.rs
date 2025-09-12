//! Tag AutoMergeモデル
//!
//! SQLite tagsテーブルと同じ構造を持つAutoMerge用データ構造

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

/// Tag AutoMergeモデル
/// SQLite tags テーブルに対応
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct AutoMergeTag {
    /// タグの一意識別子
    pub id: String,
    /// 所属プロジェクトID
    pub project_id: String,
    /// タグ名
    pub name: String,
    /// タグ説明
    pub description: Option<String>,
    /// UI表示用のカラーコード
    pub color: Option<String>,
    /// 表示順序
    pub order_index: i32,
    /// アーカイブ状態フラグ
    pub is_archived: bool,
    /// 作成日時
    pub created_at: DateTime<Utc>,
    /// 更新日時
    pub updated_at: DateTime<Utc>,
}

impl AutoMergeTag {
    /// 新しいタグを作成
    pub fn new(
        id: String,
        project_id: String,
        name: String,
        description: Option<String>,
        color: Option<String>,
        order_index: i32,
    ) -> Self {
        let now = Utc::now();
        Self {
            id,
            project_id,
            name,
            description,
            color,
            order_index,
            is_archived: false,
            created_at: now,
            updated_at: now,
        }
    }

    /// タグ情報を更新
    pub fn update(
        &mut self,
        name: Option<String>,
        description: Option<Option<String>>,
        color: Option<Option<String>>,
        order_index: Option<i32>,
        is_archived: Option<bool>,
    ) {
        if let Some(name) = name {
            self.name = name;
        }
        if let Some(description) = description {
            self.description = description;
        }
        if let Some(color) = color {
            self.color = color;
        }
        if let Some(order_index) = order_index {
            self.order_index = order_index;
        }
        if let Some(is_archived) = is_archived {
            self.is_archived = is_archived;
        }
        self.updated_at = Utc::now();
    }

    /// プロジェクトIDでフィルタリング用のヘルパー
    pub fn belongs_to_project(&self, project_id: &str) -> bool {
        self.project_id == project_id
    }

    /// アーカイブされていないタグかチェック
    pub fn is_active(&self) -> bool {
        !self.is_archived
    }

    /// タグ名での検索用ヘルパー
    pub fn matches_name(&self, name: &str) -> bool {
        self.name.to_lowercase().contains(&name.to_lowercase())
    }
}

impl Default for AutoMergeTag {
    fn default() -> Self {
        Self::new(String::new(), String::new(), String::new(), None, None, 0)
    }
}

/// タグコレクション操作ヘルパー
pub struct AutoMergeTagCollection;

impl AutoMergeTagCollection {
    /// プロジェクト内のアクティブなタグを取得
    pub fn get_active_tags_for_project<'a>(
        tags: &'a [AutoMergeTag],
        project_id: &str,
    ) -> Vec<&'a AutoMergeTag> {
        tags.iter()
            .filter(|tag| tag.belongs_to_project(project_id) && tag.is_active())
            .collect()
    }

    /// タグ名で検索
    pub fn search_by_name<'a>(tags: &'a [AutoMergeTag], name: &str) -> Vec<&'a AutoMergeTag> {
        if name.is_empty() {
            return tags.iter().collect();
        }

        tags.iter().filter(|tag| tag.matches_name(name)).collect()
    }

    /// 表示順序でソート
    pub fn sort_by_order_index(mut tags: Vec<AutoMergeTag>) -> Vec<AutoMergeTag> {
        tags.sort_by(|a, b| a.order_index.cmp(&b.order_index));
        tags
    }

    /// タグ名の重複チェック（プロジェクト内）
    pub fn has_duplicate_name_in_project(
        tags: &[AutoMergeTag],
        project_id: &str,
        name: &str,
        exclude_id: Option<&str>,
    ) -> bool {
        tags.iter().any(|tag| {
            tag.belongs_to_project(project_id)
                && tag.name.to_lowercase() == name.to_lowercase()
                && (exclude_id.is_none() || Some(tag.id.as_str()) != exclude_id)
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_new_tag() {
        let tag = AutoMergeTag::new(
            "tag-1".to_string(),
            "project-1".to_string(),
            "Test Tag".to_string(),
            Some("Test Description".to_string()),
            Some("#FF0000".to_string()),
            0,
        );

        assert_eq!(tag.id, "tag-1");
        assert_eq!(tag.project_id, "project-1");
        assert_eq!(tag.name, "Test Tag");
        assert!(!tag.is_archived);
        assert!(tag.is_active());
        assert!(tag.belongs_to_project("project-1"));
        assert!(!tag.belongs_to_project("project-2"));
    }

    #[test]
    fn test_update_tag() {
        let mut tag = AutoMergeTag::default();
        let original_updated_at = tag.updated_at;

        // 少し時間を空ける
        std::thread::sleep(std::time::Duration::from_millis(1));

        tag.update(
            Some("Updated Name".to_string()),
            Some(Some("Updated Description".to_string())),
            Some(Some("#00FF00".to_string())),
            Some(5),
            Some(true),
        );

        assert_eq!(tag.name, "Updated Name");
        assert_eq!(tag.description, Some("Updated Description".to_string()));
        assert_eq!(tag.color, Some("#00FF00".to_string()));
        assert_eq!(tag.order_index, 5);
        assert!(tag.is_archived);
        assert!(!tag.is_active());
        assert!(tag.updated_at > original_updated_at);
    }

    #[test]
    fn test_matches_name() {
        let tag = AutoMergeTag::new(
            "tag-1".to_string(),
            "project-1".to_string(),
            "Important Task".to_string(),
            None,
            None,
            0,
        );

        assert!(tag.matches_name("important"));
        assert!(tag.matches_name("TASK"));
        assert!(tag.matches_name("imp"));
        assert!(!tag.matches_name("xyz"));
    }

    #[test]
    fn test_collection_operations() {
        let tags = vec![
            AutoMergeTag::new(
                "tag-1".to_string(),
                "project-1".to_string(),
                "Important".to_string(),
                None,
                None,
                2,
            ),
            AutoMergeTag::new(
                "tag-2".to_string(),
                "project-1".to_string(),
                "Urgent".to_string(),
                None,
                None,
                1,
            ),
            AutoMergeTag::new(
                "tag-3".to_string(),
                "project-2".to_string(),
                "Normal".to_string(),
                None,
                None,
                0,
            ),
        ];

        // プロジェクト別フィルタリング
        let project_1_tags =
            AutoMergeTagCollection::get_active_tags_for_project(&tags, "project-1");
        assert_eq!(project_1_tags.len(), 2);

        // 名前検索
        let urgent_tags = AutoMergeTagCollection::search_by_name(&tags, "urgent");
        assert_eq!(urgent_tags.len(), 1);
        assert_eq!(urgent_tags[0].name, "Urgent");

        // ソート
        let project_1_tags_vec: Vec<AutoMergeTag> = project_1_tags.into_iter().cloned().collect();
        let sorted_tags = AutoMergeTagCollection::sort_by_order_index(project_1_tags_vec);
        assert_eq!(sorted_tags[0].name, "Urgent"); // order_index = 1
        assert_eq!(sorted_tags[1].name, "Important"); // order_index = 2

        // 重複チェック
        let has_duplicate = AutoMergeTagCollection::has_duplicate_name_in_project(
            &tags,
            "project-1",
            "important",
            None,
        );
        assert!(has_duplicate);

        let has_duplicate_exclude = AutoMergeTagCollection::has_duplicate_name_in_project(
            &tags,
            "project-1",
            "important",
            Some("tag-1"),
        );
        assert!(!has_duplicate_exclude);
    }
}
