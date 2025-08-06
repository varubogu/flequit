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

        // タスクを探す
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
                                if let Ok(task_obj) = doc.get(&tasks_obj, task_id) {
                                    let tags_obj = match doc.get(&task_obj, "tags") {
                                        Ok(obj) => obj,
                                        Err(_) => doc.put_object(&task_obj, "tags", ObjType::Map)?,
                                    };
                                    
                                    // タグの参照を追加
                                    let tag_ref_obj = doc.put_object(&tags_obj, tag_id, ObjType::Map)?;
                                    doc.put(&tag_ref_obj, "id", tag_id)?;
                                    return Ok(true);
                                }
                            }
                        }
                    }
                }
            }
        }

        Ok(false)
    }

    pub fn remove_tag_from_task(&self, task_id: &str, tag_id: &str) -> Result<bool, AutomergeError> {
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
                                if let Ok(task_obj) = doc.get(&tasks_obj, task_id) {
                                    if let Ok(tags_obj) = doc.get(&task_obj, "tags") {
                                        if doc.get(&tags_obj, tag_id).is_ok() {
                                            return match doc.delete(&tags_obj, tag_id) {
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

        Ok(false)
    }

    pub fn add_tag_to_subtask(&self, subtask_id: &str, tag_id: &str) -> Result<bool, AutomergeError> {
        let mut doc = self.doc.lock().unwrap();

        // タグが存在するかチェック
        let tags_obj = match doc.get(automerge::ROOT, "tags") {
            Ok(obj) => obj,
            Err(_) => return Ok(false),
        };

        if doc.get(&tags_obj, tag_id).is_err() {
            return Ok(false); // タグが存在しない
        }

        // サブタスクを見つけてタグを追加
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
                                            if let Ok(subtask_obj) = doc.get(&sub_tasks_obj, subtask_id) {
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

                                                return Ok(true);
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

    pub fn remove_tag_from_subtask(&self, subtask_id: &str, tag_id: &str) -> Result<bool, AutomergeError> {
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
                                            if let Ok(subtask_obj) = doc.get(&sub_tasks_obj, subtask_id) {
                                                if let Ok(subtask_tags_obj) = doc.get(&subtask_obj, "tags") {
                                                    if doc.get(&subtask_tags_obj, tag_id).is_ok() {
                                                        let result = doc.delete(&subtask_tags_obj, tag_id);
                                                        if result.is_ok() {
                                                            // サブタスクの更新日時を更新
                                                            let now = chrono::Utc::now().timestamp_millis();
                                                            doc.put(&subtask_obj, "updated_at", now)?;
                                                            return Ok(true);
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
                }
            }
        }

        Ok(false)
    }
}