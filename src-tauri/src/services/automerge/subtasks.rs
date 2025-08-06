use automerge::{AutomergeError, ObjType};
use crate::types::{SubTask, AutomergeInterface, ensure_collection, get_object_entry, get_keys, find_task_object, find_subtask_object};
use crate::utils::generate_id;
use super::core::AutomergeManager;

impl AutomergeManager {
    pub fn create_subtask(&self, task_id: &str, title: String, description: Option<String>, status: Option<String>, priority: Option<i32>) -> Result<SubTask, AutomergeError> {
        let mut doc = self.doc.lock().unwrap();
        let subtask_id = generate_id();
        let now = chrono::Utc::now().timestamp_millis();

        let task_obj = find_task_object(&doc, task_id)?
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


    // ヘルパー関数：サブタスクオブジェクトとその親オブジェクトを検索
    fn find_subtask_with_parent(&self, doc: &automerge::Automerge, subtask_id: &str) -> Result<Option<(automerge::ObjId, automerge::ObjId)>, AutomergeError> {
        let Some((_, projects_obj)) = get_object_entry(doc, &automerge::ROOT, "projects") else {
            return Ok(None);
        };

        for project_id in get_keys(doc, &projects_obj) {
            let Some((_, project_obj)) = get_object_entry(doc, &projects_obj, &project_id) else { continue; };
            let Some((_, task_lists_obj)) = get_object_entry(doc, &project_obj, "task_lists") else { continue; };
            
            for list_id in get_keys(doc, &task_lists_obj) {
                let Some((_, list_obj)) = get_object_entry(doc, &task_lists_obj, &list_id) else { continue; };
                let Some((_, tasks_obj)) = get_object_entry(doc, &list_obj, "tasks") else { continue; };
                
                for task_id_key in get_keys(doc, &tasks_obj) {
                    let Some((_, task_obj)) = get_object_entry(doc, &tasks_obj, &task_id_key) else { continue; };
                    let Some((_, sub_tasks_obj)) = get_object_entry(doc, &task_obj, "sub_tasks") else { continue; };
                    
                    if let Some((_, subtask_obj)) = get_object_entry(doc, &sub_tasks_obj, subtask_id) {
                        return Ok(Some((sub_tasks_obj, subtask_obj)));
                    }
                }
            }
        }
        
        Ok(None)
    }
}