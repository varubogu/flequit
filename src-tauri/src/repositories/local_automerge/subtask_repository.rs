use async_trait::async_trait;
use crate::errors::RepositoryError;
use crate::models::sub_task_models::Subtask;
use crate::repositories::local_automerge::LocalAutomergeRepository;
use crate::repositories::core::subtask_repository_trait::SubtaskRepositoryTrait;


#[async_trait]
impl SubtaskRepositoryTrait for LocalAutomergeRepository {
    async fn set_subtask(&self, project_id: &str, task_id: &str, subtask: &Subtask) -> Result<(), RepositoryError> {
        self.storage.set_subtask(project_id, task_id, subtask).await
    }

    async fn get_subtask(&self, project_id: &str, task_id: &str, subtask_id: &str) -> Result<Option<Subtask>, RepositoryError> {
        self.storage.get_subtask(project_id, task_id, subtask_id).await
    }

    async fn list_subtasks(&self, project_id: &str, task_id: &str) -> Result<Vec<Subtask>, RepositoryError> {
        self.storage.list_subtasks(project_id, task_id).await
    }

    async fn delete_subtask(&self, _project_id: &str, _task_id: &str, _subtask_id: &str) -> Result<(), RepositoryError> {
        // ローカルAutomergeでは物理削除
        // 実装では該当サブタスクドキュメントを削除する
        todo!("Implementation pending - サブタスク物理削除")
    }

    async fn find_completed_subtasks(&self, project_id: &str, task_id: &str) -> Result<Vec<Subtask>, RepositoryError> {
        let all_subtasks = self.storage.list_subtasks(project_id, task_id).await?;
        let completed_subtasks = all_subtasks
            .into_iter()
            .filter(|subtask| subtask.completed)
            .collect();
        Ok(completed_subtasks)
    }

    async fn find_incomplete_subtasks(&self, project_id: &str, task_id: &str) -> Result<Vec<Subtask>, RepositoryError> {
        let all_subtasks = self.storage.list_subtasks(project_id, task_id).await?;
        let incomplete_subtasks = all_subtasks
            .into_iter()
            .filter(|subtask| !subtask.completed)
            .collect();
        Ok(incomplete_subtasks)
    }

    async fn find_subtasks_by_project(&self, project_id: &str) -> Result<Vec<Subtask>, RepositoryError> {
        let all_tasks = self.storage.list_tasks(project_id).await?;
        let mut all_subtasks = Vec::new();

        for task in all_tasks {
            let subtasks = self.storage.list_subtasks(project_id, &task.id).await?;
            all_subtasks.extend(subtasks);
        }

        Ok(all_subtasks)
    }

    async fn toggle_completion(&self, project_id: &str, task_id: &str, subtask_id: &str) -> Result<(), RepositoryError> {
        if let Some(mut subtask) = self.storage.get_subtask(project_id, task_id, subtask_id).await? {
            subtask.completed = !subtask.completed;
            self.storage.set_subtask(project_id, task_id, &subtask).await
        } else {
            todo!("Subtask not found error handling")
        }
    }

    async fn mark_completed(&self, project_id: &str, task_id: &str, subtask_id: &str) -> Result<(), RepositoryError> {
        if let Some(mut subtask) = self.storage.get_subtask(project_id, task_id, subtask_id).await? {
            subtask.completed = true;
            self.storage.set_subtask(project_id, task_id, &subtask).await
        } else {
            todo!("Subtask not found error handling")
        }
    }

    async fn mark_incomplete(&self, project_id: &str, task_id: &str, subtask_id: &str) -> Result<(), RepositoryError> {
        if let Some(mut subtask) = self.storage.get_subtask(project_id, task_id, subtask_id).await? {
            subtask.completed = false;
            self.storage.set_subtask(project_id, task_id, &subtask).await
        } else {
            todo!("Subtask not found error handling")
        }
    }

    async fn validate_subtask_exists(&self, project_id: &str, task_id: &str, subtask_id: &str) -> Result<bool, RepositoryError> {
        match self.storage.get_subtask(project_id, task_id, subtask_id).await? {
            Some(_) => Ok(true),
            None => Ok(false),
        }
    }

    async fn validate_task_exists(&self, project_id: &str, task_id: &str) -> Result<bool, RepositoryError> {
        match self.storage.get_task(project_id, task_id).await? {
            Some(_) => Ok(true),
            None => Ok(false),
        }
    }

    async fn get_subtask_count(&self, project_id: &str, task_id: &str) -> Result<u64, RepositoryError> {
        let subtasks = self.storage.list_subtasks(project_id, task_id).await?;
        Ok(subtasks.len() as u64)
    }

    async fn get_completed_subtask_count(&self, project_id: &str, task_id: &str) -> Result<u64, RepositoryError> {
        let completed_subtasks = self.find_completed_subtasks(project_id, task_id).await?;
        Ok(completed_subtasks.len() as u64)
    }

    async fn get_completion_rate(&self, project_id: &str, task_id: &str) -> Result<f32, RepositoryError> {
        let all_subtasks = self.storage.list_subtasks(project_id, task_id).await?;
        let total_count = all_subtasks.len() as f32;

        if total_count == 0.0 {
            return Ok(0.0);
        }

        let completed_count = all_subtasks
            .iter()
            .filter(|subtask| subtask.completed)
            .count() as f32;

        Ok(completed_count / total_count)
    }

    async fn mark_all_completed(&self, project_id: &str, task_id: &str) -> Result<(), RepositoryError> {
        let all_subtasks = self.storage.list_subtasks(project_id, task_id).await?;

        for mut subtask in all_subtasks {
            if !subtask.completed {
                subtask.completed = true;
                self.storage.set_subtask(project_id, task_id, &subtask).await?;
            }
        }

        Ok(())
    }

    async fn mark_all_incomplete(&self, project_id: &str, task_id: &str) -> Result<(), RepositoryError> {
        let all_subtasks = self.storage.list_subtasks(project_id, task_id).await?;

        for mut subtask in all_subtasks {
            if subtask.completed {
                subtask.completed = false;
                self.storage.set_subtask(project_id, task_id, &subtask).await?;
            }
        }

        Ok(())
    }
}
