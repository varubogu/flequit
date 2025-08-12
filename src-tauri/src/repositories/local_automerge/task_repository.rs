use async_trait::async_trait;
use crate::errors::RepositoryError;
use crate::models::task_models::Task;
use crate::types::task_types::TaskStatus;
use crate::repositories::local_automerge::LocalAutomergeRepository;
use crate::repositories::core::task_repository_trait::TaskRepositoryTrait;


#[async_trait]
impl TaskRepositoryTrait for LocalAutomergeRepository {
    async fn set_task(&self, project_id: &str, task: &Task) -> Result<(), RepositoryError> {
        self.storage.set_task(project_id, task).await
    }

    async fn get_task(&self, project_id: &str, task_id: &str) -> Result<Option<Task>, RepositoryError> {
        self.storage.get_task(project_id, task_id).await
    }

    async fn list_tasks(&self, project_id: &str) -> Result<Vec<Task>, RepositoryError> {
        self.storage.list_tasks(project_id).await
    }

    async fn delete_task(&self, _project_id: &str, _task_id: &str) -> Result<(), RepositoryError> {
        // ローカルAutomergeでは物理削除
        // 実装では該当タスクドキュメントを削除する
        todo!("Implementation pending - タスク物理削除")
    }

    async fn find_tasks_by_assignee(&self, project_id: &str, assignee_id: &str) -> Result<Vec<Task>, RepositoryError> {
        let all_tasks = self.storage.list_tasks(project_id).await?;
        let filtered_tasks = all_tasks
            .into_iter()
            .filter(|task| task.assigned_user_ids.contains(&assignee_id.to_string()))
            .collect();
        Ok(filtered_tasks)
    }

    async fn find_tasks_by_status(&self, project_id: &str, status: TaskStatus) -> Result<Vec<Task>, RepositoryError> {
        let all_tasks = self.storage.list_tasks(project_id).await?;
        let filtered_tasks = all_tasks
            .into_iter()
            .filter(|task| task.status == status)
            .collect();
        Ok(filtered_tasks)
    }

    async fn find_tasks_by_priority(&self, project_id: &str, priority: i32) -> Result<Vec<Task>, RepositoryError> {
        let all_tasks = self.storage.list_tasks(project_id).await?;
        let filtered_tasks = all_tasks
            .into_iter()
            .filter(|task| task.priority == priority)
            .collect();
        Ok(filtered_tasks)
    }

    async fn find_tasks_by_tag(&self, project_id: &str, tag_id: &str) -> Result<Vec<Task>, RepositoryError> {
        let all_tasks = self.storage.list_tasks(project_id).await?;
        let filtered_tasks = all_tasks
            .into_iter()
            .filter(|task| task.tag_ids.contains(&tag_id.to_string()))
            .collect();
        Ok(filtered_tasks)
    }

    async fn find_overdue_tasks(&self, project_id: &str, current_time: i64) -> Result<Vec<Task>, RepositoryError> {
        let all_tasks = self.storage.list_tasks(project_id).await?;
        let overdue_tasks = all_tasks
            .into_iter()
            .filter(|task| {
                if let Some(end_date) = task.end_date {
                    end_date.timestamp() < current_time
                } else {
                    false
                }
            })
            .collect();
        Ok(overdue_tasks)
    }

    async fn update_task_status(&self, project_id: &str, task_id: &str, status: TaskStatus) -> Result<(), RepositoryError> {
        if let Some(mut task) = self.storage.get_task(project_id, task_id).await? {
            task.status = status;
            self.storage.set_task(project_id, &task).await
        } else {
            todo!("Task not found error handling")
        }
    }

    async fn update_task_priority(&self, project_id: &str, task_id: &str, priority: i32) -> Result<(), RepositoryError> {
        if let Some(mut task) = self.storage.get_task(project_id, task_id).await? {
            task.priority = priority;
            self.storage.set_task(project_id, &task).await
        } else {
            todo!("Task not found error handling")
        }
    }

    async fn assign_task(&self, project_id: &str, task_id: &str, assignee_id: Option<String>) -> Result<(), RepositoryError> {
        if let Some(mut task) = self.storage.get_task(project_id, task_id).await? {
            if let Some(assignee_id) = assignee_id {
                task.assigned_user_ids = vec![assignee_id];
            } else {
                task.assigned_user_ids.clear();
            }
            self.storage.set_task(project_id, &task).await
        } else {
            todo!("Task not found error handling")
        }
    }

    async fn add_tag_to_task(&self, project_id: &str, task_id: &str, tag_id: &str) -> Result<(), RepositoryError> {
        if let Some(mut task) = self.storage.get_task(project_id, task_id).await? {
            if !task.tag_ids.contains(&tag_id.to_string()) {
                task.tag_ids.push(tag_id.to_string());
                self.storage.set_task(project_id, &task).await
            } else {
                Ok(()) // 既に存在する場合は何もしない
            }
        } else {
            todo!("Task not found error handling")
        }
    }

    async fn remove_tag_from_task(&self, project_id: &str, task_id: &str, tag_id: &str) -> Result<(), RepositoryError> {
        if let Some(mut task) = self.storage.get_task(project_id, task_id).await? {
            task.tag_ids.retain(|t| t != tag_id);
            self.storage.set_task(project_id, &task).await
        } else {
            todo!("Task not found error handling")
        }
    }

    async fn validate_task_exists(&self, project_id: &str, task_id: &str) -> Result<bool, RepositoryError> {
        match self.storage.get_task(project_id, task_id).await? {
            Some(_) => Ok(true),
            None => Ok(false),
        }
    }

    async fn validate_project_exists(&self, project_id: &str) -> Result<bool, RepositoryError> {
        match self.storage.get_project(project_id).await? {
            Some(_) => Ok(true),
            None => Ok(false),
        }
    }

    async fn get_task_count(&self, project_id: &str) -> Result<u64, RepositoryError> {
        let tasks = self.storage.list_tasks(project_id).await?;
        Ok(tasks.len() as u64)
    }

    async fn get_task_count_by_status(&self, project_id: &str, status: TaskStatus) -> Result<u64, RepositoryError> {
        let tasks = self.find_tasks_by_status(project_id, status).await?;
        Ok(tasks.len() as u64)
    }

    async fn get_completion_rate(&self, project_id: &str) -> Result<f32, RepositoryError> {
        let all_tasks = self.storage.list_tasks(project_id).await?;
        let total_count = all_tasks.len() as f32;

        if total_count == 0.0 {
            return Ok(0.0);
        }

        let completed_count = all_tasks
            .iter()
            .filter(|task| task.status == TaskStatus::Completed)
            .count() as f32;

        Ok(completed_count / total_count)
    }
}
