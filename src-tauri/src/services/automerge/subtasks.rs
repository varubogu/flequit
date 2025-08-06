use automerge::{AutomergeError, ObjType};
use crate::types::task_types::SubTask;
use crate::utils::generate_id;
use super::core::AutomergeManager;

impl AutomergeManager {
    pub fn create_subtask(&self, task_id: &str, title: String, description: Option<String>, status: Option<String>, priority: Option<i32>) -> Result<SubTask, AutomergeError> {
        let mut doc = self.doc.lock().unwrap();
        let subtask_id = generate_id();
        let now = chrono::Utc::now().timestamp_millis();

        let task_obj = self.find_task_obj(&doc, task_id)?
            .ok_or(AutomergeError::InvalidObjectId)?;

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

        Ok(SubTask {
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
        })
    }

    pub fn update_subtask(&self, subtask_id: &str, title: Option<String>, description: Option<String>, status: Option<String>, priority: Option<i32>) -> Result<Option<SubTask>, AutomergeError> {
        let mut doc = self.doc.lock().unwrap();
        let now = chrono::Utc::now().timestamp_millis();

        let subtask_obj = match self.find_subtask_obj(&doc, subtask_id)? {
            Some(obj) => obj,
            None => return Ok(None),
        };

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
        Ok(Some(self.build_subtask_from_obj(&doc, &subtask_obj)?))
    }

    pub fn delete_subtask(&self, subtask_id: &str) -> Result<bool, AutomergeError> {
        let mut doc = self.doc.lock().unwrap();

        let (sub_tasks_obj, _) = match self.find_subtask_with_parent(&doc, subtask_id)? {
            Some(result) => result,
            None => return Ok(false),
        };

        match doc.delete(&sub_tasks_obj, subtask_id) {
            Ok(_) => Ok(true),
            Err(_) => Ok(false),
        }
    }

    // ヘルパー関数：タスクオブジェクトを検索
    fn find_task_obj(&self, doc: &automerge::Automerge, task_id: &str) -> Result<Option<automerge::ObjId>, AutomergeError> {
        let projects_obj = doc.get(automerge::ROOT, "projects").ok()?;
        
        for (_, project_id) in doc.keys(&projects_obj) {
            let project_obj = doc.get(&projects_obj, &project_id).ok()?;
            let task_lists_obj = doc.get(&project_obj, "task_lists").ok()?;
            
            for (_, list_id) in doc.keys(&task_lists_obj) {
                let list_obj = doc.get(&task_lists_obj, &list_id).ok()?;
                let tasks_obj = doc.get(&list_obj, "tasks").ok()?;
                
                if let Ok(task_obj) = doc.get(&tasks_obj, task_id) {
                    return Ok(Some(task_obj));
                }
            }
        }
        
        Ok(None)
    }

    // ヘルパー関数：サブタスクオブジェクトを検索
    fn find_subtask_obj(&self, doc: &automerge::Automerge, subtask_id: &str) -> Result<Option<automerge::ObjId>, AutomergeError> {
        let projects_obj = doc.get(automerge::ROOT, "projects").ok()?;
        
        for (_, project_id) in doc.keys(&projects_obj) {
            let project_obj = doc.get(&projects_obj, &project_id).ok()?;
            let task_lists_obj = doc.get(&project_obj, "task_lists").ok()?;
            
            for (_, list_id) in doc.keys(&task_lists_obj) {
                let list_obj = doc.get(&task_lists_obj, &list_id).ok()?;
                let tasks_obj = doc.get(&list_obj, "tasks").ok()?;
                
                for (_, task_id_key) in doc.keys(&tasks_obj) {
                    let task_obj = doc.get(&tasks_obj, &task_id_key).ok()?;
                    let sub_tasks_obj = doc.get(&task_obj, "sub_tasks").ok()?;
                    
                    if let Ok(subtask_obj) = doc.get(&sub_tasks_obj, subtask_id) {
                        return Ok(Some(subtask_obj));
                    }
                }
            }
        }
        
        Ok(None)
    }

    // ヘルパー関数：サブタスクオブジェクトとその親オブジェクトを検索
    fn find_subtask_with_parent(&self, doc: &automerge::Automerge, subtask_id: &str) -> Result<Option<(automerge::ObjId, automerge::ObjId)>, AutomergeError> {
        let projects_obj = doc.get(automerge::ROOT, "projects").ok()?;
        
        for (_, project_id) in doc.keys(&projects_obj) {
            let project_obj = doc.get(&projects_obj, &project_id).ok()?;
            let task_lists_obj = doc.get(&project_obj, "task_lists").ok()?;
            
            for (_, list_id) in doc.keys(&task_lists_obj) {
                let list_obj = doc.get(&task_lists_obj, &list_id).ok()?;
                let tasks_obj = doc.get(&list_obj, "tasks").ok()?;
                
                for (_, task_id_key) in doc.keys(&tasks_obj) {
                    let task_obj = doc.get(&tasks_obj, &task_id_key).ok()?;
                    let sub_tasks_obj = doc.get(&task_obj, "sub_tasks").ok()?;
                    
                    if let Ok(subtask_obj) = doc.get(&sub_tasks_obj, subtask_id) {
                        return Ok(Some((sub_tasks_obj, subtask_obj)));
                    }
                }
            }
        }
        
        Ok(None)
    }
}