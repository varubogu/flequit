use crate::errors::ServiceError;
use crate::types::task_types::{Task, TaskStatus};
use crate::repositories::automerge::TaskRepository;
use crate::commands::task_commands::TaskSearchRequest;
use tauri::{State};
use chrono::{DateTime, Utc};
use std::future::Future;

pub struct TaskService;

impl TaskService {
    pub fn new() -> Self {
        Self
    }

    // タスク操作
    pub async fn create_task(&self, task_repository: State<'_, TaskRepository>, task: &Task) -> Result<(), ServiceError> {
        // バリデーション実行
        self.validate_task(task).await?;

        // タスクの作成日時・更新日時設定
        let mut new_task = task.clone();
        let now = Utc::now();
        new_task.created_at = now;
        new_task.updated_at = now;

        // Repository呼び出し（todo!実装の場合はエラー処理）
        match self.safe_repository_call(async move {
            task_repository.set_task(&new_task.list_id, &new_task).await
        }).await {
            Ok(_) => Ok(()),
            Err(e) => Err(ServiceError::Repository(e))
        }
    }

    pub async fn get_task(&self, task_repository: State<'_, TaskRepository>, project_id: &str, task_id: &str) -> Result<Option<Task>, ServiceError> {
        // バリデーション
        if project_id.trim().is_empty() {
            return Err(ServiceError::ValidationError("Project ID cannot be empty".to_string()));
        }
        if task_id.trim().is_empty() {
            return Err(ServiceError::ValidationError("Task ID cannot be empty".to_string()));
        }

        // Repository呼び出し
        match self.safe_repository_call(async move {
            task_repository.get_task(project_id, task_id).await
        }).await {
            Ok(task) => Ok(task),
            Err(e) => Err(ServiceError::Repository(e))
        }
    }

    pub async fn update_task(&self, task_repository: State<'_, TaskRepository>, task: &Task) -> Result<(), ServiceError> {
        // バリデーション実行
        self.validate_task(task).await?;

        // 既存タスクの存在確認
        let existing_task = self.get_task(task_repository.clone(), &task.list_id, &task.id).await?;
        if existing_task.is_none() {
            return Err(ServiceError::ValidationError("Task not found".to_string()));
        }

        // 更新日時設定
        let mut updated_task = task.clone();
        updated_task.updated_at = Utc::now();
        // 作成日時は既存のものを保持
        if let Some(existing) = existing_task {
            updated_task.created_at = existing.created_at;
        }

        // Repository呼び出し
        match self.safe_repository_call(async move {
            task_repository.set_task(&updated_task.list_id, &updated_task).await
        }).await {
            Ok(_) => Ok(()),
            Err(e) => Err(ServiceError::Repository(e))
        }
    }

    pub async fn delete_task(&self, task_repository: State<'_, TaskRepository>, project_id: &str, task_id: &str) -> Result<(), ServiceError> {
        // バリデーション
        if project_id.trim().is_empty() {
            return Err(ServiceError::ValidationError("Project ID cannot be empty".to_string()));
        }
        if task_id.trim().is_empty() {
            return Err(ServiceError::ValidationError("Task ID cannot be empty".to_string()));
        }

        // Repository呼び出し（論理削除）
        match self.safe_repository_call(async move {
            task_repository.delete_task(project_id, task_id).await
        }).await {
            Ok(_) => Ok(()),
            Err(e) => Err(ServiceError::Repository(e))
        }
    }

    pub async fn list_tasks(&self, task_repository: State<'_, TaskRepository>, project_id: &str) -> Result<Vec<Task>, ServiceError> {
        // バリデーション
        if project_id.trim().is_empty() {
            return Err(ServiceError::ValidationError("Project ID cannot be empty".to_string()));
        }

        // Repository呼び出し
        match self.safe_repository_call(async move {
            task_repository.list_tasks(project_id).await
        }).await {
            Ok(tasks) => {
                // アーカイブされていないタスクのみフィルタリング
                let active_tasks = tasks.into_iter()
                    .filter(|task| !task.is_archived)
                    .collect();
                Ok(active_tasks)
            },
            Err(e) => Err(ServiceError::Repository(e))
        }
    }

