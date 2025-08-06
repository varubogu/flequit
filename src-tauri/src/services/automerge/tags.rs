use automerge::{AutomergeError, ObjType};
use crate::types::task_types::Tag;
use crate::utils::generate_id;
use super::core::AutomergeManager;

impl AutomergeManager {
    pub fn create_tag(&self, name: String, color: Option<String>) -> Result<Tag, AutomergeError> {
        let mut doc = self.doc.lock().unwrap();
        let tag_id = generate_id();
        let now = chrono::Utc::now().timestamp_millis();

        // タグコレクションを初期化（存在しない場合）
        let tags_obj = match doc.get(automerge::ROOT, "tags") {
            Ok(obj) => obj,
            Err(_) => doc.put_object(automerge::ROOT, "tags", ObjType::Map)?,
        };

        let tag_obj = doc.put_object(&tags_obj, &tag_id, ObjType::Map)?;
        doc.put(&tag_obj, "id", &tag_id)?;
        doc.put(&tag_obj, "name", &name)?;
        if let Some(color_val) = &color {
            doc.put(&tag_obj, "color", color_val)?;
        }
        doc.put(&tag_obj, "created_at", now)?;
        doc.put(&tag_obj, "updated_at", now)?;

        Ok(Tag {
            id: tag_id,
            name,
            color,
            created_at: now,
            updated_at: now,
        })
    }

    pub fn update_tag(&self, tag_id: &str, name: Option<String>, color: Option<String>) -> Result<Option<Tag>, AutomergeError> {
        let mut doc = self.doc.lock().unwrap();
        let now = chrono::Utc::now().timestamp_millis();

        let tags_obj = match doc.get(automerge::ROOT, "tags") {
            Ok(obj) => obj,
            Err(_) => return Ok(None),
        };

        if let Ok(tag_obj) = doc.get(&tags_obj, tag_id) {
            if let Some(n) = &name {
                doc.put(&tag_obj, "name", n)?;
            }
            if let Some(c) = &color {
                doc.put(&tag_obj, "color", c)?;
            }
            doc.put(&tag_obj, "updated_at", now)?;

            // 更新されたタグを返す
            return Ok(Some(self.build_tag_from_obj(&doc, &tag_obj)?));
        }

        Ok(None)
    }

    pub fn delete_tag(&self, tag_id: &str) -> Result<bool, AutomergeError> {
        let mut doc = self.doc.lock().unwrap();

        let tags_obj = match doc.get(automerge::ROOT, "tags") {
            Ok(obj) => obj,
            Err(_) => return Ok(false),
        };

        if doc.get(&tags_obj, tag_id).is_ok() {
            match doc.delete(&tags_obj, tag_id) {
                Ok(_) => Ok(true),
                Err(_) => Ok(false),
            }
        } else {
            Ok(false)
        }
    }

    pub fn get_all_tags(&self) -> Result<Vec<Tag>, AutomergeError> {
        let doc = self.doc.lock().unwrap();
        let mut tags = Vec::new();

        if let Ok(tags_obj) = doc.get(automerge::ROOT, "tags") {
            for (_, tag_id) in doc.keys(&tags_obj) {
                if let Ok(tag_obj) = doc.get(&tags_obj, &tag_id) {
                    let tag = self.build_tag_from_obj(&doc, &tag_obj)?;
                    tags.push(tag);
                }
            }
        }

        Ok(tags)
    }

    // タスク-タグ関連付け管理
    pub fn add_tag_to_task(&self, task_id: &str, tag_id: &str) -> Result<bool, AutomergeError> {
        let mut doc = self.doc.lock().unwrap();
        
        let task_obj = match self.find_task_obj(&doc, task_id)? {
            Some(obj) => obj,
            None => return Ok(false),
        };

        let tags_obj = match doc.get(&task_obj, "tags") {
            Ok(obj) => obj,
            Err(_) => doc.put_object(&task_obj, "tags", ObjType::Map)?,
        };
        
        // タグの参照を追加
        let tag_ref_obj = doc.put_object(&tags_obj, tag_id, ObjType::Map)?;
        doc.put(&tag_ref_obj, "id", tag_id)?;
        Ok(true)
    }

    pub fn remove_tag_from_task(&self, task_id: &str, tag_id: &str) -> Result<bool, AutomergeError> {
        let mut doc = self.doc.lock().unwrap();

        let task_obj = match self.find_task_obj(&doc, task_id)? {
            Some(obj) => obj,
            None => return Ok(false),
        };

        let tags_obj = doc.get(&task_obj, "tags").ok()?;
        
        if doc.get(&tags_obj, tag_id).is_err() {
            return Ok(false);
        }

        match doc.delete(&tags_obj, tag_id) {
            Ok(_) => Ok(true),
            Err(_) => Ok(false),
        }
    }

    pub fn add_tag_to_subtask(&self, subtask_id: &str, tag_id: &str) -> Result<bool, AutomergeError> {
        let mut doc = self.doc.lock().unwrap();

        // タグが存在するかチェック
        let tags_obj = doc.get(automerge::ROOT, "tags").ok()?;
        if doc.get(&tags_obj, tag_id).is_err() {
            return Ok(false); // タグが存在しない
        }

        let subtask_obj = match self.find_subtask_obj(&doc, subtask_id)? {
            Some(obj) => obj,
            None => return Ok(false),
        };

        // サブタスクのタグマップを取得または作成
        let subtask_tags_obj = match doc.get(&subtask_obj, "tags") {
            Ok(obj) => obj,
            Err(_) => doc.put_object(&subtask_obj, "tags", ObjType::Map)?,
        };

        // タグの参照を追加
        let tag_ref_obj = doc.put_object(&subtask_tags_obj, tag_id, ObjType::Map)?;
        doc.put(&tag_ref_obj, "id", tag_id)?;

        // サブタスクの更新日時を更新
        let now = chrono::Utc::now().timestamp_millis();
        doc.put(&subtask_obj, "updated_at", now)?;

        Ok(true)
    }

    pub fn remove_tag_from_subtask(&self, subtask_id: &str, tag_id: &str) -> Result<bool, AutomergeError> {
        let mut doc = self.doc.lock().unwrap();

        let subtask_obj = match self.find_subtask_obj(&doc, subtask_id)? {
            Some(obj) => obj,
            None => return Ok(false),
        };

        let subtask_tags_obj = doc.get(&subtask_obj, "tags").ok()?;
        
        if doc.get(&subtask_tags_obj, tag_id).is_err() {
            return Ok(false);
        }

        match doc.delete(&subtask_tags_obj, tag_id) {
            Ok(_) => {
                // サブタスクの更新日時を更新
                let now = chrono::Utc::now().timestamp_millis();
                doc.put(&subtask_obj, "updated_at", now)?;
                Ok(true)
            }
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
}