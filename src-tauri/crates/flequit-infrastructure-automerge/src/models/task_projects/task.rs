//! Task AutoMergeモデル
//!
//! SQLite tasksテーブルと同じ構造を持つAutoMerge用データ構造

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

/// Task AutoMergeモデル
/// SQLite tasks テーブルに対応
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct AutoMergeTask {
    /// タスクの一意識別子
    pub id: String,
    /// 所属プロジェクトID
    pub project_id: String,
    /// 所属タスクリストID
    pub list_id: String,
    /// タスクタイトル
    pub title: String,
    /// タスク説明
    pub description: Option<String>,
    /// タスクステータス（文字列形式）
    pub status: String,
    /// 優先度（数値）
    pub priority: i32,
    /// 開始日時
    pub start_date: Option<DateTime<Utc>>,
    /// 終了日時
    pub end_date: Option<DateTime<Utc>>,
    /// 期間指定フラグ
    pub is_range_date: Option<bool>,
    /// 表示順序
    pub order_index: i32,
    /// アーカイブ状態フラグ
    pub is_archived: bool,
    /// 作成日時
    pub created_at: DateTime<Utc>,
    /// 更新日時
    pub updated_at: DateTime<Utc>,
}

/// タスクステータス定数
pub mod task_status {
    pub const NOT_STARTED: &str = "not_started";
    pub const IN_PROGRESS: &str = "in_progress";
    pub const WAITING: &str = "waiting";
    pub const COMPLETED: &str = "completed";
    pub const CANCELLED: &str = "cancelled";

    pub fn is_valid(status: &str) -> bool {
        matches!(
            status,
            NOT_STARTED | IN_PROGRESS | WAITING | COMPLETED | CANCELLED
        )
    }
}

impl AutoMergeTask {
    /// 新しいタスクを作成
    #[allow(clippy::too_many_arguments)]
    pub fn new(
        id: String,
        project_id: String,
        list_id: String,
        title: String,
        description: Option<String>,
        status: String,
        priority: i32,
        start_date: Option<DateTime<Utc>>,
        end_date: Option<DateTime<Utc>>,
        is_range_date: Option<bool>,
        order_index: i32,
    ) -> Result<Self, String> {
        if !task_status::is_valid(&status) {
            return Err(format!("Invalid task status: {}", status));
        }

        let now = Utc::now();
        Ok(Self {
            id,
            project_id,
            list_id,
            title,
            description,
            status,
            priority,
            start_date,
            end_date,
            is_range_date,
            order_index,
            is_archived: false,
            created_at: now,
            updated_at: now,
        })
    }

    /// タスク情報を更新
    #[allow(clippy::too_many_arguments)]
    pub fn update(
        &mut self,
        title: Option<String>,
        description: Option<Option<String>>,
        status: Option<String>,
        priority: Option<i32>,
        start_date: Option<Option<DateTime<Utc>>>,
        end_date: Option<Option<DateTime<Utc>>>,
        is_range_date: Option<Option<bool>>,
        order_index: Option<i32>,
        is_archived: Option<bool>,
    ) -> Result<(), String> {
        if let Some(title) = title {
            self.title = title;
        }
        if let Some(description) = description {
            self.description = description;
        }
        if let Some(status) = status {
            if !task_status::is_valid(&status) {
                return Err(format!("Invalid task status: {}", status));
            }
            self.status = status;
        }
        if let Some(priority) = priority {
            self.priority = priority;
        }
        if let Some(start_date) = start_date {
            self.start_date = start_date;
        }
        if let Some(end_date) = end_date {
            self.end_date = end_date;
        }
        if let Some(is_range_date) = is_range_date {
            self.is_range_date = is_range_date;
        }
        if let Some(order_index) = order_index {
            self.order_index = order_index;
        }
        if let Some(is_archived) = is_archived {
            self.is_archived = is_archived;
        }
        self.updated_at = Utc::now();
        Ok(())
    }