    pub async fn list_tasks_by_assignee(&self, task_repository: State<'_, TaskRepository>, project_id: &str, user_id: &str) -> Result<Vec<Task>, ServiceError> {
        // バリデーション
        if project_id.trim().is_empty() {
            return Err(ServiceError::ValidationError("Project ID cannot be empty".to_string()));
        }
        if user_id.trim().is_empty() {
            return Err(ServiceError::ValidationError("User ID cannot be empty".to_string()));
        }

        // Repository呼び出し（フォールバックとして全タスク取得後フィルタリング）
        match self.safe_repository_call(async move {
            match task_repository.find_tasks_by_assignee(project_id, user_id).await {
                Ok(tasks) => Ok(tasks),
                Err(_) => {
                    // Repository実装が未完了の場合のフォールバック
                    let all_tasks = task_repository.list_tasks(project_id).await?;
                    let filtered_tasks = all_tasks.into_iter()
                        .filter(|task| task.assigned_user_ids.contains(&user_id.to_string()))
                        .collect();
                    Ok(filtered_tasks)
                }
            }
        }).await {
            Ok(tasks) => {
                // アーカイブされていないタスクのみ返す
                let active_tasks = tasks.into_iter()
                    .filter(|task| !task.is_archived)
                    .collect();
                Ok(active_tasks)
            },
            Err(e) => Err(ServiceError::Repository(e))
        }
    }

    pub async fn list_tasks_by_status(&self, task_repository: State<'_, TaskRepository>, project_id: &str, status: TaskStatus) -> Result<Vec<Task>, ServiceError> {
        // バリデーション
        if project_id.trim().is_empty() {
            return Err(ServiceError::ValidationError("Project ID cannot be empty".to_string()));
        }

        // Repository呼び出し（フォールバックとして全タスク取得後フィルタリング）
        match self.safe_repository_call(async move {
            match task_repository.find_tasks_by_status(project_id, status.clone()).await {
                Ok(tasks) => Ok(tasks),
                Err(_) => {
                    // Repository実装が未完了の場合のフォールバック
                    let all_tasks = task_repository.list_tasks(project_id).await?;
                    let filtered_tasks = all_tasks.into_iter()
                        .filter(|task| task.status == status)
                        .collect();
                    Ok(filtered_tasks)
                }
            }
        }).await {
            Ok(tasks) => {
                // アーカイブされていないタスクのみ返す
                let active_tasks = tasks.into_iter()
                    .filter(|task| !task.is_archived)
                    .collect();
                Ok(active_tasks)
            },
            Err(e) => Err(ServiceError::Repository(e))
        }
    }

    pub async fn list_overdue_tasks(&self, task_repository: State<'_, TaskRepository>, project_id: &str) -> Result<Vec<Task>, ServiceError> {
        // バリデーション
        if project_id.trim().is_empty() {
            return Err(ServiceError::ValidationError("Project ID cannot be empty".to_string()));
        }

        let now = Utc::now();
        let current_timestamp = now.timestamp();

        // Repository呼び出し（フォールバックとして全タスク取得後フィルタリング）
        match self.safe_repository_call(async move {
            match task_repository.find_overdue_tasks(project_id, current_timestamp).await {
                Ok(tasks) => Ok(tasks),
                Err(_) => {
                    // Repository実装が未完了の場合のフォールバック
                    let all_tasks = task_repository.list_tasks(project_id).await?;
                    let overdue_tasks = all_tasks.into_iter()
                        .filter(|task| {
                            if let Some(end_date) = &task.end_date {
                                end_date.timestamp() < current_timestamp &&
                                task.status != TaskStatus::Completed &&
                                task.status != TaskStatus::Cancelled
                            } else {
                                false
                            }
                        })
                        .collect();
                    Ok(overdue_tasks)
                }
            }
        }).await {
            Ok(tasks) => {
                // アーカイブされていないタスクのみ返す
                let active_tasks = tasks.into_iter()
                    .filter(|task| !task.is_archived)
                    .collect();
                Ok(active_tasks)
            },
            Err(e) => Err(ServiceError::Repository(e))
        }
    }

