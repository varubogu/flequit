use automerge::{AutomergeError, ObjType};
use crate::types::task_types::Task;
use crate::utils::generate_id;
use super::core::AutomergeManager;

impl AutomergeManager {
    pub fn create_task(&self, title: String, description: String) -> Result<Task, AutomergeError> {
        let mut doc = self.doc.lock().unwrap();
        let task_id = generate_id();
        let now = chrono::Utc::now().timestamp_millis();

        let task = Task {
            id: task_id.clone(),
            title,
            description,
            completed: false,
            created_at: now,
            updated_at: now,
        };

        // Initialize tasks map if it doesn't exist
        if doc.get(automerge::ROOT, "tasks").is_err() {
            doc.put_object(automerge::ROOT, "tasks", ObjType::Map)?;
        }

        let tasks_obj = doc.get(automerge::ROOT, "tasks")?;
        let task_obj = doc.put_object(&tasks_obj, &task_id, ObjType::Map)?;

        doc.put(&task_obj, "id", &task.id)?;
        doc.put(&task_obj, "title", &task.title)?;
        doc.put(&task_obj, "description", &task.description)?;
        doc.put(&task_obj, "completed", task.completed)?;
        doc.put(&task_obj, "created_at", task.created_at)?;
        doc.put(&task_obj, "updated_at", task.updated_at)?;

        Ok(task)
    }

    pub fn get_task(&self, task_id: &str) -> Result<Option<Task>, AutomergeError> {
        let doc = self.doc.lock().unwrap();
        
        let tasks_obj = match doc.get(automerge::ROOT, "tasks") {
            Ok(obj) => obj,
            Err(_) => return Ok(None),
        };

        let task_obj = match doc.get(&tasks_obj, task_id) {
            Ok(obj) => obj,
            Err(_) => return Ok(None),
        };

        let id: String = doc.get(&task_obj, "id")?.into();
        let title: String = doc.get(&task_obj, "title")?.into();
        let description: String = doc.get(&task_obj, "description")?.into();
        let completed: bool = doc.get(&task_obj, "completed")?.into();
        let created_at: i64 = doc.get(&task_obj, "created_at")?.into();
        let updated_at: i64 = doc.get(&task_obj, "updated_at")?.into();

        Ok(Some(Task {
            id,
            title,
            description,
            completed,
            created_at,
            updated_at,
        }))
    }

    pub fn get_all_tasks(&self) -> Result<Vec<Task>, AutomergeError> {
        let doc = self.doc.lock().unwrap();
        let mut tasks = Vec::new();

        if let Some((_, tasks_obj)) = get_object_entry(&doc, &automerge::ROOT, "tasks") {
            for task_id in get_keys(&doc, &tasks_obj) {
                if let Some((_, task_obj)) = get_object_entry(&doc, &tasks_obj, &task_id) {
                    if let Ok(task) = doc.get_struct_safe::<Task>(&task_obj) {
                        tasks.push(task);
                    }
                }
            }
        }

        Ok(tasks)
    }

    pub fn update_task(&self, task_id: &str, title: Option<String>, description: Option<String>, completed: Option<bool>) -> Result<Option<Task>, AutomergeError> {
        let mut doc = self.doc.lock().unwrap();
        let now = chrono::Utc::now().timestamp_millis();

        if let Some((_, tasks_obj)) = get_object_entry(&doc, &automerge::ROOT, "tasks") {
            if let Some((_, task_obj)) = get_object_entry(&doc, &tasks_obj, task_id) {
                // Get current task
                let mut task = doc.get_struct_safe::<Task>(&task_obj)?;
                
                // Update fields if provided
                if let Some(new_title) = title {
                    task.title = new_title;
                }
                if let Some(new_description) = description {
                    task.description = new_description;
                }
                if let Some(new_completed) = completed {
                    task.completed = new_completed;
                }
                task.updated_at = now;
                
                // Save the updated task using put_struct
                doc.put_struct(&tasks_obj, task_id, &task)?;
                
                return Ok(Some(task));
            }
        }
        Ok(None)
    }

    pub fn delete_task(&self, task_id: &str) -> Result<bool, AutomergeError> {
        let mut doc = self.doc.lock().unwrap();

        if let Some((_, tasks_obj)) = get_object_entry(&doc, &automerge::ROOT, "tasks") {
            match doc.delete(&tasks_obj, task_id) {
                Ok(_) => Ok(true),
                Err(_) => Ok(false),
            }
        } else {
            Ok(false)
        }
    }
}