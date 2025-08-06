use automerge::{Automerge, AutomergeError, ObjType};
use crate::types::{ProjectTree, TaskListWithTasks, TaskWithSubTasks, SubTask, Tag, AutomergeInterface};
use crate::utils::generate_id;
use super::core::AutomergeManager;

impl AutomergeManager {
    pub fn get_project_trees(&self) -> Result<Vec<ProjectTree>, AutomergeError> {
        let doc = self.doc.lock().unwrap();
        let mut projects = Vec::new();

        let projects_obj = match doc.get(automerge::ROOT, "projects") {
            Ok(obj) => obj,
            Err(_) => return Ok(projects),
        };

        for (_, project_id) in doc.keys(&projects_obj) {
            if let Ok(project_obj) = doc.get(&projects_obj, &project_id) {
                // 新しいインターフェースでバージョン互換性を考慮して読み込み
                let mut project = doc.get_struct_safe::<ProjectTree>(&project_obj)?;
                
                // タスクリストを読み込み（ネストしたデータの場合は従来の方法を使用）
                let mut task_lists = Vec::new();
                if let Ok(task_lists_obj) = doc.get(&project_obj, "task_lists") {
                    for (_, list_id) in doc.keys(&task_lists_obj) {
                        if let Ok(list_obj) = doc.get(&task_lists_obj, &list_id) {
                            let task_list = self.build_task_list_from_obj(&doc, &list_obj)?;
                            task_lists.push(task_list);
                        }
                    }
                }
                
                project.task_lists = task_lists;
                projects.push(project);
            }
        }

        Ok(projects)
    }

    pub fn create_project(&self, name: String, description: Option<String>, color: Option<String>) -> Result<ProjectTree, AutomergeError> {
        let mut doc = self.doc.lock().unwrap();
        let project_id = generate_id();
        let now = chrono::Utc::now().timestamp_millis();

        // Initialize projects map if it doesn't exist
        if doc.get(automerge::ROOT, "projects").is_err() {
            doc.put_object(automerge::ROOT, "projects", ObjType::Map)?;
        }

        let projects_obj = doc.get(automerge::ROOT, "projects")?;
        
        // 構造体を作成
        let project = ProjectTree {
            id: project_id.clone(),
            name,
            description,
            color: Some(color.unwrap_or("#3b82f6".to_string())),
            order_index: 0,
            is_archived: false,
            created_at: now,
            updated_at: now,
            task_lists: vec![],
        };

        // 新しいインターフェースで一括書き込み
        let project_obj = doc.put_struct(&projects_obj, &project_id, &project)?;

        // Initialize empty task_lists
        doc.put_object(&project_obj, "task_lists", ObjType::Map)?;

        Ok(project)
    }

    pub fn update_project(&self, project_id: &str, name: Option<String>, description: Option<String>, color: Option<String>) -> Result<Option<ProjectTree>, AutomergeError> {
        let mut doc = self.doc.lock().unwrap();
        let now = chrono::Utc::now().timestamp_millis();

        let projects_obj = match doc.get(automerge::ROOT, "projects") {
            Ok(obj) => obj,
            Err(_) => return Ok(None),
        };

        let project_obj = match doc.get(&projects_obj, project_id) {
            Ok(obj) => obj,
            Err(_) => return Ok(None),
        };

        // 既存のプロジェクトを読み込み
        let mut existing_project = doc.get_struct_safe::<ProjectTree>(&project_obj)?;
        
        // フィールドを更新
        if let Some(n) = name {
            existing_project.name = n;
        }
        if let Some(d) = description {
            existing_project.description = d;
        }
        if let Some(c) = color {
            existing_project.color = Some(c);
        }
        existing_project.updated_at = now;

        // 構造体を一括で書き込み直し（ただしtask_listsは除外）
        let temp_project = ProjectTree {
            task_lists: vec![], // 空にして書き込み
            ..existing_project.clone()
        };
        doc.put_struct(&projects_obj, project_id, &temp_project)?;

        // タスクリストを再読み込み（ネストしたデータの場合は従来の方法を使用）
        let mut task_lists = Vec::new();
        if let Ok(task_lists_obj) = doc.get(&project_obj, "task_lists") {
            for (_, list_id) in doc.keys(&task_lists_obj) {
                if let Ok(list_obj) = doc.get(&task_lists_obj, &list_id) {
                    let task_list = self.build_task_list_from_obj(&doc, &list_obj)?;
                    task_lists.push(task_list);
                }
            }
        }
        
        existing_project.task_lists = task_lists;
        Ok(Some(existing_project))
    }

    pub fn delete_project(&self, project_id: &str) -> Result<bool, AutomergeError> {
        let mut doc = self.doc.lock().unwrap();

        let projects_obj = match doc.get(automerge::ROOT, "projects") {
            Ok(obj) => obj,
            Err(_) => return Ok(false),
        };

        match doc.delete(&projects_obj, project_id) {
            Ok(_) => Ok(true),
            Err(_) => Ok(false),
        }
    }

