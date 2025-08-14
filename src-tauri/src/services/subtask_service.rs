use crate::models::subtask::Subtask;
use crate::errors::service_error::ServiceError;

#[allow(dead_code)]
pub struct SubtaskService;

#[allow(dead_code)]
impl SubtaskService {
    pub async fn create_subtask(
        &self,
        project_id: &str,
        subtask: &Subtask,
    ) -> Result<(), ServiceError> {
        // 一時的に何もしない
        let _ = (project_id, subtask);
        Ok(())
    }

    pub async fn get_subtask(
        &self,
        project_id: &str,
        task_id: &str,
        subtask_id: &str,
    ) -> Result<Option<Subtask>, ServiceError> {
        // 一時的にNoneを返す
        let _ = (project_id, task_id, subtask_id);
        Ok(None)
    }

    pub async fn list_subtasks(
        &self,
        project_id: &str,
        task_id: &str,
    ) -> Result<Vec<Subtask>, ServiceError> {
        // 一時的に空のVecを返す
        let _ = (project_id, task_id);
        Ok(Vec::new())
    }

    pub async fn update_subtask(
        &self,
        project_id: &str,
        subtask: &Subtask,
    ) -> Result<(), ServiceError> {
        // 一時的に何もしない
        let _ = (project_id, subtask);
        Ok(())
    }

    pub async fn delete_subtask(
        &self,
        project_id: &str,
        task_id: &str,
        subtask_id: &str,
    ) -> Result<(), ServiceError> {
        // 一時的に何もしない
        let _ = (project_id, task_id, subtask_id);
        Ok(())
    }

    pub async fn toggle_completion(
        &self,
        project_id: &str,
        task_id: &str,
        subtask_id: &str,
    ) -> Result<(), ServiceError> {
        // 一時的に何もしない
        let _ = (project_id, task_id, subtask_id);
        Ok(())
    }
}