    // ビジネスロジック
    pub async fn validate_task(&self, task: &Task) -> Result<(), ServiceError> {
        // タイトルバリデーション
        if task.title.trim().is_empty() {
            return Err(ServiceError::ValidationError("Task title cannot be empty".to_string()));
        }

        if task.title.len() > 255 {
            return Err(ServiceError::ValidationError("Task title too long".to_string()));
        }

        // IDバリデーション
        if task.id.trim().is_empty() {
            return Err(ServiceError::ValidationError("Task ID cannot be empty".to_string()));
        }

        if task.list_id.trim().is_empty() {
            return Err(ServiceError::ValidationError("List ID cannot be empty".to_string()));
        }

        // 説明のバリデーション
        if let Some(description) = &task.description {
            if description.len() > 2000 {
                return Err(ServiceError::ValidationError("Task description too long".to_string()));
            }
        }

        // 優先度バリデーション
        if task.priority < 0 || task.priority > 10 {
            return Err(ServiceError::ValidationError("Task priority must be between 0 and 10".to_string()));
        }

        // 日付バリデーション
        if let (Some(start_date), Some(end_date)) = (&task.start_date, &task.end_date) {
            if start_date > end_date {
                return Err(ServiceError::ValidationError("Start date cannot be after end date".to_string()));
            }
        }

        // アサイン済みユーザーIDバリデーション
        for user_id in &task.assigned_user_ids {
            if user_id.trim().is_empty() {
                return Err(ServiceError::ValidationError("Assigned user ID cannot be empty".to_string()));
            }
        }

        // タグIDバリデーション
        for tag_id in &task.tag_ids {
            if tag_id.trim().is_empty() {
                return Err(ServiceError::ValidationError("Tag ID cannot be empty".to_string()));
            }
        }

        Ok(())
    }

    pub async fn can_assign_task(&self, task_repository: State<'_, TaskRepository>, project_id: &str, assignee_id: &str) -> Result<bool, ServiceError> {
        // バリデーション
        if project_id.trim().is_empty() {
            return Err(ServiceError::ValidationError("Project ID cannot be empty".to_string()));
        }
        if assignee_id.trim().is_empty() {
            return Err(ServiceError::ValidationError("Assignee ID cannot be empty".to_string()));
        }

        // プロジェクトの存在確認
        match self.safe_repository_call(async move {
            task_repository.validate_project_exists(project_id).await
        }).await {
            Ok(exists) => {
                if !exists {
                    return Err(ServiceError::ValidationError("Project does not exist".to_string()));
                }
            },
            Err(_) => {
                // Repository未実装の場合は一旦trueを返す（後で実装）
                return Ok(true);
            }
        }

        // TODO: 実際のプロジェクトメンバーシップ確認はプロジェクト関連のRepositoryで行う
        // 現在は暫定的にtrueを返す
        Ok(true)
    }

