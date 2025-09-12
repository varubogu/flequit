//! SubTask AutoMergeモデル
//!
//! SQLite subtasksテーブルと同じ構造を持つAutoMerge用データ構造

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

/// SubTask AutoMergeモデル
/// SQLite subtasks テーブルに対応
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct AutoMergeSubTask {
    /// サブタスクの一意識別子
    pub id: String,
    /// 所属プロジェクトID
    pub project_id: String,
    /// 所属タスクID
    pub task_id: String,
    /// サブタスクタイトル
    pub title: String,
    /// サブタスク説明
    pub description: Option<String>,
    /// サブタスクステータス（文字列形式）
    pub status: String,
    /// 優先度（数値）
    pub priority: i32,
    /// 開始日時
    pub plan_start_date: Option<DateTime<Utc>>,
    /// 終了日時
    pub plan_end_date: Option<DateTime<Utc>>,
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

/// サブタスクステータス定数（タスクと同じ）
pub mod subtask_status {
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

impl AutoMergeSubTask {
    /// 新しいサブタスクを作成
    pub fn new(
        id: String,
        project_id: String,
        task_id: String,
        title: String,
        description: Option<String>,
        status: String,
        priority: i32,
        start_date: Option<DateTime<Utc>>,
        end_date: Option<DateTime<Utc>>,
        is_range_date: Option<bool>,
        order_index: i32,
    ) -> Result<Self, String> {
        if !subtask_status::is_valid(&status) {
            return Err(format!("Invalid subtask status: {}", status));
        }

        let now = Utc::now();
        Ok(Self {
            id,
            project_id,
            task_id,
            title,
            description,
            status,
            priority,
            plan_start_date: start_date,
            plan_end_date: end_date,
            is_range_date,
            order_index,
            is_archived: false,
            created_at: now,
            updated_at: now,
        })
    }

    /// サブタスク情報を更新
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
            if !subtask_status::is_valid(&status) {
                return Err(format!("Invalid subtask status: {}", status));
            }
            self.status = status;
        }
        if let Some(priority) = priority {
            self.priority = priority;
        }
        if let Some(start_date) = start_date {
            self.plan_start_date = start_date;
        }
        if let Some(end_date) = end_date {
            self.plan_end_date = end_date;
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

    /// タスクIDでフィルタリング用のヘルパー
    pub fn belongs_to_task(&self, task_id: &str) -> bool {
        self.task_id == task_id
    }

    /// アーカイブされていないサブタスクかチェック
    pub fn is_active(&self) -> bool {
        !self.is_archived
    }

    /// サブタスクが完了しているかチェック
    pub fn is_completed(&self) -> bool {
        self.status == subtask_status::COMPLETED
    }

    /// サブタスクが進行中かチェック
    pub fn is_in_progress(&self) -> bool {
        self.status == subtask_status::IN_PROGRESS
    }

    /// 期限切れかチェック（終了日時が過去かつ未完了）
    pub fn is_overdue(&self) -> bool {
        if let Some(end_date) = self.plan_end_date {
            if !self.is_completed() && end_date < Utc::now() {
                return true;
            }
        }
        false
    }
}

impl Default for AutoMergeSubTask {
    fn default() -> Self {
        Self {
            id: String::new(),
            project_id: String::new(),
            task_id: String::new(),
            title: String::new(),
            description: None,
            status: subtask_status::NOT_STARTED.to_string(),
            priority: 0,
            plan_start_date: None,
            plan_end_date: None,
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
    fn test_new_subtask() {
        let subtask = AutoMergeSubTask::new(
            "subtask-1".to_string(),
            "project-1".to_string(),
            "task-1".to_string(),
            "Test SubTask".to_string(),
            Some("Test Description".to_string()),
            subtask_status::NOT_STARTED.to_string(),
            1,
            None,
            None,
            None,
            0,
        )
        .unwrap();

        assert_eq!(subtask.id, "subtask-1");
        assert_eq!(subtask.project_id, "project-1");
        assert_eq!(subtask.task_id, "task-1");
        assert_eq!(subtask.title, "Test SubTask");
        assert_eq!(subtask.status, subtask_status::NOT_STARTED);
        assert!(!subtask.is_archived);
        assert!(subtask.is_active());
        assert!(!subtask.is_completed());
    }

    #[test]
    fn test_invalid_status() {
        let result = AutoMergeSubTask::new(
            "subtask-1".to_string(),
            "project-1".to_string(),
            "task-1".to_string(),
            "Test SubTask".to_string(),
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
    fn test_subtask_filters() {
        let subtask = AutoMergeSubTask::new(
            "subtask-1".to_string(),
            "project-1".to_string(),
            "task-1".to_string(),
            "Test SubTask".to_string(),
            None,
            subtask_status::IN_PROGRESS.to_string(),
            1,
            None,
            None,
            None,
            0,
        )
        .unwrap();

        assert!(subtask.belongs_to_project("project-1"));
        assert!(!subtask.belongs_to_project("project-2"));
        assert!(subtask.belongs_to_task("task-1"));
        assert!(!subtask.belongs_to_task("task-2"));
        assert!(subtask.is_in_progress());
        assert!(!subtask.is_completed());
    }

    #[test]
    fn test_overdue_check() {
        let past_date = Utc::now() - Duration::days(1);
        let mut subtask = AutoMergeSubTask::new(
            "subtask-1".to_string(),
            "project-1".to_string(),
            "task-1".to_string(),
            "Test SubTask".to_string(),
            None,
            subtask_status::IN_PROGRESS.to_string(),
            1,
            None,
            Some(past_date),
            None,
            0,
        )
        .unwrap();

        assert!(subtask.is_overdue());

        // 完了させると期限切れではなくなる
        subtask
            .update(
                None,
                None,
                Some(subtask_status::COMPLETED.to_string()),
                None,
                None,
                None,
                None,
                None,
                None,
            )
            .unwrap();
        assert!(!subtask.is_overdue());
    }
}
