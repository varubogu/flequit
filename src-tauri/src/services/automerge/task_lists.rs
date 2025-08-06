use automerge::{AutomergeError, ObjType};
use crate::types::{TaskListWithTasks, AutomergeInterface};
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
        
        // 構造体を作成
        let task_list = TaskListWithTasks {
            id: task_list_id.clone(),
            project_id,
            name,
            description,
            color,
            order_index: 0,
            is_archived: false,
            created_at: now,
            updated_at: now,
            tasks: vec![],
        };

        // 新しいインターフェースで一括書き込み
        let list_obj = doc.put_struct(&task_lists_obj, &task_list_id, &task_list)?;
        
        // Initialize empty tasks
        doc.put_object(&list_obj, "tasks", ObjType::Map)?;

        Ok(task_list)
    }

    pub fn update_task_list(&self, task_list_id: &str, name: Option<String>, description: Option<String>, color: Option<String>) -> Result<Option<TaskListWithTasks>, AutomergeError> {
        let mut doc = self.doc.lock().unwrap();
        let now = chrono::Utc::now().timestamp_millis();

        // Find the task list
        let (task_lists_obj, list_obj) = match self.find_task_list_with_parent(&doc, task_list_id)? {
            Some((parent, obj)) => (parent, obj),
            None => return Ok(None),
        };

        // 既存のタスクリストを読み込み
        let mut existing_task_list = doc.get_struct_safe::<TaskListWithTasks>(&list_obj)?;
        
        // フィールドを更新
        if let Some(n) = name {
            existing_task_list.name = n;
        }
        if let Some(d) = description {
            existing_task_list.description = d;
        }
        if let Some(c) = color {
            existing_task_list.color = c;
        }
        existing_task_list.updated_at = now;

        // 構造体を一括で書き込み直し
        doc.put_struct(&task_lists_obj, task_list_id, &existing_task_list)?;

        Ok(Some(existing_task_list))
    }

    pub fn delete_task_list(&self, task_list_id: &str) -> Result<bool, AutomergeError> {
        let mut doc = self.doc.lock().unwrap();

        let (task_lists_obj, _) = match self.find_task_list_with_parent(&doc, task_list_id)? {
            Some((parent, obj)) => (parent, obj),
            None => return Ok(false),
        };

        match doc.delete(&task_lists_obj, task_list_id) {
            Ok(_) => Ok(true),
            Err(_) => Ok(false),
        }
    }

    // ヘルパー関数：タスクリストオブジェクトとその親オブジェクトを検索
    fn find_task_list_with_parent(&self, doc: &automerge::Automerge, task_list_id: &str) -> Result<Option<(automerge::ObjId, automerge::ObjId)>, AutomergeError> {
        let projects_obj = doc.get(automerge::ROOT, "projects").ok()?;
        
        for (_, project_id) in doc.keys(&projects_obj) {
            let project_obj = doc.get(&projects_obj, &project_id).ok()?;
            let task_lists_obj = doc.get(&project_obj, "task_lists").ok()?;
            
            if let Ok(task_list_obj) = doc.get(&task_lists_obj, task_list_id) {
                return Ok(Some((task_lists_obj, task_list_obj)));
            }
        }
        
        Ok(None)
    }
}