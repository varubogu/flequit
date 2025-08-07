use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use serde_json;

use crate::errors::AutomergeError;
use crate::types::{AutomergeBulkSerializable, Project, Task, Subtask, User, Tag, ProjectMember};

/// Automerge-Repoサービスの模擬実装
/// 現在はAutomerge-Repoが正式リリース前のため、基本的なCRDT操作を提供
pub struct AutomergeRepoService {
    // 実際にはDocHandle, Repoなどを使用予定
    main_document: Arc<RwLock<HashMap<String, serde_json::Value>>>,
    sync_enabled: Arc<RwLock<bool>>,
}

impl AutomergeRepoService {
    pub async fn new() -> Result<Self, AutomergeError> {
        let service = Self {
            main_document: Arc::new(RwLock::new(HashMap::new())),
            sync_enabled: Arc::new(RwLock::new(false)),
        };
        
        // 基本構造を初期化
        service.init_document_structure().await?;
        
        Ok(service)
    }
    
    async fn init_document_structure(&self) -> Result<(), AutomergeError> {
        let mut doc = self.main_document.write().await;
        
        // 基本的な階層構造を作成
        doc.insert("projects".to_string(), serde_json::json!({}));
        doc.insert("global_tags".to_string(), serde_json::json!({}));
        doc.insert("users".to_string(), serde_json::json!({}));
        
        Ok(())
    }
    
    pub async fn start_sync(&self) -> Result<(), AutomergeError> {
        let mut sync_enabled = self.sync_enabled.write().await;
        if !*sync_enabled {
            // TODO: 実際のAutomerge-Repo同期開始
            *sync_enabled = true;
            println!("Automerge sync started (simulated)");
        }
        Ok(())
    }
    
    pub async fn stop_sync(&self) -> Result<(), AutomergeError> {
        let mut sync_enabled = self.sync_enabled.write().await;
        if *sync_enabled {
            // TODO: 実際のAutomerge-Repo同期停止
            *sync_enabled = false;
            println!("Automerge sync stopped (simulated)");
        }
        Ok(())
    }
    
    // プロジェクト操作
    pub async fn set_project(&self, project: &Project) -> Result<(), AutomergeError> {
        let mut doc = self.main_document.write().await;
        let projects = doc.get_mut("projects").unwrap().as_object_mut().unwrap();
        
        let project_value = serde_json::to_value(project)
            .map_err(|e| AutomergeError::SerializationError(e.to_string()))?;
        
        projects.insert(project.id.clone(), project_value);
        Ok(())
    }
    
    pub async fn get_project(&self, project_id: &str) -> Result<Option<Project>, AutomergeError> {
        let doc = self.main_document.read().await;
        let projects = doc.get("projects").unwrap().as_object().unwrap();
        
        if let Some(project_value) = projects.get(project_id) {
            let project: Project = serde_json::from_value(project_value.clone())
                .map_err(|e| AutomergeError::DeserializationError(e.to_string()))?;
            Ok(Some(project))
        } else {
            Ok(None)
        }
    }
    
    pub async fn list_projects(&self) -> Result<Vec<Project>, AutomergeError> {
        let doc = self.main_document.read().await;
        let projects = doc.get("projects").unwrap().as_object().unwrap();
        
        let mut result = Vec::new();
        for project_value in projects.values() {
            let project: Project = serde_json::from_value(project_value.clone())
                .map_err(|e| AutomergeError::DeserializationError(e.to_string()))?;
            result.push(project);
        }
        
        // 更新日時順でソート
        result.sort_by(|a, b| b.updated_at.cmp(&a.updated_at));
        
        Ok(result)
    }
    
    pub async fn delete_project(&self, project_id: &str) -> Result<(), AutomergeError> {
        let mut doc = self.main_document.write().await;
        let projects = doc.get_mut("projects").unwrap().as_object_mut().unwrap();
        projects.remove(project_id);
        Ok(())
    }
    
    // タスク操作
    pub async fn set_task(&self, project_id: &str, task: &Task) -> Result<(), AutomergeError> {
        let mut doc = self.main_document.write().await;
        
        // パス: projects/{project_id}/tasks/{task_id}
        let projects = doc.get_mut("projects").unwrap().as_object_mut().unwrap();
        
        if !projects.contains_key(project_id) {
            return Err(AutomergeError::PathNotFound(format!("Project {} not found", project_id)));
        }
        
        let project = projects.get_mut(project_id).unwrap().as_object_mut().unwrap();
        
        if !project.contains_key("tasks") {
            project.insert("tasks".to_string(), serde_json::json!({}));
        }
        
        let tasks = project.get_mut("tasks").unwrap().as_object_mut().unwrap();
        
        let task_value = serde_json::to_value(task)
            .map_err(|e| AutomergeError::SerializationError(e.to_string()))?;
        
        tasks.insert(task.id.clone(), task_value);
        Ok(())
    }
    
