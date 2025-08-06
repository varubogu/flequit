use automerge::{AutomergeError, ObjType};
use crate::types::{SubTask, AutomergeInterface, ensure_collection, get_object_entry, get_keys};
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
        let (_, sub_tasks_obj) = ensure_collection(&mut doc, &task_obj, "sub_tasks")?;
        
        // 構造体を作成
        let subtask = SubTask {
            id: subtask_id.clone(),
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
        };

        // 新しいインターフェースで一括書き込み
        doc.put_struct(&sub_tasks_obj, &subtask_id, &subtask)?;

        Ok(subtask)
    }

    pub fn update_subtask(&self, subtask_id: &str, title: Option<String>, description: Option<String>, status: Option<String>, priority: Option<i32>) -> Result<Option<SubTask>, AutomergeError> {
        let mut doc = self.doc.lock().unwrap();
        let now = chrono::Utc::now().timestamp_millis();

        let (sub_tasks_obj, subtask_obj) = match self.find_subtask_with_parent(&doc, subtask_id)? {
            Some((parent, obj)) => (parent, obj),
            None => return Ok(None),
        };

        // 既存のサブタスクを読み込み
        let mut existing_subtask = doc.get_struct_safe::<SubTask>(&subtask_obj)?;
        
        // フィールドを更新
        if let Some(t) = title {
            existing_subtask.title = t;
        }
        if let Some(d) = description {
            existing_subtask.description = d;
        }
        if let Some(s) = status {
            existing_subtask.status = s;
        }
        if let Some(p) = priority {
            existing_subtask.priority = Some(p);
        }
        existing_subtask.updated_at = now;

        // 構造体を一括で書き込み直し
        doc.put_struct(&sub_tasks_obj, subtask_id, &existing_subtask)?;

        Ok(Some(existing_subtask))
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