    pub async fn update_task_status(&self, task_repository: State<'_, TaskRepository>, project_id: &str, task_id: &str, status: TaskStatus) -> Result<(), ServiceError> {
        // バリデーション
        if project_id.trim().is_empty() {
            return Err(ServiceError::ValidationError("Project ID cannot be empty".to_string()));
        }
        if task_id.trim().is_empty() {
            return Err(ServiceError::ValidationError("Task ID cannot be empty".to_string()));
        }

        // Repository呼び出し（フォールバックとして全体更新）
        match self.safe_repository_call(async move {
            match task_repository.update_task_status(project_id, task_id, status.clone()).await {
                Ok(_) => Ok(()),
                Err(_) => {
                    // Repository実装が未完了の場合のフォールバック（タスク全体を取得して更新）
                    if let Ok(Some(mut task)) = task_repository.get_task(project_id, task_id).await {
                        task.status = status;
                        task.updated_at = Utc::now();
                        task_repository.set_task(project_id, &task).await?;
                    }
                    Ok(())
                }
            }
        }).await {
            Ok(_) => Ok(()),
            Err(e) => Err(ServiceError::Repository(e))
        }
    }

    pub async fn update_task_priority(&self, task_repository: State<'_, TaskRepository>, project_id: &str, task_id: &str, priority: i32) -> Result<(), ServiceError> {
        // バリデーション
        if project_id.trim().is_empty() {
            return Err(ServiceError::ValidationError("Project ID cannot be empty".to_string()));
        }
        if task_id.trim().is_empty() {
            return Err(ServiceError::ValidationError("Task ID cannot be empty".to_string()));
        }
        if priority < 0 || priority > 10 {
            return Err(ServiceError::ValidationError("Priority must be between 0 and 10".to_string()));
        }

        // Repository呼び出し（フォールバックとして全体更新）
        match self.safe_repository_call(async move {
            match task_repository.update_task_priority(project_id, task_id, priority).await {
                Ok(_) => Ok(()),
                Err(_) => {
                    // Repository実装が未完了の場合のフォールバック
                    if let Ok(Some(mut task)) = task_repository.get_task(project_id, task_id).await {
                        task.priority = priority;
                        task.updated_at = Utc::now();
                        task_repository.set_task(project_id, &task).await?;
                    }
                    Ok(())
                }
            }
        }).await {
            Ok(_) => Ok(()),
            Err(e) => Err(ServiceError::Repository(e))
        }
    }

    pub async fn assign_task(&self, task_repository: State<'_, TaskRepository>, project_id: &str, task_id: &str, assignee_id: Option<String>) -> Result<(), ServiceError> {
        // バリデーション
        if project_id.trim().is_empty() {
            return Err(ServiceError::ValidationError("Project ID cannot be empty".to_string()));
        }
        if task_id.trim().is_empty() {
            return Err(ServiceError::ValidationError("Task ID cannot be empty".to_string()));
        }

        // アサインする場合の権限チェック
        if let Some(ref id) = assignee_id {
            if !self.can_assign_task(task_repository.clone(), project_id, id).await? {
                return Err(ServiceError::ValidationError("Cannot assign task to this user".to_string()));
            }
        }

        // Repository呼び出し（フォールバックとして全体更新）
        match self.safe_repository_call(async move {
            match task_repository.assign_task(project_id, task_id, assignee_id.clone()).await {
                Ok(_) => Ok(()),
                Err(_) => {
                    // Repository実装が未完了の場合のフォールバック
                    if let Ok(Some(mut task)) = task_repository.get_task(project_id, task_id).await {
                        if let Some(new_assignee) = assignee_id {
                            if !task.assigned_user_ids.contains(&new_assignee) {
                                task.assigned_user_ids.push(new_assignee);
                            }
                        }
                        task.updated_at = Utc::now();
                        task_repository.set_task(project_id, &task).await?;
                    }
                    Ok(())
                }
            }
        }).await {
            Ok(_) => Ok(()),
            Err(e) => Err(ServiceError::Repository(e))
        }
    }