    /// プロジェクトIDでフィルタリング用のヘルパー
    pub fn belongs_to_project(&self, project_id: &str) -> bool {
        self.project_id == project_id
    }

    /// タスクリストIDでフィルタリング用のヘルパー
    pub fn belongs_to_list(&self, list_id: &str) -> bool {
        self.list_id == list_id
    }

    /// アーカイブされていないタスクかチェック
    pub fn is_active(&self) -> bool {
        !self.is_archived
    }

    /// タスクが完了しているかチェック
    pub fn is_completed(&self) -> bool {
        self.status == task_status::COMPLETED
    }

    /// タスクが進行中かチェック
    pub fn is_in_progress(&self) -> bool {
        self.status == task_status::IN_PROGRESS
    }

    /// 期限切れかチェック（終了日時が過去かつ未完了）
    pub fn is_overdue(&self) -> bool {
        if let Some(end_date) = self.end_date {
            if !self.is_completed() && end_date < Utc::now() {
                return true;
            }
        }
        false
    }
}

impl Default for AutoMergeTask {
    fn default() -> Self {
        Self {
            id: String::new(),
            project_id: String::new(),
            list_id: String::new(),
            title: String::new(),
            description: None,
            status: task_status::NOT_STARTED.to_string(),
            priority: 0,
            start_date: None,
            end_date: None,
            is_range_date: None,
            order_index: 0,
            is_archived: false,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::Duration;

    #[test]
    fn test_new_task() {
        let task = AutoMergeTask::new(
            "task-1".to_string(),
            "project-1".to_string(),
            "list-1".to_string(),
            "Test Task".to_string(),
            Some("Test Description".to_string()),
            task_status::NOT_STARTED.to_string(),
            1,
            None,
            None,
            None,
            0,
        )
        .unwrap();

        assert_eq!(task.id, "task-1");
        assert_eq!(task.project_id, "project-1");
        assert_eq!(task.list_id, "list-1");
        assert_eq!(task.title, "Test Task");
        assert_eq!(task.status, task_status::NOT_STARTED);
        assert!(!task.is_archived);
        assert!(task.is_active());
        assert!(!task.is_completed());
    }

    #[test]
    fn test_invalid_status() {
        let result = AutoMergeTask::new(
            "task-1".to_string(),
            "project-1".to_string(),
            "list-1".to_string(),
            "Test Task".to_string(),
            None,
            "invalid_status".to_string(),
            1,
            None,
            None,
            None,
            0,
        );

        assert!(result.is_err());
    }

    #[test]
    fn test_task_filters() {
        let task = AutoMergeTask::new(
            "task-1".to_string(),
            "project-1".to_string(),
            "list-1".to_string(),
            "Test Task".to_string(),
            None,
            task_status::IN_PROGRESS.to_string(),
            1,
            None,
            None,
            None,
            0,
        )
        .unwrap();

        assert!(task.belongs_to_project("project-1"));
        assert!(!task.belongs_to_project("project-2"));
        assert!(task.belongs_to_list("list-1"));
        assert!(!task.belongs_to_list("list-2"));
        assert!(task.is_in_progress());
        assert!(!task.is_completed());
    }

    #[test]
    fn test_overdue_check() {
        let past_date = Utc::now() - Duration::days(1);
        let mut task = AutoMergeTask::new(
            "task-1".to_string(),
            "project-1".to_string(),
            "list-1".to_string(),
            "Test Task".to_string(),
            None,
            task_status::IN_PROGRESS.to_string(),
            1,
            None,
            Some(past_date),
            None,
            0,
        )
        .unwrap();

        assert!(task.is_overdue());

        // 完了させると期限切れではなくなる
        task.update(
            None,
            None,
            Some(task_status::COMPLETED.to_string()),
            None,
            None,
            None,
            None,
            None,
            None,
        )
        .unwrap();
        assert!(!task.is_overdue());
    }
}
