use automerge::{Automerge, AutomergeError, ObjType};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use uuid::Uuid;
use std::fs;
use std::path::Path;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Task {
    pub id: String,
    pub title: String,
    pub description: String,
    pub completed: bool,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectTree {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub color: Option<String>,
    pub order_index: i32,
    pub is_archived: bool,
    pub created_at: i64,
    pub updated_at: i64,
    pub task_lists: Vec<TaskListWithTasks>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskListWithTasks {
    pub id: String,
    pub project_id: String,
    pub name: String,
    pub description: Option<String>,
    pub color: Option<String>,
    pub order_index: i32,
    pub is_archived: bool,
    pub created_at: i64,
    pub updated_at: i64,
    pub tasks: Vec<TaskWithSubTasks>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskWithSubTasks {
    pub id: String,
    pub list_id: String,
    pub title: String,
    pub description: Option<String>,
    pub status: String,
    pub priority: i32,
    pub start_date: Option<i64>,
    pub end_date: Option<i64>,
    pub order_index: i32,
    pub is_archived: bool,
    pub created_at: i64,
    pub updated_at: i64,
    pub sub_tasks: Vec<SubTask>,
    pub tags: Vec<Tag>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubTask {
    pub id: String,
    pub task_id: String,
    pub title: String,
    pub description: Option<String>,
    pub status: String,
    pub priority: Option<i32>,
    pub start_date: Option<i64>,
    pub end_date: Option<i64>,
    pub order_index: i32,
    pub tags: Vec<Tag>,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Tag {
    pub id: String,
    pub name: String,
    pub color: Option<String>,
    pub created_at: i64,
    pub updated_at: i64,
}

pub struct AutomergeManager {
    doc: Arc<Mutex<Automerge>>,
}

impl AutomergeManager {
    pub fn new() -> Self {
        let doc = Automerge::new();
        Self {
            doc: Arc::new(Mutex::new(doc)),
        }
    }

    pub fn create_task(&self, title: String, description: String) -> Result<Task, AutomergeError> {
        let mut doc = self.doc.lock().unwrap();
        let task_id = Uuid::new_v4().to_string();
        let now = chrono::Utc::now().timestamp_millis();

        let task = Task {
            id: task_id.clone(),
            title,
            description,
            completed: false,
            created_at: now,
            updated_at: now,
        };

        // Initialize tasks map if it doesn't exist
        if doc.get(automerge::ROOT, "tasks").is_err() {
            doc.put_object(automerge::ROOT, "tasks", ObjType::Map)?;
        }

        let tasks_obj = doc.get(automerge::ROOT, "tasks")?;
        let task_obj = doc.put_object(&tasks_obj, &task_id, ObjType::Map)?;

        doc.put(&task_obj, "id", &task.id)?;
        doc.put(&task_obj, "title", &task.title)?;
        doc.put(&task_obj, "description", &task.description)?;
        doc.put(&task_obj, "completed", task.completed)?;
        doc.put(&task_obj, "created_at", task.created_at)?;
        doc.put(&task_obj, "updated_at", task.updated_at)?;

        Ok(task)
    }

    pub fn get_task(&self, task_id: &str) -> Result<Option<Task>, AutomergeError> {
        let doc = self.doc.lock().unwrap();
        
        let tasks_obj = match doc.get(automerge::ROOT, "tasks") {
            Ok(obj) => obj,
            Err(_) => return Ok(None),
        };

        let task_obj = match doc.get(&tasks_obj, task_id) {
            Ok(obj) => obj,
            Err(_) => return Ok(None),
        };

        let id: String = doc.get(&task_obj, "id")?.into();
        let title: String = doc.get(&task_obj, "title")?.into();
        let description: String = doc.get(&task_obj, "description")?.into();
        let completed: bool = doc.get(&task_obj, "completed")?.into();
        let created_at: i64 = doc.get(&task_obj, "created_at")?.into();
        let updated_at: i64 = doc.get(&task_obj, "updated_at")?.into();

        Ok(Some(Task {
            id,
            title,
            description,
            completed,
            created_at,
            updated_at,
        }))
    }

    pub fn get_all_tasks(&self) -> Result<Vec<Task>, AutomergeError> {
        let doc = self.doc.lock().unwrap();
        let mut tasks = Vec::new();

        let tasks_obj = match doc.get(automerge::ROOT, "tasks") {
            Ok(obj) => obj,
            Err(_) => return Ok(tasks),
        };

        for (_, task_id) in doc.keys(&tasks_obj) {
            if let Ok(task_obj) = doc.get(&tasks_obj, &task_id) {
                let id: String = doc.get(&task_obj, "id")?.into();
                let title: String = doc.get(&task_obj, "title")?.into();
                let description: String = doc.get(&task_obj, "description")?.into();
                let completed: bool = doc.get(&task_obj, "completed")?.into();
                let created_at: i64 = doc.get(&task_obj, "created_at")?.into();
                let updated_at: i64 = doc.get(&task_obj, "updated_at")?.into();

                tasks.push(Task {
                    id,
                    title,
                    description,
                    completed,
                    created_at,
                    updated_at,
                });
            }
        }

        Ok(tasks)
    }

    pub fn update_task(&self, task_id: &str, title: Option<String>, description: Option<String>, completed: Option<bool>) -> Result<Option<Task>, AutomergeError> {
        let mut doc = self.doc.lock().unwrap();
        let now = chrono::Utc::now().timestamp_millis();

        let tasks_obj = match doc.get(automerge::ROOT, "tasks") {
            Ok(obj) => obj,
            Err(_) => return Ok(None),
        };

        let task_obj = match doc.get(&tasks_obj, task_id) {
            Ok(obj) => obj,
            Err(_) => return Ok(None),
        };

        if let Some(title) = title {
            doc.put(&task_obj, "title", title)?;
        }
        if let Some(description) = description {
            doc.put(&task_obj, "description", description)?;
        }
        if let Some(completed) = completed {
            doc.put(&task_obj, "completed", completed)?;
        }
        doc.put(&task_obj, "updated_at", now)?;

        // Return updated task
        let id: String = doc.get(&task_obj, "id")?.into();
        let title: String = doc.get(&task_obj, "title")?.into();
        let description: String = doc.get(&task_obj, "description")?.into();
        let completed: bool = doc.get(&task_obj, "completed")?.into();
        let created_at: i64 = doc.get(&task_obj, "created_at")?.into();
        let updated_at: i64 = doc.get(&task_obj, "updated_at")?.into();

        Ok(Some(Task {
            id,
            title,
            description,
            completed,
            created_at,
            updated_at,
        }))
    }

    pub fn delete_task(&self, task_id: &str) -> Result<bool, AutomergeError> {
        let mut doc = self.doc.lock().unwrap();

        let tasks_obj = match doc.get(automerge::ROOT, "tasks") {
            Ok(obj) => obj,
            Err(_) => return Ok(false),
        };

        match doc.delete(&tasks_obj, task_id) {
            Ok(_) => Ok(true),
            Err(_) => Ok(false),
        }
    }

    pub fn get_document_state(&self) -> Vec<u8> {
        let doc = self.doc.lock().unwrap();
        doc.save()
    }

    pub fn load_document_state(&self, data: &[u8]) -> Result<(), AutomergeError> {
        let mut doc = self.doc.lock().unwrap();
        *doc = Automerge::load(data)?;
        Ok(())
    }

    pub fn merge_document(&self, other_data: &[u8]) -> Result<(), AutomergeError> {
        let mut doc = self.doc.lock().unwrap();
        let other_doc = Automerge::load(other_data)?;
        doc.merge(&other_doc)?;
        Ok(())
    }

    pub fn save_to_file(&self, file_path: &str) -> Result<(), Box<dyn std::error::Error>> {
        let data = self.get_document_state();
        fs::write(file_path, data)?;
        Ok(())
    }

    pub fn load_from_file(&self, file_path: &str) -> Result<(), Box<dyn std::error::Error>> {
        if Path::new(file_path).exists() {
            let data = fs::read(file_path)?;
            self.load_document_state(&data)?;
        }
        Ok(())
    }

    pub fn initialize_sample_data(&self) -> Result<(), AutomergeError> {
        let mut doc = self.doc.lock().unwrap();
        let now = chrono::Utc::now().timestamp_millis();
        let today = chrono::Utc::now().date_naive().and_hms_opt(0, 0, 0).unwrap().and_utc().timestamp_millis();
        let yesterday = today - 24 * 60 * 60 * 1000;
        let tomorrow = today + 24 * 60 * 60 * 1000;
        let five_days_later = today + 5 * 24 * 60 * 60 * 1000;

        // Initialize projects map
        let projects_obj = doc.put_object(automerge::ROOT, "projects", ObjType::Map)?;
        
        // Project 1: Personal Tasks
        let project1_obj = doc.put_object(&projects_obj, "project-1", ObjType::Map)?;
        doc.put(&project1_obj, "id", "project-1")?;
        doc.put(&project1_obj, "name", "Personal Tasks")?;
        doc.put(&project1_obj, "description", "Personal todo items and tasks")?;
        doc.put(&project1_obj, "color", "#3b82f6")?;
        doc.put(&project1_obj, "order_index", 0)?;
        doc.put(&project1_obj, "is_archived", false)?;
        doc.put(&project1_obj, "created_at", now)?;
        doc.put(&project1_obj, "updated_at", now)?;
        
        let task_lists_obj = doc.put_object(&project1_obj, "task_lists", ObjType::Map)?;
        
        // Task List 1: Daily Tasks
        let list1_obj = doc.put_object(&task_lists_obj, "list-1", ObjType::Map)?;
        doc.put(&list1_obj, "id", "list-1")?;
        doc.put(&list1_obj, "project_id", "project-1")?;
        doc.put(&list1_obj, "name", "Daily Tasks")?;
        doc.put(&list1_obj, "description", "Tasks for today")?;
        doc.put(&list1_obj, "color", "#10b981")?;
        doc.put(&list1_obj, "order_index", 0)?;
        doc.put(&list1_obj, "is_archived", false)?;
        doc.put(&list1_obj, "created_at", now)?;
        doc.put(&list1_obj, "updated_at", now)?;
        
        let tasks_obj = doc.put_object(&list1_obj, "tasks", ObjType::Map)?;
        
        // Task 1: Review morning emails
        let task1_obj = doc.put_object(&tasks_obj, "task-1", ObjType::Map)?;
        doc.put(&task1_obj, "id", "task-1")?;
        doc.put(&task1_obj, "list_id", "list-1")?;
        doc.put(&task1_obj, "title", "Review morning emails")?;
        doc.put(&task1_obj, "description", "Check and respond to important emails")?;
        doc.put(&task1_obj, "status", "not_started")?;
        doc.put(&task1_obj, "priority", 1)?;
        doc.put(&task1_obj, "end_date", today)?;
        doc.put(&task1_obj, "order_index", 0)?;
        doc.put(&task1_obj, "is_archived", false)?;
        doc.put(&task1_obj, "created_at", now)?;
        doc.put(&task1_obj, "updated_at", now)?;
        
        let subtasks1_obj = doc.put_object(&task1_obj, "sub_tasks", ObjType::Map)?;
        let tags1_obj = doc.put_object(&task1_obj, "tags", ObjType::Map)?;
        
        // Subtask 1-1
        let subtask1_obj = doc.put_object(&subtasks1_obj, "subtask-1", ObjType::Map)?;
        doc.put(&subtask1_obj, "id", "subtask-1")?;
        doc.put(&subtask1_obj, "task_id", "task-1")?;
        doc.put(&subtask1_obj, "title", "Check work inbox")?;
        doc.put(&subtask1_obj, "description", "Review all unread emails in work account")?;
        doc.put(&subtask1_obj, "status", "not_started")?;
        doc.put(&subtask1_obj, "priority", 2)?;
        doc.put(&subtask1_obj, "start_date", today + 60 * 60 * 1000)?;
        doc.put(&subtask1_obj, "end_date", today + 3 * 60 * 60 * 1000)?;
        doc.put(&subtask1_obj, "order_index", 0)?;
        doc.put(&subtask1_obj, "created_at", now)?;
        doc.put(&subtask1_obj, "updated_at", now)?;
        doc.put_object(&subtask1_obj, "tags", ObjType::Map)?;
        
        // Tag for task 1
        let tag1_obj = doc.put_object(&tags1_obj, "tag-1", ObjType::Map)?;
        doc.put(&tag1_obj, "id", "tag-1")?;
        doc.put(&tag1_obj, "name", "work")?;
        doc.put(&tag1_obj, "color", "#f59e0b")?;
        doc.put(&tag1_obj, "created_at", now)?;
        doc.put(&tag1_obj, "updated_at", now)?;
        
        // Task 2: Buy groceries
        let task2_obj = doc.put_object(&tasks_obj, "task-2", ObjType::Map)?;
        doc.put(&task2_obj, "id", "task-2")?;
        doc.put(&task2_obj, "list_id", "list-1")?;
        doc.put(&task2_obj, "title", "Buy groceries")?;
        doc.put(&task2_obj, "description", "Get ingredients for dinner tonight")?;
        doc.put(&task2_obj, "status", "not_started")?;
        doc.put(&task2_obj, "priority", 2)?;
        doc.put(&task2_obj, "end_date", today)?;
        doc.put(&task2_obj, "order_index", 1)?;
        doc.put(&task2_obj, "is_archived", false)?;
        doc.put(&task2_obj, "created_at", now)?;
        doc.put(&task2_obj, "updated_at", now)?;
        doc.put_object(&task2_obj, "sub_tasks", ObjType::Map)?;
        
        let tags2_obj = doc.put_object(&task2_obj, "tags", ObjType::Map)?;
        let tag2_obj = doc.put_object(&tags2_obj, "tag-2", ObjType::Map)?;
        doc.put(&tag2_obj, "id", "tag-2")?;
        doc.put(&tag2_obj, "name", "personal")?;
        doc.put(&tag2_obj, "color", "#8b5cf6")?;
        doc.put(&tag2_obj, "created_at", now)?;
        doc.put(&tag2_obj, "updated_at", now)?;
        
        Ok(())
    }

    pub fn get_project_trees(&self) -> Result<Vec<ProjectTree>, AutomergeError> {
        let doc = self.doc.lock().unwrap();
        let mut projects = Vec::new();

        let projects_obj = match doc.get(automerge::ROOT, "projects") {
            Ok(obj) => obj,
            Err(_) => return Ok(projects),
        };

        for (_, project_id) in doc.keys(&projects_obj) {
            if let Ok(project_obj) = doc.get(&projects_obj, &project_id) {
                let id: String = doc.get(&project_obj, "id")?.into();
                let name: String = doc.get(&project_obj, "name")?.into();
                let description: Option<String> = doc.get(&project_obj, "description").ok().map(|v| v.into());
                let color: Option<String> = doc.get(&project_obj, "color").ok().map(|v| v.into());
                let order_index: i32 = doc.get(&project_obj, "order_index")?.into();
                let is_archived: bool = doc.get(&project_obj, "is_archived")?.into();
                let created_at: i64 = doc.get(&project_obj, "created_at")?.into();
                let updated_at: i64 = doc.get(&project_obj, "updated_at")?.into();
                
                let mut task_lists = Vec::new();
                if let Ok(task_lists_obj) = doc.get(&project_obj, "task_lists") {
                    for (_, list_id) in doc.keys(&task_lists_obj) {
                        if let Ok(list_obj) = doc.get(&task_lists_obj, &list_id) {
                            let list_id: String = doc.get(&list_obj, "id")?.into();
                            let project_id: String = doc.get(&list_obj, "project_id")?.into();
                            let name: String = doc.get(&list_obj, "name")?.into();
                            let description: Option<String> = doc.get(&list_obj, "description").ok().map(|v| v.into());
                            let color: Option<String> = doc.get(&list_obj, "color").ok().map(|v| v.into());
                            let order_index: i32 = doc.get(&list_obj, "order_index")?.into();
                            let is_archived: bool = doc.get(&list_obj, "is_archived")?.into();
                            let created_at: i64 = doc.get(&list_obj, "created_at")?.into();
                            let updated_at: i64 = doc.get(&list_obj, "updated_at")?.into();
                            
                            let mut tasks = Vec::new();
                            if let Ok(tasks_obj) = doc.get(&list_obj, "tasks") {
                                for (_, task_id) in doc.keys(&tasks_obj) {
                                    if let Ok(task_obj) = doc.get(&tasks_obj, &task_id) {
                                        let task = self.build_task_from_obj(&doc, &task_obj)?;
                                        tasks.push(task);
                                    }
                                }
                            }
                            
                            task_lists.push(TaskListWithTasks {
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
                            });
                        }
                    }
                }
                
                projects.push(ProjectTree {
                    id,
                    name,
                    description,
                    color,
                    order_index,
                    is_archived,
                    created_at,
                    updated_at,
                    task_lists,
                });
            }
        }

        Ok(projects)
    }
    
    fn build_task_from_obj(&self, doc: &Automerge, task_obj: &automerge::ObjId) -> Result<TaskWithSubTasks, AutomergeError> {
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
    
    fn build_subtask_from_obj(&self, doc: &Automerge, subtask_obj: &automerge::ObjId) -> Result<SubTask, AutomergeError> {
        let id: String = doc.get(subtask_obj, "id")?.into();
        let task_id: String = doc.get(subtask_obj, "task_id")?.into();
        let title: String = doc.get(subtask_obj, "title")?.into();
        let description: Option<String> = doc.get(subtask_obj, "description").ok().map(|v| v.into());
        let status: String = doc.get(subtask_obj, "status")?.into();
        let priority: Option<i32> = doc.get(subtask_obj, "priority").ok().map(|v| v.into());
        let start_date: Option<i64> = doc.get(subtask_obj, "start_date").ok().map(|v| v.into());
        let end_date: Option<i64> = doc.get(subtask_obj, "end_date").ok().map(|v| v.into());
        let order_index: i32 = doc.get(subtask_obj, "order_index")?.into();
        let created_at: i64 = doc.get(subtask_obj, "created_at")?.into();
        let updated_at: i64 = doc.get(subtask_obj, "updated_at")?.into();
        
        let mut tags = Vec::new();
        if let Ok(tags_obj) = doc.get(subtask_obj, "tags") {
            for (_, tag_id) in doc.keys(&tags_obj) {
                if let Ok(tag_obj) = doc.get(&tags_obj, &tag_id) {
                    let tag = self.build_tag_from_obj(doc, &tag_obj)?;
                    tags.push(tag);
                }
            }
        }
        
        Ok(SubTask {
            id,
            task_id,
            title,
            description,
            status,
            priority,
            start_date,
            end_date,
            order_index,
            tags,
            created_at,
            updated_at,
        })
    }
    
    fn build_tag_from_obj(&self, doc: &Automerge, tag_obj: &automerge::ObjId) -> Result<Tag, AutomergeError> {
        let id: String = doc.get(tag_obj, "id")?.into();
        let name: String = doc.get(tag_obj, "name")?.into();
        let color: Option<String> = doc.get(tag_obj, "color").ok().map(|v| v.into());
        let created_at: i64 = doc.get(tag_obj, "created_at")?.into();
        let updated_at: i64 = doc.get(tag_obj, "updated_at")?.into();
        
        Ok(Tag {
            id,
            name,
            color,
            created_at,
            updated_at,
        })
    }

    // プロジェクト管理メソッド
    pub fn create_project(&self, name: String, description: Option<String>, color: Option<String>) -> Result<ProjectTree, AutomergeError> {
        let mut doc = self.doc.lock().unwrap();
        let project_id = Uuid::new_v4().to_string();
        let now = chrono::Utc::now().timestamp_millis();

        // Initialize projects map if it doesn't exist
        if doc.get(automerge::ROOT, "projects").is_err() {
            doc.put_object(automerge::ROOT, "projects", ObjType::Map)?;
        }

        let projects_obj = doc.get(automerge::ROOT, "projects")?;
        let project_obj = doc.put_object(&projects_obj, &project_id, ObjType::Map)?;

        doc.put(&project_obj, "id", &project_id)?;
        doc.put(&project_obj, "name", &name)?;
        doc.put(&project_obj, "description", &description.unwrap_or_default())?;
        doc.put(&project_obj, "color", &color.unwrap_or("#3b82f6".to_string()))?;
        doc.put(&project_obj, "order_index", 0)?;
        doc.put(&project_obj, "is_archived", false)?;
        doc.put(&project_obj, "created_at", now)?;
        doc.put(&project_obj, "updated_at", now)?;

        // Initialize empty task_lists
        doc.put_object(&project_obj, "task_lists", ObjType::Map)?;

        Ok(ProjectTree {
            id: project_id,
            name,
            description,
            color,
            order_index: 0,
            is_archived: false,
            created_at: now,
            updated_at: now,
            task_lists: vec![],
        })
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

        if let Some(name) = name {
            doc.put(&project_obj, "name", name)?;
        }
        if let Some(description) = description {
            doc.put(&project_obj, "description", description)?;
        }
        if let Some(color) = color {
            doc.put(&project_obj, "color", color)?;
        }
        doc.put(&project_obj, "updated_at", now)?;

        // Return updated project
        let id: String = doc.get(&project_obj, "id")?.into();
        let name: String = doc.get(&project_obj, "name")?.into();
        let description: Option<String> = doc.get(&project_obj, "description").ok().map(|v| v.into());
        let color: Option<String> = doc.get(&project_obj, "color").ok().map(|v| v.into());
        let order_index: i32 = doc.get(&project_obj, "order_index")?.into();
        let is_archived: bool = doc.get(&project_obj, "is_archived")?.into();
        let created_at: i64 = doc.get(&project_obj, "created_at")?.into();

        let mut task_lists = Vec::new();
        if let Ok(task_lists_obj) = doc.get(&project_obj, "task_lists") {
            for (_, list_id) in doc.keys(&task_lists_obj) {
                if let Ok(list_obj) = doc.get(&task_lists_obj, &list_id) {
                    let task_list = self.build_task_list_from_obj(&doc, &list_obj)?;
                    task_lists.push(task_list);
                }
            }
        }

        Ok(Some(ProjectTree {
            id,
            name,
            description,
            color,
            order_index,
            is_archived,
            created_at,
            updated_at: now,
            task_lists,
        }))
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

    // タスクリスト管理メソッド
    pub fn create_task_list(&self, project_id: String, name: String, description: Option<String>, color: Option<String>) -> Result<TaskListWithTasks, AutomergeError> {
        let mut doc = self.doc.lock().unwrap();
        let task_list_id = Uuid::new_v4().to_string();
        let now = chrono::Utc::now().timestamp_millis();

        let projects_obj = doc.get(automerge::ROOT, "projects")?;
        let project_obj = doc.get(&projects_obj, &project_id)?;
        let task_lists_obj = doc.get(&project_obj, "task_lists")?;
        
        let list_obj = doc.put_object(&task_lists_obj, &task_list_id, ObjType::Map)?;

        doc.put(&list_obj, "id", &task_list_id)?;
        doc.put(&list_obj, "project_id", &project_id)?;
        doc.put(&list_obj, "name", &name)?;
        doc.put(&list_obj, "description", &description.unwrap_or_default())?;
        doc.put(&list_obj, "color", &color.unwrap_or_default())?;
        doc.put(&list_obj, "order_index", 0)?;
        doc.put(&list_obj, "is_archived", false)?;
        doc.put(&list_obj, "created_at", now)?;
        doc.put(&list_obj, "updated_at", now)?;

        // Initialize empty tasks
        doc.put_object(&list_obj, "tasks", ObjType::Map)?;

        Ok(TaskListWithTasks {
            id: task_list_id,
            project_id,
            name,
            description,
            color,
            order_index: 0,
            is_archived: false,
            created_at: now,
            updated_at: now,
            tasks: vec![],
        })
    }

    pub fn update_task_list(&self, task_list_id: &str, name: Option<String>, description: Option<String>, color: Option<String>) -> Result<Option<TaskListWithTasks>, AutomergeError> {
        let mut doc = self.doc.lock().unwrap();
        let now = chrono::Utc::now().timestamp_millis();

        // Find the task list
        let projects_obj = match doc.get(automerge::ROOT, "projects") {
            Ok(obj) => obj,
            Err(_) => return Ok(None),
        };

        for (_, project_id) in doc.keys(&projects_obj) {
            if let Ok(project_obj) = doc.get(&projects_obj, &project_id) {
                if let Ok(task_lists_obj) = doc.get(&project_obj, "task_lists") {
                    if let Ok(list_obj) = doc.get(&task_lists_obj, task_list_id) {
                        if let Some(name) = name {
                            doc.put(&list_obj, "name", name)?;
                        }
                        if let Some(description) = description {
                            doc.put(&list_obj, "description", description)?;
                        }
                        if let Some(color) = color {
                            doc.put(&list_obj, "color", color)?;
                        }
                        doc.put(&list_obj, "updated_at", now)?;

                        return Ok(Some(self.build_task_list_from_obj(&doc, &list_obj)?));
                    }
                }
            }
        }

        Ok(None)
    }

    pub fn delete_task_list(&self, task_list_id: &str) -> Result<bool, AutomergeError> {
        let mut doc = self.doc.lock().unwrap();

        let projects_obj = match doc.get(automerge::ROOT, "projects") {
            Ok(obj) => obj,
            Err(_) => return Ok(false),
        };

        for (_, project_id) in doc.keys(&projects_obj) {
            if let Ok(project_obj) = doc.get(&projects_obj, &project_id) {
                if let Ok(task_lists_obj) = doc.get(&project_obj, "task_lists") {
                    if doc.get(&task_lists_obj, task_list_id).is_ok() {
                        return match doc.delete(&task_lists_obj, task_list_id) {
                            Ok(_) => Ok(true),
                            Err(_) => Ok(false),
                        };
                    }
                }
            }
        }

        Ok(false)
    }

    // 拡張タスク管理メソッド
    pub fn create_task_with_subtasks(&self, list_id: String, title: String, description: Option<String>, status: Option<String>, priority: Option<i32>, start_date: Option<i64>, end_date: Option<i64>) -> Result<TaskWithSubTasks, AutomergeError> {
        let mut doc = self.doc.lock().unwrap();
        let task_id = Uuid::new_v4().to_string();
        let now = chrono::Utc::now().timestamp_millis();

        // Find the task list
        let projects_obj = doc.get(automerge::ROOT, "projects")?;
        let mut tasks_obj = None;

        for (_, project_id) in doc.keys(&projects_obj) {
            if let Ok(project_obj) = doc.get(&projects_obj, &project_id) {
                if let Ok(task_lists_obj) = doc.get(&project_obj, "task_lists") {
                    if let Ok(list_obj) = doc.get(&task_lists_obj, &list_id) {
                        tasks_obj = Some(doc.get(&list_obj, "tasks")?);
                        break;
                    }
                }
            }
        }

        let tasks_obj = tasks_obj.ok_or_else(|| AutomergeError::InvalidObjectId)?;
        let task_obj = doc.put_object(&tasks_obj, &task_id, ObjType::Map)?;

        doc.put(&task_obj, "id", &task_id)?;
        doc.put(&task_obj, "list_id", &list_id)?;
        doc.put(&task_obj, "title", &title)?;
        doc.put(&task_obj, "description", &description.unwrap_or_default())?;
        doc.put(&task_obj, "status", &status.unwrap_or("not_started".to_string()))?;
        doc.put(&task_obj, "priority", priority.unwrap_or(0))?;
        if let Some(start_date) = start_date {
            doc.put(&task_obj, "start_date", start_date)?;
        }
        if let Some(end_date) = end_date {
            doc.put(&task_obj, "end_date", end_date)?;
        }
        doc.put(&task_obj, "order_index", 0)?;
        doc.put(&task_obj, "is_archived", false)?;
        doc.put(&task_obj, "created_at", now)?;
        doc.put(&task_obj, "updated_at", now)?;

        // Initialize empty sub_tasks and tags
        doc.put_object(&task_obj, "sub_tasks", ObjType::Map)?;
        doc.put_object(&task_obj, "tags", ObjType::Map)?;

        Ok(TaskWithSubTasks {
            id: task_id,
            list_id,
            title,
            description,
            status: status.unwrap_or("not_started".to_string()),
            priority: priority.unwrap_or(0),
            start_date,
            end_date,
            order_index: 0,
            is_archived: false,
            created_at: now,
            updated_at: now,
            sub_tasks: vec![],
            tags: vec![],
        })
    }

    pub fn update_task_with_subtasks(&self, task_id: &str, title: Option<String>, description: Option<String>, status: Option<String>, priority: Option<i32>, start_date: Option<i64>, end_date: Option<i64>) -> Result<Option<TaskWithSubTasks>, AutomergeError> {
        let mut doc = self.doc.lock().unwrap();
        let now = chrono::Utc::now().timestamp_millis();

        // Find the task
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
                                if let Ok(task_obj) = doc.get(&tasks_obj, task_id) {
                                    if let Some(title) = title {
                                        doc.put(&task_obj, "title", title)?;
                                    }
                                    if let Some(description) = description {
                                        doc.put(&task_obj, "description", description)?;
                                    }
                                    if let Some(status) = status {
                                        doc.put(&task_obj, "status", status)?;
                                    }
                                    if let Some(priority) = priority {
                                        doc.put(&task_obj, "priority", priority)?;
                                    }
                                    if let Some(start_date) = start_date {
                                        doc.put(&task_obj, "start_date", start_date)?;
                                    }
                                    if let Some(end_date) = end_date {
                                        doc.put(&task_obj, "end_date", end_date)?;
                                    }
                                    doc.put(&task_obj, "updated_at", now)?;

                                    return Ok(Some(self.build_task_from_obj(&doc, &task_obj)?));
                                }
                            }
                        }
                    }
                }
            }
        }

        Ok(None)
    }

    pub fn delete_task_with_subtasks(&self, task_id: &str) -> Result<bool, AutomergeError> {
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
                                if doc.get(&tasks_obj, task_id).is_ok() {
                                    return match doc.delete(&tasks_obj, task_id) {
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

        Ok(false)
    }

    fn build_task_list_from_obj(&self, doc: &Automerge, list_obj: &automerge::ObjId) -> Result<TaskListWithTasks, AutomergeError> {
        let id: String = doc.get(list_obj, "id")?.into();
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
            id,
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
}