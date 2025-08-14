use crate::models::task_list::TaskList;
use crate::models::command::task_list::TaskListSearchRequest;
use crate::errors::service_error::ServiceError;

#[allow(dead_code)]
pub struct TaskListService;

#[allow(dead_code)]
impl TaskListService {
    pub async fn create_task_list(
        &self,
        task_list: &TaskList,
    ) -> Result<(), ServiceError> {
        // 一時的に何もしない
        let _ = task_list;
        Ok(())
    }

    pub async fn get_task_list(
        &self,
        id: &str,
    ) -> Result<Option<TaskList>, ServiceError> {
        // 一時的にNoneを返す
        let _ = id;
        Ok(None)
    }

    pub async fn update_task_list(
        &self,
        task_list: &TaskList,
    ) -> Result<(), ServiceError> {
        // 一時的に何もしない
        let _ = task_list;
        Ok(())
    }

    pub async fn delete_task_list(
        &self,
        id: &str,
    ) -> Result<(), ServiceError> {
        // 一時的に何もしない
        let _ = id;
        Ok(())
    }

    pub async fn search_task_lists(
        &self,
        condition: &TaskListSearchRequest,
    ) -> Result<Vec<TaskList>, ServiceError> {
        // 一時的に空のVecを返す
        let _ = condition;
        Ok(Vec::new())
    }

    pub async fn list_task_lists(
        &self,
        project_id: &str,
    ) -> Result<Vec<TaskList>, ServiceError> {
        // 一時的に空のVecを返す
        let _ = project_id;
        Ok(Vec::new())
    }
}