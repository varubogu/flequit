use automerge::{AutomergeError, ObjType};
use crate::types::{Tag, AutomergeInterface, ensure_collection, get_object_entry, get_keys};
use crate::utils::generate_id;
use super::core::AutomergeManager;

impl AutomergeManager {
    pub fn create_tag(&self, name: String, color: Option<String>) -> Result<Tag, AutomergeError> {
        let mut doc = self.doc.lock().unwrap();
        let tag_id = generate_id();
        let now = chrono::Utc::now().timestamp_millis();

        // タグコレクションを初期化（存在しない場合）
        let (_, tags_obj) = ensure_collection(&mut doc, &automerge::ROOT, "tags")?;

        // 構造体を作成
        let tag = Tag {
            id: tag_id.clone(),
            name,
            color,
            created_at: now,
            updated_at: now,
        };

        // 新しいインターフェースで一括書き込み
        doc.put_struct(&tags_obj, &tag_id, &tag)?;

        Ok(tag)
    }

    pub fn update_tag(&self, tag_id: &str, name: Option<String>, color: Option<String>) -> Result<Option<Tag>, AutomergeError> {
        let mut doc = self.doc.lock().unwrap();
        let now = chrono::Utc::now().timestamp_millis();

        if let Some((_, tags_obj)) = get_object_entry(&doc, &automerge::ROOT, "tags") {
            if let Some((_, tag_obj)) = get_object_entry(&doc, &tags_obj, tag_id) {
                // 既存のタグを読み込み
                let mut existing_tag = doc.get_struct_safe::<Tag>(&tag_obj)?;
                
                // フィールドを更新
                if let Some(n) = name {
                    existing_tag.name = n;
                }
                if let Some(c) = color {
                    existing_tag.color = c;
                }
                existing_tag.updated_at = now;

                // 構造体を一括で書き込み直し
                doc.put_struct(&tags_obj, tag_id, &existing_tag)?;

                return Ok(Some(existing_tag));
            }
        }

        Ok(None)
    }

    pub fn delete_tag(&self, tag_id: &str) -> Result<bool, AutomergeError> {
        let mut doc = self.doc.lock().unwrap();

        if let Some((_, tags_obj)) = get_object_entry(&doc, &automerge::ROOT, "tags") {
            if get_object_entry(&doc, &tags_obj, tag_id).is_some() {
                match doc.delete(&tags_obj, tag_id) {
                    Ok(_) => Ok(true),
                    Err(_) => Ok(false),
                }
            } else {
                Ok(false)
            }
        } else {
            Ok(false)
        }
    }

    pub fn get_all_tags(&self) -> Result<Vec<Tag>, AutomergeError> {
        let doc = self.doc.lock().unwrap();
        let mut tags = Vec::new();

        if let Some((_, tags_obj)) = get_object_entry(&doc, &automerge::ROOT, "tags") {
            for tag_id in get_keys(&doc, &tags_obj) {
                if let Some((_, tag_obj)) = get_object_entry(&doc, &tags_obj, &tag_id) {
                    // 新しいインターフェースでバージョン互換性を考慮して読み込み
                    let tag = doc.get_struct_safe::<Tag>(&tag_obj)?;
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