    pub async fn get_task(&self, project_id: &str, task_id: &str) -> Result<Option<Task>, AutomergeError> {
        let doc = self.main_document.read().await;
        let projects = doc.get("projects").unwrap().as_object().unwrap();
        
        if let Some(project) = projects.get(project_id) {
            if let Some(tasks) = project.get("tasks").and_then(|v| v.as_object()) {
                if let Some(task_value) = tasks.get(task_id) {
                    let task: Task = serde_json::from_value(task_value.clone())
                        .map_err(|e| AutomergeError::DeserializationError(e.to_string()))?;
                    return Ok(Some(task));
                }
            }
        }
        
        Ok(None)
    }
    
    pub async fn list_tasks(&self, project_id: &str) -> Result<Vec<Task>, AutomergeError> {
        let doc = self.main_document.read().await;
        let projects = doc.get("projects").unwrap().as_object().unwrap();
        
        if let Some(project) = projects.get(project_id) {
            if let Some(tasks) = project.get("tasks").and_then(|v| v.as_object()) {
                let mut result = Vec::new();
                for task_value in tasks.values() {
                    let task: Task = serde_json::from_value(task_value.clone())
                        .map_err(|e| AutomergeError::DeserializationError(e.to_string()))?;
                    result.push(task);
                }
                
                // 作成日時順でソート
                result.sort_by(|a, b| b.created_at.cmp(&a.created_at));
                
                return Ok(result);
            }
        }
        
        Ok(Vec::new())
    }
    
    pub async fn delete_task(&self, project_id: &str, task_id: &str) -> Result<(), AutomergeError> {
        let mut doc = self.main_document.write().await;
        let projects = doc.get_mut("projects").unwrap().as_object_mut().unwrap();
        
        if let Some(project) = projects.get_mut(project_id) {
            if let Some(tasks) = project.get_mut("tasks").and_then(|v| v.as_object_mut()) {
                tasks.remove(task_id);
            }
        }
        
        Ok(())
    }
    
    // サブタスク操作
    pub async fn set_subtask(&self, project_id: &str, task_id: &str, subtask: &Subtask) -> Result<(), AutomergeError> {
        let mut doc = self.main_document.write().await;
        
        // パス: projects/{project_id}/tasks/{task_id}/subtasks/{subtask_id}
        let projects = doc.get_mut("projects").unwrap().as_object_mut().unwrap();
        
        if let Some(project) = projects.get_mut(project_id) {
            if let Some(tasks) = project.get_mut("tasks").and_then(|v| v.as_object_mut()) {
                if let Some(task) = tasks.get_mut(task_id) {
                    let task_obj = task.as_object_mut().unwrap();
                    
                    if !task_obj.contains_key("subtasks") {
                        task_obj.insert("subtasks".to_string(), serde_json::json!({}));
                    }
                    
                    let subtasks = task_obj.get_mut("subtasks").unwrap().as_object_mut().unwrap();
                    
                    let subtask_value = serde_json::to_value(subtask)
                        .map_err(|e| AutomergeError::SerializationError(e.to_string()))?;
                    
                    subtasks.insert(subtask.id.clone(), subtask_value);
                    return Ok(());
                }
            }
        }
        
        Err(AutomergeError::PathNotFound(format!("Task {}/{} not found", project_id, task_id)))
    }
    
    pub async fn get_subtask(&self, project_id: &str, task_id: &str, subtask_id: &str) -> Result<Option<Subtask>, AutomergeError> {
        let doc = self.main_document.read().await;
        let projects = doc.get("projects").unwrap().as_object().unwrap();
        
        if let Some(project) = projects.get(project_id) {
            if let Some(tasks) = project.get("tasks").and_then(|v| v.as_object()) {
                if let Some(task) = tasks.get(task_id) {
                    if let Some(subtasks) = task.get("subtasks").and_then(|v| v.as_object()) {
                        if let Some(subtask_value) = subtasks.get(subtask_id) {
                            let subtask: Subtask = serde_json::from_value(subtask_value.clone())
                                .map_err(|e| AutomergeError::DeserializationError(e.to_string()))?;
                            return Ok(Some(subtask));
                        }
                    }
                }
            }
        }
        
        Ok(None)
    }
    