    // ヘルパーメソッド: TaskListWithTasksを構築
    pub(crate) fn build_task_list_from_obj(&self, doc: &Automerge, list_obj: &automerge::ObjId) -> Result<TaskListWithTasks, AutomergeError> {
        let list_id: String = doc.get(list_obj, "id")?.into();
        let project_id: String = doc.get(list_obj, "project_id")?.into();
        let name: String = doc.get(list_obj, "name")?.into();
        let description: Option<String> = doc.get(list_obj, "description").ok().map(|v| v.into());
        let color: Option<String> = doc.get(list_obj, "color").ok().map(|v| v.into());
        let order_index: i32 = doc.get(list_obj, "order_index")?.into();
        let is_archived: bool = doc.get(list_obj, "is_archived")?.into();
        let created_at: i64 = doc.get(list_obj, "created_at")?.into();
        let updated_at: i64 = doc.get(list_obj, "updated_at")?.into();
        
        let mut tasks = Vec::new();
        if let Ok(tasks_obj) = doc.get(list_obj, "tasks") {
            for (_, task_id) in doc.keys(&tasks_obj) {
                if let Ok(task_obj) = doc.get(&tasks_obj, &task_id) {
                    let task = self.build_task_from_obj(doc, &task_obj)?;
                    tasks.push(task);
                }
            }
        }
        
        Ok(TaskListWithTasks {
            id: list_id,
            project_id,
            name,
            description,
            color,
            order_index,
            is_archived,
            created_at,
            updated_at,
            tasks,
        })
    }

    // ヘルパーメソッド: TaskWithSubTasksを構築
    pub(crate) fn build_task_from_obj(&self, doc: &Automerge, task_obj: &automerge::ObjId) -> Result<TaskWithSubTasks, AutomergeError> {
        let id: String = doc.get(task_obj, "id")?.into();
        let list_id: String = doc.get(task_obj, "list_id")?.into();
        let title: String = doc.get(task_obj, "title")?.into();
        let description: Option<String> = doc.get(task_obj, "description").ok().map(|v| v.into());
        let status: String = doc.get(task_obj, "status")?.into();
        let priority: i32 = doc.get(task_obj, "priority")?.into();
        let start_date: Option<i64> = doc.get(task_obj, "start_date").ok().map(|v| v.into());
        let end_date: Option<i64> = doc.get(task_obj, "end_date").ok().map(|v| v.into());
        let order_index: i32 = doc.get(task_obj, "order_index")?.into();
        let is_archived: bool = doc.get(task_obj, "is_archived")?.into();
        let created_at: i64 = doc.get(task_obj, "created_at")?.into();
        let updated_at: i64 = doc.get(task_obj, "updated_at")?.into();
        
        let mut sub_tasks = Vec::new();
        if let Ok(sub_tasks_obj) = doc.get(task_obj, "sub_tasks") {
            for (_, subtask_id) in doc.keys(&sub_tasks_obj) {
                if let Ok(subtask_obj) = doc.get(&sub_tasks_obj, &subtask_id) {
                    let subtask = self.build_subtask_from_obj(doc, &subtask_obj)?;
                    sub_tasks.push(subtask);
                }
            }
        }
        
        let mut tags = Vec::new();
        if let Ok(tags_obj) = doc.get(task_obj, "tags") {
            for (_, tag_id) in doc.keys(&tags_obj) {
                if let Ok(tag_obj) = doc.get(&tags_obj, &tag_id) {
                    let tag = self.build_tag_from_obj(doc, &tag_obj)?;
                    tags.push(tag);
                }
            }
        }
        
        Ok(TaskWithSubTasks {
            id,
            list_id,
            title,
            description,
            status,
            priority,
            start_date,
            end_date,
            order_index,
            is_archived,
            created_at,
            updated_at,
            sub_tasks,
            tags,
        })
    }

    // ヘルパーメソッド: SubTaskを構築
    pub(crate) fn build_subtask_from_obj(&self, doc: &Automerge, subtask_obj: &automerge::ObjId) -> Result<SubTask, AutomergeError> {
        // 新しいインターフェースでバージョン互換性を考慮して読み込み（基本フィールド）
        let mut subtask = doc.get_struct_safe::<SubTask>(subtask_obj)?;
        
        // タグは別途読み込み（ネストした構造）
        let mut tags = Vec::new();
        if let Ok(tags_obj) = doc.get(subtask_obj, "tags") {
            for (_, tag_id) in doc.keys(&tags_obj) {
                if let Ok(tag_obj) = doc.get(&tags_obj, &tag_id) {
                    let tag = self.build_tag_from_obj(doc, &tag_obj)?;
                    tags.push(tag);
                }
            }
        }
        
        subtask.tags = tags;
        Ok(subtask)
    }

    // ヘルパーメソッド: Tagを構築
    pub(crate) fn build_tag_from_obj(&self, doc: &Automerge, tag_obj: &automerge::ObjId) -> Result<Tag, AutomergeError> {
        // 新しいインターフェースでバージョン互換性を考慮して読み込み
        doc.get_struct_safe::<Tag>(tag_obj)
    }
}