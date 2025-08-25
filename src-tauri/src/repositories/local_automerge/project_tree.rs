//! プロジェクトドキュメント構造のAutomergeリポジトリ
//!
//! 正しいProject Document仕様に準拠した実装:
//! - task_lists: タスクリスト基本情報の配列
//! - tasks: タスクの配列（全てトップレベル）
//! - subtasks: サブタスクの配列（全てトップレベル）
//! - tags: タグの配列
//! - members: メンバーの配列

use super::document_manager::{DocumentManager, DocumentType};
use crate::errors::RepositoryError;
use crate::models::{
    project::Member,
    subtask::SubTask,
    tag::Tag,
    task::Task,
    task_list::TaskList,
};
use crate::types::id_types::ProjectId;
use chrono::Utc;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::Mutex;

/// Project Document構造（data-structure.md仕様準拠）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectDocument {
    /// プロジェクトID
    pub id: String,
    /// タスクリスト配列
    pub task_lists: Vec<TaskList>,
    /// タスク配列
    pub tasks: Vec<Task>,
    /// サブタスク配列
    pub subtasks: Vec<SubTask>,
    /// タグ配列
    pub tags: Vec<Tag>,
    /// メンバー配列
    pub members: Vec<Member>,
    /// 作成日時
    pub created_at: String,
    /// 更新日時
    pub updated_at: String,
}

/// プロジェクトドキュメント用のAutomergeリポジトリ
///
/// 正しいProject Document仕様に準拠:
/// ```json
/// {
///   "id": "project-uuid-1",
///   "task_lists": [...],
///   "tasks": [...],
///   "subtasks": [...],
///   "tags": [...],
///   "members": [...]
/// }
/// ```
#[derive(Debug, Clone)]
pub struct ProjectDocumentLocalAutomergeRepository {
    document_manager: Arc<Mutex<DocumentManager>>,
}

impl ProjectDocumentLocalAutomergeRepository {
    /// 新しいProjectDocumentRepositoryを作成
    #[tracing::instrument(level = "trace")]
    pub fn new(base_path: PathBuf) -> Result<Self, RepositoryError> {
        let document_manager = DocumentManager::new(base_path)?;
        Ok(Self {
            document_manager: Arc::new(Mutex::new(document_manager)),
        })
    }

    /// プロジェクトドキュメント全体を取得
    #[tracing::instrument(level = "trace")]
    pub async fn get_project_document(
        &self,
        project_id: &ProjectId,
    ) -> Result<Option<ProjectDocument>, RepositoryError> {
        let mut manager = self.document_manager.lock().await;
        let doc_type = DocumentType::Project(project_id.to_string());

        // 各フィールドを個別に読み込み
        let id: Option<String> = manager.load_data(&doc_type, "id").await?;
        let task_lists: Option<Vec<TaskList>> = manager.load_data(&doc_type, "task_lists").await?;
        let tasks: Option<Vec<Task>> = manager.load_data(&doc_type, "tasks").await?;
        let subtasks: Option<Vec<SubTask>> = manager.load_data(&doc_type, "subtasks").await?;
        let tags: Option<Vec<Tag>> = manager.load_data(&doc_type, "tags").await?;
        let members: Option<Vec<Member>> = manager.load_data(&doc_type, "members").await?;
        let created_at: Option<String> = manager.load_data(&doc_type, "created_at").await?;
        let updated_at: Option<String> = manager.load_data(&doc_type, "updated_at").await?;

        // 全フィールドが存在する場合のみProjectDocumentを構築
        if let (Some(id), Some(task_lists), Some(tasks), Some(subtasks), Some(tags), Some(members), Some(created_at), Some(updated_at)) = 
            (id, task_lists, tasks, subtasks, tags, members, created_at, updated_at) {
            Ok(Some(ProjectDocument {
                id,
                task_lists,
                tasks,
                subtasks,
                tags,
                members,
                created_at,
                updated_at,
            }))
        } else {
            Ok(None)
        }
    }

    /// プロジェクトドキュメント全体を保存
    #[tracing::instrument(level = "trace")]
    pub async fn save_project_document(
        &self,
        project_document: &ProjectDocument,
    ) -> Result<(), RepositoryError> {
        let mut manager = self.document_manager.lock().await;
        let doc_type = DocumentType::Project(project_document.id.clone());

        // 各フィールドを個別に保存
        manager.save_data(&doc_type, "id", &project_document.id).await?;
        manager.save_data(&doc_type, "task_lists", &project_document.task_lists).await?;
        manager.save_data(&doc_type, "tasks", &project_document.tasks).await?;
        manager.save_data(&doc_type, "subtasks", &project_document.subtasks).await?;
        manager.save_data(&doc_type, "tags", &project_document.tags).await?;
        manager.save_data(&doc_type, "members", &project_document.members).await?;
        manager.save_data(&doc_type, "created_at", &project_document.created_at).await?;
        manager.save_data(&doc_type, "updated_at", &project_document.updated_at).await?;
        
        Ok(())
    }

    /// 空のプロジェクトドキュメントを作成
    #[tracing::instrument(level = "trace")]
    pub async fn create_empty_project_document(
        &self,
        project_id: &ProjectId,
    ) -> Result<(), RepositoryError> {
        let now = Utc::now().to_rfc3339();
        let empty_document = ProjectDocument {
            id: project_id.to_string(),
            task_lists: Vec::new(),
            tasks: Vec::new(),
            subtasks: Vec::new(),
            tags: Vec::new(),
            members: Vec::new(),
            created_at: now.clone(),
            updated_at: now,
        };
        
        self.save_project_document(&empty_document).await
    }

