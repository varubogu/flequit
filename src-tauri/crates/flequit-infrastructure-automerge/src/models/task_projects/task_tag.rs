//! TaskTag AutoMergeモデル
//!
//! SQLite task_tagsテーブルと同じ構造を持つAutoMerge用データ構造

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

/// TaskTag AutoMergeモデル
/// SQLite task_tags テーブルに対応（多対多関係テーブル）
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct AutoMergeTaskTag {
    /// タスクID
    pub task_id: String,
    /// タグID
    pub tag_id: String,
    /// 作成日時
    pub created_at: DateTime<Utc>,
}

impl AutoMergeTaskTag {
    /// 新しいタスクタグ関連を作成
    pub fn new(task_id: String, tag_id: String) -> Self {
        Self {
            task_id,
            tag_id,
            created_at: Utc::now(),
        }
    }

    /// タスクIDでフィルタリング用のヘルパー
    pub fn belongs_to_task(&self, task_id: &str) -> bool {
        self.task_id == task_id
    }

    /// タグIDでフィルタリング用のヘルパー
    pub fn has_tag(&self, tag_id: &str) -> bool {
        self.tag_id == tag_id
    }

    /// 複合キーでの一致チェック
    pub fn matches(&self, task_id: &str, tag_id: &str) -> bool {
        self.task_id == task_id && self.tag_id == tag_id
    }
}

/// タスクタグ関連のコレクション操作ヘルパー
pub struct AutoMergeTaskTagCollection;

impl AutoMergeTaskTagCollection {
    /// 指定されたタスクに関連付けられたすべてのタグIDを取得
    pub fn get_tags_for_task(task_tags: &[AutoMergeTaskTag], task_id: &str) -> Vec<String> {
        task_tags
            .iter()
            .filter(|tt| tt.belongs_to_task(task_id))
            .map(|tt| tt.tag_id.clone())
            .collect()
    }

    /// 指定されたタグに関連付けられたすべてのタスクIDを取得
    pub fn get_tasks_for_tag(task_tags: &[AutoMergeTaskTag], tag_id: &str) -> Vec<String> {
        task_tags
            .iter()
            .filter(|tt| tt.has_tag(tag_id))
            .map(|tt| tt.task_id.clone())
            .collect()
    }

    /// タスクとタグの関連を追加（重複チェック付き）
    pub fn add_task_tag(
        task_tags: &mut Vec<AutoMergeTaskTag>,
        task_id: String,
        tag_id: String,
    ) -> bool {
        // 既に存在するかチェック
        if task_tags.iter().any(|tt| tt.matches(&task_id, &tag_id)) {
            return false; // 既に存在する
        }

        task_tags.push(AutoMergeTaskTag::new(task_id, tag_id));
        true
    }

    /// タスクとタグの関連を削除
    pub fn remove_task_tag(
        task_tags: &mut Vec<AutoMergeTaskTag>,
        task_id: &str,
        tag_id: &str,
    ) -> bool {
        let initial_len = task_tags.len();
        task_tags.retain(|tt| !tt.matches(task_id, tag_id));
        task_tags.len() != initial_len
    }

    /// 指定されたタスクのすべてのタグ関連を削除
    pub fn remove_all_tags_for_task(task_tags: &mut Vec<AutoMergeTaskTag>, task_id: &str) -> usize {
        let initial_len = task_tags.len();
        task_tags.retain(|tt| !tt.belongs_to_task(task_id));
        initial_len - task_tags.len()
    }

    /// 指定されたタグのすべてのタスク関連を削除
    pub fn remove_all_tasks_for_tag(task_tags: &mut Vec<AutoMergeTaskTag>, tag_id: &str) -> usize {
        let initial_len = task_tags.len();
        task_tags.retain(|tt| !tt.has_tag(tag_id));
        initial_len - task_tags.len()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_new_task_tag() {
        let task_tag = AutoMergeTaskTag::new("task-1".to_string(), "tag-1".to_string());

        assert_eq!(task_tag.task_id, "task-1");
        assert_eq!(task_tag.tag_id, "tag-1");
        assert!(task_tag.belongs_to_task("task-1"));
        assert!(task_tag.has_tag("tag-1"));
        assert!(task_tag.matches("task-1", "tag-1"));
        assert!(!task_tag.matches("task-2", "tag-1"));
    }

    #[test]
    fn test_collection_operations() {
        let mut task_tags = vec![
            AutoMergeTaskTag::new("task-1".to_string(), "tag-1".to_string()),
            AutoMergeTaskTag::new("task-1".to_string(), "tag-2".to_string()),
            AutoMergeTaskTag::new("task-2".to_string(), "tag-1".to_string()),
        ];

        // タスクのタグを取得
        let task_1_tags = AutoMergeTaskTagCollection::get_tags_for_task(&task_tags, "task-1");
        assert_eq!(task_1_tags.len(), 2);
        assert!(task_1_tags.contains(&"tag-1".to_string()));
        assert!(task_1_tags.contains(&"tag-2".to_string()));

        // タグのタスクを取得
        let tag_1_tasks = AutoMergeTaskTagCollection::get_tasks_for_tag(&task_tags, "tag-1");
        assert_eq!(tag_1_tasks.len(), 2);
        assert!(tag_1_tasks.contains(&"task-1".to_string()));
        assert!(tag_1_tasks.contains(&"task-2".to_string()));

        // 新しい関連を追加
        let added = AutoMergeTaskTagCollection::add_task_tag(
            &mut task_tags,
            "task-3".to_string(),
            "tag-1".to_string(),
        );
        assert!(added);
        assert_eq!(task_tags.len(), 4);

        // 重複追加（失敗）
        let not_added = AutoMergeTaskTagCollection::add_task_tag(
            &mut task_tags,
            "task-1".to_string(),
            "tag-1".to_string(),
        );
        assert!(!not_added);
        assert_eq!(task_tags.len(), 4);

        // 関連を削除
        let removed =
            AutoMergeTaskTagCollection::remove_task_tag(&mut task_tags, "task-1", "tag-1");
        assert!(removed);
        assert_eq!(task_tags.len(), 3);

        // タスクのすべてのタグ関連を削除
        let removed_count =
            AutoMergeTaskTagCollection::remove_all_tags_for_task(&mut task_tags, "task-1");
        assert_eq!(removed_count, 1); // tag-2が削除された
        assert_eq!(task_tags.len(), 2);
    }
}
