use automerge::{AutomergeError, ObjType};
use crate::types::task_types::SubTask;
use crate::utils::generate_id;
use super::core::AutomergeManager;

impl AutomergeManager {
    pub fn create_subtask(&self, task_id: &str, title: String, description: Option<String>, status: Option<String>, priority: Option<i32>) -> Result<SubTask, AutomergeError> {
        let mut doc = self.doc.lock().unwrap();
        let subtask_id = generate_id();
        let now = chrono::Utc::now().timestamp_millis();

        // タスクを探して、サブタスクを追加
        let projects_obj = match doc.get(automerge::ROOT, "projects") {
            Ok(obj) => obj,
            Err(_) => return Err(AutomergeError::InvalidObjectId),
        };

        for (_, project_id) in doc.keys(&projects_obj) {
            if let Ok(project_obj) = doc.get(&projects_obj, &project_id) {
                if let Ok(task_lists_obj) = doc.get(&project_obj, "task_lists") {
                    for (_, list_id) in doc.keys(&task_lists_obj) {
                        if let Ok(list_obj) = doc.get(&task_lists_obj, &list_id) {
                            if let Ok(tasks_obj) = doc.get(&list_obj, "tasks") {
                                if let Ok(task_obj) = doc.get(&tasks_obj, task_id) {
                                    // サブタスクオブジェクトを追加
                                    let sub_tasks_obj = match doc.get(&task_obj, "sub_tasks") {
                                        Ok(obj) => obj,
                                        Err(_) => doc.put_object(&task_obj, "sub_tasks", ObjType::Map)?,
                                    };
                                    
                                    let subtask_obj = doc.put_object(&sub_tasks_obj, &subtask_id, ObjType::Map)?;
                                    doc.put(&subtask_obj, "id", &subtask_id)?;
                                    doc.put(&subtask_obj, "task_id", task_id)?;
                                    doc.put(&subtask_obj, "title", &title)?;
                                    if let Some(desc) = &description {
                                        doc.put(&subtask_obj, "description", desc)?;
                                    }
                                    doc.put(&subtask_obj, "status", status.as_deref().unwrap_or("not_started"))?;
                                    doc.put(&subtask_obj, "priority", priority.unwrap_or(0))?;
                                    doc.put(&subtask_obj, "order_index", 0)?;
                                    doc.put(&subtask_obj, "created_at", now)?;
                                    doc.put(&subtask_obj, "updated_at", now)?;
                                    doc.put_object(&subtask_obj, "tags", ObjType::Map)?;

                                    return Ok(SubTask {
                                        id: subtask_id,
                                        task_id: task_id.to_string(),
                                        title,
                                        description,
                                        status: status.unwrap_or_else(|| "not_started".to_string()),
                                        priority,
                                        start_date: None,
                                        end_date: None,
                                        order_index: 0,
                                        tags: Vec::new(),
                                        created_at: now,
                                        updated_at: now,
                                    });
                                }
                            }
                        }
                    }
                }
            }
        }

        Err(AutomergeError::InvalidObjectId)
    }

    pub fn update_subtask(&self, subtask_id: &str, title: Option<String>, description: Option<String>, status: Option<String>, priority: Option<i32>) -> Result<Option<SubTask>, AutomergeError> {
        let mut doc = self.doc.lock().unwrap();
        let now = chrono::Utc::now().timestamp_millis();

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
                                for (_, task_id_key) in doc.keys(&tasks_obj) {
                                    if let Ok(task_obj) = doc.get(&tasks_obj, &task_id_key) {
                                        if let Ok(sub_tasks_obj) = doc.get(&task_obj, "sub_tasks") {
                                            if let Ok(subtask_obj) = doc.get(&sub_tasks_obj, subtask_id) {
                                                // サブタスクを更新
                                                if let Some(t) = &title {
                                                    doc.put(&subtask_obj, "title", t)?;
                                                }
                                                if let Some(d) = &description {
                                                    doc.put(&subtask_obj, "description", d)?;
                                                }
                                                if let Some(s) = &status {
                                                    doc.put(&subtask_obj, "status", s)?;
                                                }
                                                if let Some(p) = priority {
                                                    doc.put(&subtask_obj, "priority", p)?;
                                                }
                                                doc.put(&subtask_obj, "updated_at", now)?;

                                                // 更新されたサブタスクを返す
                                                return Ok(Some(self.build_subtask_from_obj(&doc, &subtask_obj)?));
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        Ok(None)
    }

    pub fn delete_subtask(&self, subtask_id: &str) -> Result<bool, AutomergeError> {
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
                                for (_, task_id_key) in doc.keys(&tasks_obj) {
                                    if let Ok(task_obj) = doc.get(&tasks_obj, &task_id_key) {
                                        if let Ok(sub_tasks_obj) = doc.get(&task_obj, "sub_tasks") {
                                            if doc.get(&sub_tasks_obj, subtask_id).is_ok() {
                                                return match doc.delete(&sub_tasks_obj, subtask_id) {
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
                }
            }
        }

        Ok(false)
    }
}