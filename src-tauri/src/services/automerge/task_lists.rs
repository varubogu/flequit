use automerge::{AutomergeError, ObjType};
use crate::types::task_types::TaskListWithTasks;
use crate::utils::generate_id;
use super::core::AutomergeManager;

impl AutomergeManager {
    pub fn create_task_list(&self, project_id: String, name: String, description: Option<String>, color: Option<String>) -> Result<TaskListWithTasks, AutomergeError> {
        let mut doc = self.doc.lock().unwrap();
        let task_list_id = generate_id();
        let now = chrono::Utc::now().timestamp_millis();

        let projects_obj = doc.get(automerge::ROOT, "projects")?;
        let project_obj = doc.get(&projects_obj, &project_id)?;
        let task_lists_obj = doc.get(&project_obj, "task_lists")?;
        
        let list_obj = doc.put_object(&task_lists_obj, &task_list_id, ObjType::Map)?;

        doc.put(&list_obj, "id", &task_list_id)?;
        doc.put(&list_obj, "project_id", &project_id)?;
        doc.put(&list_obj, "name", &name)?;
        doc.put(&list_obj, "description", &description.unwrap_or_default())?;
        doc.put(&list_obj, "color", &color.unwrap_or_default())?;
        doc.put(&list_obj, "order_index", 0)?;
        doc.put(&list_obj, "is_archived", false)?;
        doc.put(&list_obj, "created_at", now)?;
        doc.put(&list_obj, "updated_at", now)?;

        // Initialize empty tasks
        doc.put_object(&list_obj, "tasks", ObjType::Map)?;

        Ok(TaskListWithTasks {
            id: task_list_id,
            project_id,
            name,
            description,
            color,
            order_index: 0,
            is_archived: false,
            created_at: now,
            updated_at: now,
            tasks: vec![],
        })
    }

    pub fn update_task_list(&self, task_list_id: &str, name: Option<String>, description: Option<String>, color: Option<String>) -> Result<Option<TaskListWithTasks>, AutomergeError> {
        let mut doc = self.doc.lock().unwrap();
        let now = chrono::Utc::now().timestamp_millis();

        // Find the task list
        let projects_obj = match doc.get(automerge::ROOT, "projects") {
            Ok(obj) => obj,
            Err(_) => return Ok(None),
        };

        for (_, project_id) in doc.keys(&projects_obj) {
            if let Ok(project_obj) = doc.get(&projects_obj, &project_id) {
                if let Ok(task_lists_obj) = doc.get(&project_obj, "task_lists") {
                    if let Ok(list_obj) = doc.get(&task_lists_obj, task_list_id) {
                        if let Some(name) = name {
                            doc.put(&list_obj, "name", name)?;
                        }
                        if let Some(description) = description {
                            doc.put(&list_obj, "description", description)?;
                        }
                        if let Some(color) = color {
                            doc.put(&list_obj, "color", color)?;
                        }
                        doc.put(&list_obj, "updated_at", now)?;

                        return Ok(Some(self.build_task_list_from_obj(&doc, &list_obj)?));
                    }
                }
            }
        }

        Ok(None)
    }

    pub fn delete_task_list(&self, task_list_id: &str) -> Result<bool, AutomergeError> {
        let mut doc = self.doc.lock().unwrap();

        let projects_obj = match doc.get(automerge::ROOT, "projects") {
            Ok(obj) => obj,
            Err(_) => return Ok(false),
        };

        for (_, project_id) in doc.keys(&projects_obj) {
            if let Ok(project_obj) = doc.get(&projects_obj, &project_id) {
                if let Ok(task_lists_obj) = doc.get(&project_obj, "task_lists") {
                    if doc.get(&task_lists_obj, task_list_id).is_ok() {
                        return match doc.delete(&task_lists_obj, task_list_id) {
                            Ok(_) => Ok(true),
                            Err(_) => Ok(false),
                        };
                    }
                }
            }
        }

        Ok(false)
    }
}