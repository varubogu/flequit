use automerge::AutomergeError;
use crate::types::{Tag, AutomergeInterface, ensure_collection, get_object_entry, get_keys, find_task_object, find_subtask_object, add_tag_to_object, remove_tag_from_object, tag_exists, update_timestamp};
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
        
        let task_obj = match find_task_object(&doc, task_id)? {
            Some(obj) => obj,
            None => return Ok(false),
        };

        add_tag_to_object(&mut doc, &task_obj, tag_id)
    }

    pub fn remove_tag_from_task(&self, task_id: &str, tag_id: &str) -> Result<bool, AutomergeError> {
        let mut doc = self.doc.lock().unwrap();

        let task_obj = match find_task_object(&doc, task_id)? {
            Some(obj) => obj,
            None => return Ok(false),
        };

        remove_tag_from_object(&mut doc, &task_obj, tag_id)
    }

    pub fn add_tag_to_subtask(&self, subtask_id: &str, tag_id: &str) -> Result<bool, AutomergeError> {
        let mut doc = self.doc.lock().unwrap();

        // タグが存在するかチェック
        if !tag_exists(&doc, tag_id) {
            return Ok(false);
        }

        let subtask_obj = match find_subtask_object(&doc, subtask_id)? {
            Some(obj) => obj,
            None => return Ok(false),
        };

        add_tag_to_object(&mut doc, &subtask_obj, tag_id)?;
        update_timestamp(&mut doc, &subtask_obj)?;

        Ok(true)
    }

    pub fn remove_tag_from_subtask(&self, subtask_id: &str, tag_id: &str) -> Result<bool, AutomergeError> {
        let mut doc = self.doc.lock().unwrap();

        let subtask_obj = match find_subtask_object(&doc, subtask_id)? {
            Some(obj) => obj,
            None => return Ok(false),
        };

        let result = remove_tag_from_object(&mut doc, &subtask_obj, tag_id)?;
        if result {
            update_timestamp(&mut doc, &subtask_obj)?;
        }
        Ok(result)
    }

}