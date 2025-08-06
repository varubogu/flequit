use automerge::{AutomergeError, ObjType};
use crate::types::task_types::TaskWithSubTasks;
use crate::utils::generate_id;
use super::core::AutomergeManager;

impl AutomergeManager {
    pub fn create_task_with_subtasks(&self, list_id: String, title: String, description: Option<String>, status: Option<String>, priority: Option<i32>, start_date: Option<i64>, end_date: Option<i64>) -> Result<TaskWithSubTasks, AutomergeError> {
        let mut doc = self.doc.lock().unwrap();
        let task_id = generate_id();
        let now = chrono::Utc::now().timestamp_millis();

        // Find the task list
        let projects_obj = doc.get(automerge::ROOT, "projects")?;
        let mut tasks_obj = None;

        for (_, project_id) in doc.keys(&projects_obj) {
            if let Ok(project_obj) = doc.get(&projects_obj, &project_id) {
                if let Ok(task_lists_obj) = doc.get(&project_obj, "task_lists") {
                    if let Ok(list_obj) = doc.get(&task_lists_obj, &list_id) {
                        tasks_obj = Some(doc.get(&list_obj, "tasks")?);
                        break;
                    }
                }
            }
        }

        let tasks_obj = tasks_obj.ok_or_else(|| AutomergeError::InvalidObjectId)?;
        let task_obj = doc.put_object(&tasks_obj, &task_id, ObjType::Map)?;

        doc.put(&task_obj, "id", &task_id)?;
        doc.put(&task_obj, "list_id", &list_id)?;
        doc.put(&task_obj, "title", &title)?;
        doc.put(&task_obj, "description", &description.unwrap_or_default())?;
        doc.put(&task_obj, "status", &status.unwrap_or("not_started".to_string()))?;
        doc.put(&task_obj, "priority", priority.unwrap_or(0))?;
        if let Some(start_date) = start_date {
            doc.put(&task_obj, "start_date", start_date)?;
        }
        if let Some(end_date) = end_date {
            doc.put(&task_obj, "end_date", end_date)?;
        }
        doc.put(&task_obj, "order_index", 0)?;
        doc.put(&task_obj, "is_archived", false)?;
        doc.put(&task_obj, "created_at", now)?;
        doc.put(&task_obj, "updated_at", now)?;

        // Initialize empty sub_tasks and tags
        doc.put_object(&task_obj, "sub_tasks", ObjType::Map)?;
        doc.put_object(&task_obj, "tags", ObjType::Map)?;

        Ok(TaskWithSubTasks {
            id: task_id,
            list_id,
            title,
            description,
            status: status.unwrap_or("not_started".to_string()),
            priority: priority.unwrap_or(0),
            start_date,
            end_date,
            order_index: 0,
            is_archived: false,
            created_at: now,
            updated_at: now,
            sub_tasks: vec![],
            tags: vec![],
        })
    }

    pub fn update_task_with_subtasks(&self, task_id: &str, title: Option<String>, description: Option<String>, status: Option<String>, priority: Option<i32>, start_date: Option<i64>, end_date: Option<i64>) -> Result<Option<TaskWithSubTasks>, AutomergeError> {
        let mut doc = self.doc.lock().unwrap();
        let now = chrono::Utc::now().timestamp_millis();

        // Find the task
        let projects_obj = match doc.get(automerge::ROOT, "projects") {
            Ok(obj) => obj,
            Err(_) => return Ok(None),
        };

        for (_, project_id) in doc.keys(&projects_obj) {
            if let Ok(project_obj) = doc.get(&projects_obj, &project_id) {
                if let Ok(task_lists_obj) = doc.get(&project_obj, "task_lists") {
                    for (_, list_id) in doc.keys(&task_lists_obj) {
                        if let Ok(list_obj) = doc.get(&task_lists_obj, &list_id) {
                            if let Ok(tasks_obj) = doc.get(&list_obj, "tasks") {
                                if let Ok(task_obj) = doc.get(&tasks_obj, task_id) {
                                    if let Some(title) = title {
                                        doc.put(&task_obj, "title", title)?;
                                    }
                                    if let Some(description) = description {
                                        doc.put(&task_obj, "description", description)?;
                                    }
                                    if let Some(status) = status {
                                        doc.put(&task_obj, "status", status)?;
                                    }
                                    if let Some(priority) = priority {
                                        doc.put(&task_obj, "priority", priority)?;
                                    }
                                    if let Some(start_date) = start_date {
                                        doc.put(&task_obj, "start_date", start_date)?;
                                    }
                                    if let Some(end_date) = end_date {
                                        doc.put(&task_obj, "end_date", end_date)?;
                                    }
                                    doc.put(&task_obj, "updated_at", now)?;

                                    return Ok(Some(self.build_task_from_obj(&doc, &task_obj)?));
                                }
                            }
                        }
                    }
                }
            }
        }

        Ok(None)
    }

    pub fn delete_task_with_subtasks(&self, task_id: &str) -> Result<bool, AutomergeError> {
        let mut doc = self.doc.lock().unwrap();

        let projects_obj = match doc.get(automerge::ROOT, "projects") {
            Ok(obj) => obj,
            Err(_) => return Ok(false),
        };

        for (_, project_id) in doc.keys(&projects_obj) {
            if let Ok(project_obj) = doc.get(&projects_obj, &project_id) {
                if let Ok(task_lists_obj) = doc.get(&project_obj, "task_lists") {
                    for (_, list_id) in doc.keys(&task_lists_obj) {
                        if let Ok(list_obj) = doc.get(&task_lists_obj, &list_id) {
                            if let Ok(tasks_obj) = doc.get(&list_obj, "tasks") {
                                if doc.get(&tasks_obj, task_id).is_ok() {
                                    return match doc.delete(&tasks_obj, task_id) {
                                        Ok(_) => Ok(true),
                                        Err(_) => Ok(false),
                                    };
                                }
                            }
                        }
                    }
                }
            }
        }

        Ok(false)
    }
}