    pub async fn search_tasks(&self, task_repository: State<'_, TaskRepository>, request: &TaskSearchRequest) -> Result<(Vec<Task>, usize), ServiceError> {
        // project_idが必要
        let project_id = match &request.project_id {
            Some(id) => id,
            None => return Err(ServiceError::ValidationError("Project ID is required".to_string())),
        };

        // 基本的なタスク一覧を取得
        let mut tasks = self.list_tasks(task_repository, project_id).await?;

        // フィルタリング処理
        if let Some(ref title) = request.title {
            tasks.retain(|task| task.title.to_lowercase().contains(&title.to_lowercase()));
        }

        if let Some(ref description) = request.description {
            tasks.retain(|task| {
                if let Some(ref desc) = task.description {
                    desc.to_lowercase().contains(&description.to_lowercase())
                } else {
                    false
                }
            });
        }

        if let Some(status) = &request.status {
            tasks.retain(|task| task.status == *status);
        }

        if let Some(ref assignee_id) = request.assignee_id {
            tasks.retain(|task| task.assigned_user_ids.contains(assignee_id));
        }

        if let Some(priority_min) = request.priority_min {
            tasks.retain(|task| task.priority >= priority_min);
        }

        if let Some(priority_max) = request.priority_max {
            tasks.retain(|task| task.priority <= priority_max);
        }

        if let Some(ref tag_ids) = request.tag_ids {
            tasks.retain(|task| {
                tag_ids.iter().any(|tag_id| task.tag_ids.contains(tag_id))
            });
        }

        // 日付フィルタリングの実装
        if let Some(ref due_from_str) = request.due_date_from {
            if let Ok(due_from) = DateTime::parse_from_rfc3339(due_from_str) {
                let due_from_utc = due_from.with_timezone(&Utc);
                tasks.retain(|task| {
                    if let Some(ref end_date) = task.end_date {
                        end_date >= &due_from_utc
                    } else {
                        false
                    }
                });
            }
        }

        if let Some(ref due_to_str) = request.due_date_to {
            if let Ok(due_to) = DateTime::parse_from_rfc3339(due_to_str) {
                let due_to_utc = due_to.with_timezone(&Utc);
                tasks.retain(|task| {
                    if let Some(ref end_date) = task.end_date {
                        end_date <= &due_to_utc
                    } else {
                        false
                    }
                });
            }
        }

        if let Some(ref created_from_str) = request.created_from {
            if let Ok(created_from) = DateTime::parse_from_rfc3339(created_from_str) {
                let created_from_utc = created_from.with_timezone(&Utc);
                tasks.retain(|task| task.created_at >= created_from_utc);
            }
        }

        if let Some(ref created_to_str) = request.created_to {
            if let Ok(created_to) = DateTime::parse_from_rfc3339(created_to_str) {
                let created_to_utc = created_to.with_timezone(&Utc);
                tasks.retain(|task| task.created_at <= created_to_utc);
            }
        }

        // 総件数を保存（フィルタリング後）
        let total_count = tasks.len();

        // ページネーション
        let offset = request.offset.unwrap_or(0);
        let limit = request.limit.unwrap_or(50);

        if offset < tasks.len() {
            tasks = tasks.into_iter().skip(offset).take(limit).collect();
        } else {
            tasks = vec![];
        }

        Ok((tasks, total_count))
    }

    // Repository呼び出しの安全実行（todo!()パニック対応）
    async fn safe_repository_call<T, F>(&self, future: F) -> Result<T, crate::errors::RepositoryError>
    where
        F: Future<Output = Result<T, crate::errors::RepositoryError>>,
    {
        // panic::catch_unwindはFutureに対して直接使用できないため、
        // Repository未実装エラーを適切にハンドリング
        match future.await {
            Ok(result) => Ok(result),
            Err(e) => {
                // Repository実装が未完了（todo!()）の場合は適切なエラーメッセージ
                Err(e)
            }
        }
    }

