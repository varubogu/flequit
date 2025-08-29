//! SubTaskTag AutoMergeモデル
//! 
//! SQLite subtask_tagsテーブルと同じ構造を持つAutoMerge用データ構造

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

/// SubTaskTag AutoMergeモデル
/// SQLite subtask_tags テーブルに対応（多対多関係テーブル）
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct AutoMergeSubTaskTag {
    /// サブタスクID
    pub subtask_id: String,
    /// タグID
    pub tag_id: String,
    /// 作成日時
    pub created_at: DateTime<Utc>,
}

impl AutoMergeSubTaskTag {
    /// 新しいサブタスクタグ関連を作成
    pub fn new(subtask_id: String, tag_id: String) -> Self {
        Self {
            subtask_id,
            tag_id,
            created_at: Utc::now(),
        }
    }

    /// サブタスクIDでフィルタリング用のヘルパー
    pub fn belongs_to_subtask(&self, subtask_id: &str) -> bool {
        self.subtask_id == subtask_id
    }

    /// タグIDでフィルタリング用のヘルパー
    pub fn has_tag(&self, tag_id: &str) -> bool {
        self.tag_id == tag_id
    }

    /// 複合キーでの一致チェック
    pub fn matches(&self, subtask_id: &str, tag_id: &str) -> bool {
        self.subtask_id == subtask_id && self.tag_id == tag_id
    }
}

/// サブタスクタグ関連のコレクション操作ヘルパー
pub struct AutoMergeSubTaskTagCollection;

impl AutoMergeSubTaskTagCollection {
    /// 指定されたサブタスクに関連付けられたすべてのタグIDを取得
    pub fn get_tags_for_subtask(subtask_tags: &[AutoMergeSubTaskTag], subtask_id: &str) -> Vec<String> {
        subtask_tags
            .iter()
            .filter(|stt| stt.belongs_to_subtask(subtask_id))
            .map(|stt| stt.tag_id.clone())
            .collect()
    }

    /// 指定されたタグに関連付けられたすべてのサブタスクIDを取得
    pub fn get_subtasks_for_tag(subtask_tags: &[AutoMergeSubTaskTag], tag_id: &str) -> Vec<String> {
        subtask_tags
            .iter()
            .filter(|stt| stt.has_tag(tag_id))
            .map(|stt| stt.subtask_id.clone())
            .collect()
    }

    /// サブタスクとタグの関連を追加（重複チェック付き）
    pub fn add_subtask_tag(
        subtask_tags: &mut Vec<AutoMergeSubTaskTag>,
        subtask_id: String,
        tag_id: String,
    ) -> bool {
        // 既に存在するかチェック
        if subtask_tags.iter().any(|stt| stt.matches(&subtask_id, &tag_id)) {
            return false; // 既に存在する
        }

        subtask_tags.push(AutoMergeSubTaskTag::new(subtask_id, tag_id));
        true
    }

    /// サブタスクとタグの関連を削除
    pub fn remove_subtask_tag(
        subtask_tags: &mut Vec<AutoMergeSubTaskTag>,
        subtask_id: &str,
        tag_id: &str,
    ) -> bool {
        let initial_len = subtask_tags.len();
        subtask_tags.retain(|stt| !stt.matches(subtask_id, tag_id));
        subtask_tags.len() != initial_len
    }

    /// 指定されたサブタスクのすべてのタグ関連を削除
    pub fn remove_all_tags_for_subtask(
        subtask_tags: &mut Vec<AutoMergeSubTaskTag>,
        subtask_id: &str,
    ) -> usize {
        let initial_len = subtask_tags.len();
        subtask_tags.retain(|stt| !stt.belongs_to_subtask(subtask_id));
        initial_len - subtask_tags.len()
    }

    /// 指定されたタグのすべてのサブタスク関連を削除
    pub fn remove_all_subtasks_for_tag(
        subtask_tags: &mut Vec<AutoMergeSubTaskTag>,
        tag_id: &str,
    ) -> usize {
        let initial_len = subtask_tags.len();
        subtask_tags.retain(|stt| !stt.has_tag(tag_id));
        initial_len - subtask_tags.len()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_new_subtask_tag() {
        let subtask_tag = AutoMergeSubTaskTag::new("subtask-1".to_string(), "tag-1".to_string());
        
        assert_eq!(subtask_tag.subtask_id, "subtask-1");
        assert_eq!(subtask_tag.tag_id, "tag-1");
        assert!(subtask_tag.belongs_to_subtask("subtask-1"));
        assert!(subtask_tag.has_tag("tag-1"));
        assert!(subtask_tag.matches("subtask-1", "tag-1"));
        assert!(!subtask_tag.matches("subtask-2", "tag-1"));
    }

    #[test]
    fn test_collection_operations() {
        let mut subtask_tags = vec![
            AutoMergeSubTaskTag::new("subtask-1".to_string(), "tag-1".to_string()),
            AutoMergeSubTaskTag::new("subtask-1".to_string(), "tag-2".to_string()),
            AutoMergeSubTaskTag::new("subtask-2".to_string(), "tag-1".to_string()),
        ];

        // サブタスクのタグを取得
        let subtask_1_tags = AutoMergeSubTaskTagCollection::get_tags_for_subtask(&subtask_tags, "subtask-1");
        assert_eq!(subtask_1_tags.len(), 2);
        assert!(subtask_1_tags.contains(&"tag-1".to_string()));
        assert!(subtask_1_tags.contains(&"tag-2".to_string()));

        // タグのサブタスクを取得
        let tag_1_subtasks = AutoMergeSubTaskTagCollection::get_subtasks_for_tag(&subtask_tags, "tag-1");
        assert_eq!(tag_1_subtasks.len(), 2);
        assert!(tag_1_subtasks.contains(&"subtask-1".to_string()));
        assert!(tag_1_subtasks.contains(&"subtask-2".to_string()));

        // 新しい関連を追加
        let added = AutoMergeSubTaskTagCollection::add_subtask_tag(
            &mut subtask_tags,
            "subtask-3".to_string(),
            "tag-1".to_string(),
        );
        assert!(added);
        assert_eq!(subtask_tags.len(), 4);

        // 重複追加（失敗）
        let not_added = AutoMergeSubTaskTagCollection::add_subtask_tag(
            &mut subtask_tags,
            "subtask-1".to_string(),
            "tag-1".to_string(),
        );
        assert!(!not_added);
        assert_eq!(subtask_tags.len(), 4);

        // 関連を削除
        let removed = AutoMergeSubTaskTagCollection::remove_subtask_tag(&mut subtask_tags, "subtask-1", "tag-1");
        assert!(removed);
        assert_eq!(subtask_tags.len(), 3);

        // サブタスクのすべてのタグ関連を削除
        let removed_count = AutoMergeSubTaskTagCollection::remove_all_tags_for_subtask(&mut subtask_tags, "subtask-1");
        assert_eq!(removed_count, 1); // tag-2が削除された
        assert_eq!(subtask_tags.len(), 2);
    }
}