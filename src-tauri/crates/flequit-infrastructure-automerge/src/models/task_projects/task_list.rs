//! TaskList AutoMergeモデル
//!
//! SQLite task_listsテーブルと同じ構造を持つAutoMerge用データ構造

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

/// TaskList AutoMergeモデル
/// SQLite task_lists テーブルに対応
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct AutoMergeTaskList {
    /// タスクリストの一意識別子
    pub id: String,
    /// 所属プロジェクトID
    pub project_id: String,
    /// タスクリスト名
    pub name: String,
    /// タスクリスト説明
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

impl AutoMergeTaskList {
    /// 新しいタスクリストを作成
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

    /// タスクリスト情報を更新
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

    /// アーカイブされていないタスクリストかチェック
    pub fn is_active(&self) -> bool {
        !self.is_archived
    }
}

impl Default for AutoMergeTaskList {
    fn default() -> Self {
        Self::new(String::new(), String::new(), String::new(), None, None, 0)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_new_task_list() {
        let task_list = AutoMergeTaskList::new(
            "list-1".to_string(),
            "project-1".to_string(),
            "Test Task List".to_string(),
            Some("Test Description".to_string()),
            Some("#00FF00".to_string()),
            0,
        );

        assert_eq!(task_list.id, "list-1");
        assert_eq!(task_list.project_id, "project-1");
        assert_eq!(task_list.name, "Test Task List");
        assert!(!task_list.is_archived);
        assert!(task_list.is_active());
    }

    #[test]
    fn test_belongs_to_project() {
        let task_list = AutoMergeTaskList::new(
            "list-1".to_string(),
            "project-1".to_string(),
            "Test Task List".to_string(),
            None,
            None,
            0,
        );

        assert!(task_list.belongs_to_project("project-1"));
        assert!(!task_list.belongs_to_project("project-2"));
    }

    #[test]
    fn test_update_task_list() {
        let mut task_list = AutoMergeTaskList::default();
        let original_updated_at = task_list.updated_at;

        // 少し時間を空ける
        std::thread::sleep(std::time::Duration::from_millis(1));

        task_list.update(
            Some("Updated Name".to_string()),
            Some(Some("Updated Description".to_string())),
            Some(Some("#FF00FF".to_string())),
            Some(5),
            Some(true),
        );

        assert_eq!(task_list.name, "Updated Name");
        assert_eq!(
            task_list.description,
            Some("Updated Description".to_string())
        );
        assert_eq!(task_list.color, Some("#FF00FF".to_string()));
        assert_eq!(task_list.order_index, 5);
        assert!(task_list.is_archived);
        assert!(!task_list.is_active());
        assert!(task_list.updated_at > original_updated_at);
    }
}