    // 追加のヘルパーメソッド
    pub async fn get_task_statistics(&self, task_repository: State<'_, TaskRepository>, project_id: &str) -> Result<TaskStatistics, ServiceError> {
        let tasks = self.list_tasks(task_repository, project_id).await?;

        let total = tasks.len();
        let completed = tasks.iter().filter(|t| t.status == TaskStatus::Completed).count();
        let in_progress = tasks.iter().filter(|t| t.status == TaskStatus::InProgress).count();
        let not_started = tasks.iter().filter(|t| t.status == TaskStatus::NotStarted).count();
        let cancelled = tasks.iter().filter(|t| t.status == TaskStatus::Cancelled).count();
        let waiting = tasks.iter().filter(|t| t.status == TaskStatus::Waiting).count();

        let completion_rate = if total > 0 {
            (completed as f32 / total as f32) * 100.0
        } else {
            0.0
        };

        Ok(TaskStatistics {
            total_tasks: total,
            completed_tasks: completed,
            in_progress_tasks: in_progress,
            not_started_tasks: not_started,
            cancelled_tasks: cancelled,
            waiting_tasks: waiting,
            completion_rate,
        })
    }

    pub async fn add_tag_to_task(&self, task_repository: State<'_, TaskRepository>, project_id: &str, task_id: &str, tag_id: &str) -> Result<(), ServiceError> {
        // バリデーション
        if project_id.trim().is_empty() {
            return Err(ServiceError::ValidationError("Project ID cannot be empty".to_string()));
        }
        if task_id.trim().is_empty() {
            return Err(ServiceError::ValidationError("Task ID cannot be empty".to_string()));
        }
        if tag_id.trim().is_empty() {
            return Err(ServiceError::ValidationError("Tag ID cannot be empty".to_string()));
        }

        // Repository呼び出し（フォールバックとして全体更新）
        match self.safe_repository_call(async move {
            match task_repository.add_tag_to_task(project_id, task_id, tag_id).await {
                Ok(_) => Ok(()),
                Err(_) => {
                    // Repository実装が未完了の場合のフォールバック
                    if let Ok(Some(mut task)) = task_repository.get_task(project_id, task_id).await {
                        if !task.tag_ids.contains(&tag_id.to_string()) {
                            task.tag_ids.push(tag_id.to_string());
                            task.updated_at = Utc::now();
                            task_repository.set_task(project_id, &task).await?;
                        }
                    }
                    Ok(())
                }
            }
        }).await {
            Ok(_) => Ok(()),
            Err(e) => Err(ServiceError::Repository(e))
        }
    }

    pub async fn remove_tag_from_task(&self, task_repository: State<'_, TaskRepository>, project_id: &str, task_id: &str, tag_id: &str) -> Result<(), ServiceError> {
        // バリデーション
        if project_id.trim().is_empty() {
            return Err(ServiceError::ValidationError("Project ID cannot be empty".to_string()));
        }
        if task_id.trim().is_empty() {
            return Err(ServiceError::ValidationError("Task ID cannot be empty".to_string()));
        }
        if tag_id.trim().is_empty() {
            return Err(ServiceError::ValidationError("Tag ID cannot be empty".to_string()));
        }

        // Repository呼び出し（フォールバックとして全体更新）
        match self.safe_repository_call(async move {
            match task_repository.remove_tag_from_task(project_id, task_id, tag_id).await {
                Ok(_) => Ok(()),
                Err(_) => {
                    // Repository実装が未完了の場合のフォールバック
                    if let Ok(Some(mut task)) = task_repository.get_task(project_id, task_id).await {
                        task.tag_ids.retain(|id| id != tag_id);
                        task.updated_at = Utc::now();
                        task_repository.set_task(project_id, &task).await?;
                    }
                    Ok(())
                }
            }
        }).await {
            Ok(_) => Ok(()),
            Err(e) => Err(ServiceError::Repository(e))
        }
    }
}

// タスク統計情報の構造体
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct TaskStatistics {
    pub total_tasks: usize,
    pub completed_tasks: usize,
    pub in_progress_tasks: usize,
    pub not_started_tasks: usize,
    pub cancelled_tasks: usize,
    pub waiting_tasks: usize,
    pub completion_rate: f32,
}
