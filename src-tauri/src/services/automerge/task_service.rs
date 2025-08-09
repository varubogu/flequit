use crate::errors::ServiceError;
use crate::types::task_types::{Task, TaskStatus};
use crate::repositories::automerge::TaskRepository;
use crate::commands::task_commands::TaskSearchRequest;
use tauri::{State};

pub struct TaskService;

impl TaskService {
    pub fn new() -> Self {
        Self
    }

    // タスク操作
    pub async fn create_task(&self, task_repository: State<'_, TaskRepository>, task: &Task) -> Result<(), ServiceError> {
        todo!("Implementation pending - use task_repository")
    }

    pub async fn get_task(&self, task_repository: State<'_, TaskRepository>, project_id: &str, task_id: &str) -> Result<Option<Task>, ServiceError> {
        todo!("Implementation pending - use task_repository")
    }

    pub async fn update_task(&self, task_repository: State<'_, TaskRepository>, task: &Task) -> Result<(), ServiceError> {
        todo!("Implementation pending - use task_repository")
    }

    pub async fn delete_task(&self, task_repository: State<'_, TaskRepository>, project_id: &str, task_id: &str) -> Result<(), ServiceError> {
        todo!("Implementation pending - use task_repository")
    }

    pub async fn list_tasks(&self, task_repository: State<'_, TaskRepository>, project_id: &str) -> Result<Vec<Task>, ServiceError> {
        todo!("Implementation pending - use task_repository")
    }

    pub async fn list_tasks_by_assignee(&self, task_repository: State<'_, TaskRepository>, project_id: &str, user_id: &str) -> Result<Vec<Task>, ServiceError> {
        todo!("Implementation pending - use task_repository")
    }

    pub async fn list_tasks_by_status(&self, task_repository: State<'_, TaskRepository>, project_id: &str, status: TaskStatus) -> Result<Vec<Task>, ServiceError> {
        todo!("Implementation pending - use task_repository")
    }

    pub async fn list_overdue_tasks(&self, task_repository: State<'_, TaskRepository>, project_id: &str) -> Result<Vec<Task>, ServiceError> {
        todo!("Implementation pending - use task_repository")
    }

    // ビジネスロジック
    pub async fn validate_task(&self, task: &Task) -> Result<(), ServiceError> {
        if task.title.trim().is_empty() {
            return Err(ServiceError::ValidationError("Task title cannot be empty".to_string()));
        }

        if task.title.len() > 255 {
            return Err(ServiceError::ValidationError("Task title too long".to_string()));
        }

        // if task.project_id.trim().is_empty() {
        //     return Err(ServiceError::ValidationError("Project ID cannot be empty".to_string()));
        // }

        Ok(())
    }

    pub async fn can_assign_task(&self, task_repository: State<'_, TaskRepository>, project_id: &str, assignee_id: &str) -> Result<bool, ServiceError> {
        todo!("Implementation pending - check if assignee is project member using task_repository")
    }

    pub async fn update_task_status(&self, task_repository: State<'_, TaskRepository>, project_id: &str, task_id: &str, status: TaskStatus) -> Result<(), ServiceError> {
        todo!("Implementation pending - use task_repository")
    }

    pub async fn update_task_priority(&self, task_repository: State<'_, TaskRepository>, project_id: &str, task_id: &str, priority: i32) -> Result<(), ServiceError> {
        todo!("Implementation pending - use task_repository")
    }

    pub async fn assign_task(&self, task_repository: State<'_, TaskRepository>, project_id: &str, task_id: &str, assignee_id: Option<String>) -> Result<(), ServiceError> {
        todo!("Implementation pending - use task_repository")
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

        // TODO: 日付フィルタリングの実装
        // due_date_from, due_date_to, created_from, created_toの処理

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
}