    /// タスクリストを追加
    #[tracing::instrument(level = "trace")]
    pub async fn add_task_list(
        &self,
        project_id: &ProjectId,
        task_list: &TaskList,
    ) -> Result<(), RepositoryError> {
        // プロジェクトドキュメントを取得または作成
        let mut document = if let Some(doc) = self.get_project_document(project_id).await? {
            doc
        } else {
            // 存在しない場合は空のドキュメントを作成
            self.create_empty_project_document(project_id).await?;
            self.get_project_document(project_id).await?.unwrap()
        };

        // タスクリストを追加
        document.task_lists.push(task_list.clone());
        document.updated_at = Utc::now().to_rfc3339();
        
        self.save_project_document(&document).await
    }

    /// タスクを追加
    #[tracing::instrument(level = "trace")]
    pub async fn add_task(
        &self,
        project_id: &ProjectId,
        task: &Task,
    ) -> Result<(), RepositoryError> {
        // プロジェクトドキュメントを取得または作成
        let mut document = if let Some(doc) = self.get_project_document(project_id).await? {
            doc
        } else {
            // 存在しない場合は空のドキュメントを作成
            self.create_empty_project_document(project_id).await?;
            self.get_project_document(project_id).await?.unwrap()
        };

        // タスクを追加
        document.tasks.push(task.clone());
        document.updated_at = Utc::now().to_rfc3339();
        
        self.save_project_document(&document).await
    }

    /// サブタスクを追加
    #[tracing::instrument(level = "trace")]
    pub async fn add_subtask(
        &self,
        project_id: &ProjectId,
        subtask: &SubTask,
    ) -> Result<(), RepositoryError> {
        // プロジェクトドキュメントを取得または作成
        let mut document = if let Some(doc) = self.get_project_document(project_id).await? {
            doc
        } else {
            // 存在しない場合は空のドキュメントを作成
            self.create_empty_project_document(project_id).await?;
            self.get_project_document(project_id).await?.unwrap()
        };

        // サブタスクを追加
        document.subtasks.push(subtask.clone());
        document.updated_at = Utc::now().to_rfc3339();
        
        self.save_project_document(&document).await
    }

    /// タグを追加
    #[tracing::instrument(level = "trace")]
    pub async fn add_tag(
        &self,
        project_id: &ProjectId,
        tag: &Tag,
    ) -> Result<(), RepositoryError> {
        // プロジェクトドキュメントを取得または作成
        let mut document = if let Some(doc) = self.get_project_document(project_id).await? {
            doc
        } else {
            // 存在しない場合は空のドキュメントを作成
            self.create_empty_project_document(project_id).await?;
            self.get_project_document(project_id).await?.unwrap()
        };

        // タグを追加
        document.tags.push(tag.clone());
        document.updated_at = Utc::now().to_rfc3339();
        
        self.save_project_document(&document).await
    }

    /// メンバーを追加
    #[tracing::instrument(level = "trace")]
    pub async fn add_member(
        &self,
        project_id: &ProjectId,
        member: &Member,
    ) -> Result<(), RepositoryError> {
        // プロジェクトドキュメントを取得または作成
        let mut document = if let Some(doc) = self.get_project_document(project_id).await? {
            doc
        } else {
            // 存在しない場合は空のドキュメントを作成
            self.create_empty_project_document(project_id).await?;
            self.get_project_document(project_id).await?.unwrap()
        };

        // メンバーを追加
        document.members.push(member.clone());
        document.updated_at = Utc::now().to_rfc3339();
        
        self.save_project_document(&document).await
    }

    /// プロジェクト内の全タスクを取得
    #[tracing::instrument(level = "trace")]
    pub async fn get_tasks(&self, project_id: &ProjectId) -> Result<Vec<Task>, RepositoryError> {
        if let Some(document) = self.get_project_document(project_id).await? {
            Ok(document.tasks)
        } else {
            Ok(Vec::new())
        }
    }

    /// プロジェクト内の全タスクリストを取得
    #[tracing::instrument(level = "trace")]
    pub async fn get_task_lists(&self, project_id: &ProjectId) -> Result<Vec<TaskList>, RepositoryError> {
        if let Some(document) = self.get_project_document(project_id).await? {
            Ok(document.task_lists)
        } else {
            Ok(Vec::new())
        }
    }

    /// プロジェクト内の全サブタスクを取得
    #[tracing::instrument(level = "trace")]
    pub async fn get_subtasks(&self, project_id: &ProjectId) -> Result<Vec<SubTask>, RepositoryError> {
        if let Some(document) = self.get_project_document(project_id).await? {
            Ok(document.subtasks)
        } else {
            Ok(Vec::new())
        }
    }

    /// プロジェクト内の全タグを取得
    #[tracing::instrument(level = "trace")]
    pub async fn get_tags(&self, project_id: &ProjectId) -> Result<Vec<Tag>, RepositoryError> {
        if let Some(document) = self.get_project_document(project_id).await? {
            Ok(document.tags)
        } else {
            Ok(Vec::new())
        }
    }

    /// プロジェクト内の全メンバーを取得
    #[tracing::instrument(level = "trace")]
    pub async fn get_members(&self, project_id: &ProjectId) -> Result<Vec<Member>, RepositoryError> {
        if let Some(document) = self.get_project_document(project_id).await? {
            Ok(document.members)
        } else {
            Ok(Vec::new())
        }
    }
}