    pub async fn list_subtasks(&self, project_id: &str, task_id: &str) -> Result<Vec<Subtask>, AutomergeError> {
        let doc = self.main_document.read().await;
        let projects = doc.get("projects").unwrap().as_object().unwrap();
        
        if let Some(project) = projects.get(project_id) {
            if let Some(tasks) = project.get("tasks").and_then(|v| v.as_object()) {
                if let Some(task) = tasks.get(task_id) {
                    if let Some(subtasks) = task.get("subtasks").and_then(|v| v.as_object()) {
                        let mut result = Vec::new();
                        for subtask_value in subtasks.values() {
                            let subtask: Subtask = serde_json::from_value(subtask_value.clone())
                                .map_err(|e| AutomergeError::DeserializationError(e.to_string()))?;
                            result.push(subtask);
                        }
                        
                        // 作成日時順でソート
                        result.sort_by(|a, b| a.created_at.cmp(&b.created_at));
                        
                        return Ok(result);
                    }
                }
            }
        }
        
        Ok(Vec::new())
    }
    
    pub async fn delete_subtask(&self, project_id: &str, task_id: &str, subtask_id: &str) -> Result<(), AutomergeError> {
        let mut doc = self.main_document.write().await;
        let projects = doc.get_mut("projects").unwrap().as_object_mut().unwrap();
        
        if let Some(project) = projects.get_mut(project_id) {
            if let Some(tasks) = project.get_mut("tasks").and_then(|v| v.as_object_mut()) {
                if let Some(task) = tasks.get_mut(task_id) {
                    if let Some(subtasks) = task.get_mut("subtasks").and_then(|v| v.as_object_mut()) {
                        subtasks.remove(subtask_id);
                    }
                }
            }
        }
        
        Ok(())
    }
    
    // ユーザー操作
    pub async fn set_user(&self, user: &User) -> Result<(), AutomergeError> {
        let mut doc = self.main_document.write().await;
        let users = doc.get_mut("users").unwrap().as_object_mut().unwrap();
        
        let user_value = serde_json::to_value(user)
            .map_err(|e| AutomergeError::SerializationError(e.to_string()))?;
        
        users.insert(user.id.clone(), user_value);
        Ok(())
    }
    
    pub async fn get_user(&self, user_id: &str) -> Result<Option<User>, AutomergeError> {
        let doc = self.main_document.read().await;
        let users = doc.get("users").unwrap().as_object().unwrap();
        
        if let Some(user_value) = users.get(user_id) {
            let user: User = serde_json::from_value(user_value.clone())
                .map_err(|e| AutomergeError::DeserializationError(e.to_string()))?;
            Ok(Some(user))
        } else {
            Ok(None)
        }
    }
    
    // タグ操作
    pub async fn set_tag(&self, tag: &Tag) -> Result<(), AutomergeError> {
        let mut doc = self.main_document.write().await;
        let tags = doc.get_mut("global_tags").unwrap().as_object_mut().unwrap();
        
        let tag_value = serde_json::to_value(tag)
            .map_err(|e| AutomergeError::SerializationError(e.to_string()))?;
        
        tags.insert(tag.id.clone(), tag_value);
        Ok(())
    }
    
    pub async fn get_tag(&self, tag_id: &str) -> Result<Option<Tag>, AutomergeError> {
        let doc = self.main_document.read().await;
        let tags = doc.get("global_tags").unwrap().as_object().unwrap();
        
        if let Some(tag_value) = tags.get(tag_id) {
            let tag: Tag = serde_json::from_value(tag_value.clone())
                .map_err(|e| AutomergeError::DeserializationError(e.to_string()))?;
            Ok(Some(tag))
        } else {
            Ok(None)
        }
    }
    
    pub async fn list_tags(&self) -> Result<Vec<Tag>, AutomergeError> {
        let doc = self.main_document.read().await;
        let tags = doc.get("global_tags").unwrap().as_object().unwrap();
        
        let mut result = Vec::new();
        for tag_value in tags.values() {
            let tag: Tag = serde_json::from_value(tag_value.clone())
                .map_err(|e| AutomergeError::DeserializationError(e.to_string()))?;
            result.push(tag);
        }
        
        // 名前順でソート
        result.sort_by(|a, b| a.name.cmp(&b.name));
        
        Ok(result)
    }
}