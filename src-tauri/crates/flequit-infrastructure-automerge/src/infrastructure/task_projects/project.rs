use crate::infrastructure::document::Document;

use super::super::document_manager::{DocumentManager, DocumentType};
use flequit_model::models::task_projects::{
    project::Project,
    subtask::SubTask,
    tag::Tag,
    task::Task,
    task_list::TaskList,
};
use flequit_repository::repositories::base_repository_trait::Repository;
use flequit_repository::repositories::task_projects::project_repository_trait::ProjectRepositoryTrait;
use flequit_model::types::id_types::{ProjectId, UserId};
use flequit_model::types::project_types::ProjectStatus;
use async_trait::async_trait;
use chrono::{DateTime, Utc};
use flequit_types::errors::repository_error::RepositoryError;
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use std::sync::Arc;
use tokio::sync::Mutex;
use flequit_model::models::task_projects::member::Member;

/// Project Document構造（data-structure.md仕様準拠）
///
/// models/project::Projectの全プロパティ + プロジェクト内のすべてのエンティティを含む
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectDocument {
    // models/project::Projectのプロパティ
    /// プロジェクトの一意識別子
    pub id: String,
    /// プロジェクト名（必須）
    pub name: String,
    /// プロジェクトの説明文
    pub description: Option<String>,
    /// UI表示用のカラーコード（Svelteフロントエンド対応）
    pub color: Option<String>,
    /// 表示順序（昇順ソート用）
    pub order_index: i32,
    /// アーカイブ状態フラグ
    pub is_archived: bool,
    /// プロジェクトステータス（進行中、完了等）
    pub status: Option<ProjectStatus>,
    /// プロジェクトオーナーのユーザーID
    pub owner_id: Option<UserId>,
    /// プロジェクト作成日時
    pub created_at: DateTime<Utc>,
    /// 最終更新日時
    pub updated_at: DateTime<Utc>,

    // プロジェクト内のエンティティ
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
}

/// Automerge実装のプロジェクトリポジトリ
///
/// `Repository<Project>`と`ProjectRepositoryTrait`を実装し、
/// Automerge-Repoを使用したプロジェクト管理を提供する。
///
/// # アーキテクチャ
///
/// ```text
/// LocalAutomergeProjectRepository (このクラス)
///   | 委譲
/// InnerProjectsRepository (既存の実装)
///   | データアクセス
/// Automerge Documents
/// ```
///
/// # 特徴
///
/// - **分散同期**: CRDTによる競合解決機能
/// - **履歴管理**: すべての変更履歴を保持
/// - **オフライン対応**: ローカル優先で同期可能
/// - **JSON互換**: 構造化データの効率的な管理
#[derive(Debug)]
pub struct ProjectLocalAutomergeRepository {
    document_manager: Arc<Mutex<DocumentManager>>,
    document: Document,
}

impl ProjectLocalAutomergeRepository {
    /// 新しいProjectRepositoryを作成
    #[tracing::instrument(level = "trace")]
    pub async fn new(base_path: PathBuf, project_id: ProjectId) -> Result<Self, RepositoryError> {
        let doc_type = &DocumentType::Project(ProjectId::from(project_id));
        let mut document_manager = DocumentManager::new(base_path)?;
        let doc = document_manager.get_or_create(doc_type).await?;
        Ok(Self {
            document_manager: Arc::new(Mutex::new(document_manager)),
            document: doc,
        })
    }

    /// 共有DocumentManagerを使用して新しいインスタンスを作成
    #[tracing::instrument(level = "trace")]
    pub async fn new_with_manager(
        document_manager: Arc<Mutex<DocumentManager>>,
        project_id: ProjectId
    ) -> Result<Self, RepositoryError> {
        let doc_type = &DocumentType::Project(ProjectId::from(project_id));
        let doc = {
            let mut manager = document_manager.lock().await;
            manager.get_or_create(doc_type).await?
        };
        Ok(Self {
            document_manager,
            document: doc,
        })
    }

    /// 全プロジェクトを取得（基本情報のみ）
    #[tracing::instrument(level = "trace")]
    pub async fn list_projects(&self) -> Result<Vec<Project>, RepositoryError> {
        let projects = {
            self.document
                .load_data::<Vec<Project>>("projects")
                .await?
        };
        if let Some(projects) = projects {
            Ok(projects)
        } else {
            Ok(Vec::new())
        }
    }

    /// プロジェクトドキュメント全体を取得
    #[tracing::instrument(level = "trace")]
    pub async fn get_project_document(
        &self,
        project_id: &ProjectId,
    ) -> Result<Option<ProjectDocument>, RepositoryError> {
        let mut manager = self.document_manager.lock().await;
        let doc_type = DocumentType::Project(project_id.clone());

        // 基本プロジェクト情報の読み込み
        let id: Option<String> = manager.load_data(&doc_type, "id").await?;
        let name: Option<String> = manager.load_data(&doc_type, "name").await?;
        let description: Option<Option<String>> =
            manager.load_data(&doc_type, "description").await?;
        let color: Option<Option<String>> = manager.load_data(&doc_type, "color").await?;
        let order_index: Option<i32> = manager.load_data(&doc_type, "order_index").await?;
        let is_archived: Option<bool> = manager.load_data(&doc_type, "is_archived").await?;
        let status: Option<Option<ProjectStatus>> = manager.load_data(&doc_type, "status").await?;
        let owner_id: Option<Option<UserId>> = manager.load_data(&doc_type, "owner_id").await?;
        let created_at: Option<DateTime<Utc>> = manager.load_data(&doc_type, "created_at").await?;
        let updated_at: Option<DateTime<Utc>> = manager.load_data(&doc_type, "updated_at").await?;

        // プロジェクト内エンティティの読み込み
        let task_lists: Option<Vec<TaskList>> = manager.load_data(&doc_type, "task_lists").await?;
        let tasks: Option<Vec<Task>> = manager.load_data(&doc_type, "tasks").await?;
        let subtasks: Option<Vec<SubTask>> = manager.load_data(&doc_type, "subtasks").await?;
        let tags: Option<Vec<Tag>> = manager.load_data(&doc_type, "tags").await?;
        let members: Option<Vec<Member>> = manager.load_data(&doc_type, "members").await?;

        // 必須フィールドが存在する場合のみProjectDocumentを構築
        if let (Some(id), Some(name), Some(created_at), Some(updated_at)) =
            (id, name, created_at, updated_at)
        {
            Ok(Some(ProjectDocument {
                id,
                name,
                description: description.unwrap_or(None),
                color: color.unwrap_or(None),
                order_index: order_index.unwrap_or(0),
                is_archived: is_archived.unwrap_or(false),
                status: status.unwrap_or(None),
                owner_id: owner_id.unwrap_or(None),
                created_at,
                updated_at,
                task_lists: task_lists.unwrap_or_default(),
                tasks: tasks.unwrap_or_default(),
                subtasks: subtasks.unwrap_or_default(),
                tags: tags.unwrap_or_default(),
                members: members.unwrap_or_default(),
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
        let project_id = ProjectId::from(project_document.id.clone());
        let doc_type = DocumentType::Project(project_id);

        // 基本プロジェクト情報を個別に保存
        manager
            .save_data(&doc_type, "id", &project_document.id)
            .await?;
        manager
            .save_data(&doc_type, "name", &project_document.name)
            .await?;
        manager
            .save_data(&doc_type, "description", &project_document.description)
            .await?;
        manager
            .save_data(&doc_type, "color", &project_document.color)
            .await?;
        manager
            .save_data(&doc_type, "order_index", &project_document.order_index)
            .await?;
        manager
            .save_data(&doc_type, "is_archived", &project_document.is_archived)
            .await?;
        manager
            .save_data(&doc_type, "status", &project_document.status)
            .await?;
        manager
            .save_data(&doc_type, "owner_id", &project_document.owner_id)
            .await?;
        manager
            .save_data(&doc_type, "created_at", &project_document.created_at)
            .await?;
        manager
            .save_data(&doc_type, "updated_at", &project_document.updated_at)
            .await?;

        // プロジェクト内エンティティを個別に保存
        manager
            .save_data(&doc_type, "task_lists", &project_document.task_lists)
            .await?;
        manager
            .save_data(&doc_type, "tasks", &project_document.tasks)
            .await?;
        manager
            .save_data(&doc_type, "subtasks", &project_document.subtasks)
            .await?;
        manager
            .save_data(&doc_type, "tags", &project_document.tags)
            .await?;
        manager
            .save_data(&doc_type, "members", &project_document.members)
            .await?;

        Ok(())
    }

    /// 空のプロジェクトドキュメントを作成
    #[tracing::instrument(level = "trace")]
    pub async fn create_empty_project_document(
        &self,
        project: &Project,
    ) -> Result<(), RepositoryError> {
        let empty_document = ProjectDocument {
            id: project.id.to_string(),
            name: project.name.clone(),
            description: project.description.clone(),
            color: project.color.clone(),
            order_index: project.order_index,
            is_archived: project.is_archived,
            status: project.status.clone(),
            owner_id: project.owner_id.clone(),
            created_at: project.created_at,
            updated_at: project.updated_at,
            task_lists: Vec::new(),
            tasks: Vec::new(),
            subtasks: Vec::new(),
            tags: Vec::new(),
            members: Vec::new(),
        };

        self.save_project_document(&empty_document).await
    }

    /// IDでプロジェクトを取得
    #[tracing::instrument(level = "trace")]
    pub async fn get_project(&self, project_id: &str) -> Result<Option<Project>, RepositoryError> {
        let projects = self.list_projects().await?;
        Ok(projects.into_iter().find(|p| p.id == project_id.into()))
    }

    /// プロジェクトを作成または更新（基本情報のみ）
    #[tracing::instrument(level = "trace")]
    pub async fn set_project(&self, project: &Project) -> Result<(), RepositoryError> {
        log::info!("set_project - 開始: {:?}", project.id);

        // プロジェクトドキュメントが存在するか確認
        if let Some(mut document) = self.get_project_document(&project.id).await? {
            log::info!(
                "set_project - 既存プロジェクトドキュメントを更新: {:?}",
                project.id
            );
            // 基本情報のみ更新（エンティティは保持）
            document.name = project.name.clone();
            document.description = project.description.clone();
            document.color = project.color.clone();
            document.order_index = project.order_index;
            document.is_archived = project.is_archived;
            document.status = project.status.clone();
            document.owner_id = project.owner_id.clone();
            document.updated_at = project.updated_at;

            self.save_project_document(&document).await?
        } else {
            log::info!(
                "set_project - 新規プロジェクトドキュメント作成: {:?}",
                project.id
            );
            // 新規プロジェクトドキュメントを作成
            self.create_empty_project_document(project).await?
        }

        // プロジェクト一覧も更新
        let mut projects = self.list_projects().await?;
        if let Some(existing) = projects.iter_mut().find(|p| p.id == project.id) {
            *existing = project.clone();
        } else {
            projects.push(project.clone());
        }

        let result = self.document
            .save_data("projects", &projects)
            .await
            .map_err(|e| RepositoryError::AutomergeError(e.to_string()));

        match result {
            Ok(_) => {
                log::info!("set_project - Automergeドキュメント保存完了");
                return Ok(())
            },
            Err(e) => {
                log::error!("set_project - Automergeドキュメント保存エラー: {:?}", e);
                return Err(RepositoryError::AutomergeError(e.to_string()))
            }
        }
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
            return Err(RepositoryError::NotFound(format!(
                "Project not found: {}",
                project_id
            )));
        };

        // タスクリストを追加
        document.task_lists.push(task_list.clone());
        document.updated_at = Utc::now();

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
            return Err(RepositoryError::NotFound(format!(
                "Project not found: {}",
                project_id
            )));
        };

        // タスクを追加
        document.tasks.push(task.clone());
        document.updated_at = Utc::now();

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
            return Err(RepositoryError::NotFound(format!(
                "Project not found: {}",
                project_id
            )));
        };

        // サブタスクを追加
        document.subtasks.push(subtask.clone());
        document.updated_at = Utc::now();

        self.save_project_document(&document).await
    }

    /// タグを追加
    #[tracing::instrument(level = "trace")]
    pub async fn add_tag(&self, project_id: &ProjectId, tag: &Tag) -> Result<(), RepositoryError> {
        // プロジェクトドキュメントを取得または作成
        let mut document = if let Some(doc) = self.get_project_document(project_id).await? {
            doc
        } else {
            return Err(RepositoryError::NotFound(format!(
                "Project not found: {}",
                project_id
            )));
        };

        // タグを追加
        document.tags.push(tag.clone());
        document.updated_at = Utc::now();

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
            return Err(RepositoryError::NotFound(format!(
                "Project not found: {}",
                project_id
            )));
        };

        // メンバーを追加
        document.members.push(member.clone());
        document.updated_at = Utc::now();

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
    pub async fn get_task_lists(
        &self,
        project_id: &ProjectId,
    ) -> Result<Vec<TaskList>, RepositoryError> {
        if let Some(document) = self.get_project_document(project_id).await? {
            Ok(document.task_lists)
        } else {
            Ok(Vec::new())
        }
    }

    /// プロジェクト内の全サブタスクを取得
    #[tracing::instrument(level = "trace")]
    pub async fn get_subtasks(
        &self,
        project_id: &ProjectId,
    ) -> Result<Vec<SubTask>, RepositoryError> {
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
    pub async fn get_members(
        &self,
        project_id: &ProjectId,
    ) -> Result<Vec<Member>, RepositoryError> {
        if let Some(document) = self.get_project_document(project_id).await? {
            Ok(document.members)
        } else {
            Ok(Vec::new())
        }
    }

    /// プロジェクトを削除
    #[tracing::instrument(level = "trace")]
    pub async fn delete_project(&self, project_id: &str) -> Result<bool, RepositoryError> {
        let mut projects = self.list_projects().await?;
        let initial_len = projects.len();
        projects.retain(|p| p.id != project_id.into());

        if projects.len() != initial_len {
            self.document
                .save_data("projects", &projects)
                .await?;
            Ok(true)
        } else {
            Ok(false)
        }
    }

    /// JSON出力機能：プロジェクト変更履歴をエクスポート
    #[tracing::instrument(level = "trace", skip(output_dir))]
    pub async fn export_project_changes_history<P: AsRef<Path>>(
        &self,
        output_dir: P,
        description: Option<&str>,
    ) -> Result<(), RepositoryError> {
        self.document
            .export_document_changes_history(&output_dir, description)
            .await
            .map_err(|e| RepositoryError::Export(e.to_string()))
    }

    /// JSON出力機能：現在のプロジェクト状態をファイルにエクスポート
    #[tracing::instrument(level = "trace", skip(file_path))]
    pub async fn export_project_state<P: AsRef<Path>>(
        &self,
        file_path: P,
        description: Option<&str>,
    ) -> Result<(), RepositoryError> {
        self.document
            .export_json(&file_path, description)
            .await
            .map_err(|e| RepositoryError::Export(e.to_string()))
    }
}

#[async_trait]
impl Repository<Project, ProjectId> for ProjectLocalAutomergeRepository {
    #[tracing::instrument(level = "trace")]
    async fn save(&self, entity: &Project) -> Result<(), RepositoryError> {
        log::info!(
            "ProjectLocalAutomergeRepository::save - 開始: {:?}",
            entity.id
        );
        let result = self.set_project(entity).await;
        if result.is_ok() {
            log::info!(
                "ProjectLocalAutomergeRepository::save - 完了: {:?}",
                entity.id
            );
        } else {
            log::error!(
                "ProjectLocalAutomergeRepository::save - エラー: {:?}",
                result
            );
        }
        result
    }

    #[tracing::instrument(level = "trace")]
    async fn find_by_id(&self, id: &ProjectId) -> Result<Option<Project>, RepositoryError> {
        self.get_project(&id.to_string()).await
    }

    #[tracing::instrument(level = "trace")]
    async fn find_all(&self) -> Result<Vec<Project>, RepositoryError> {
        self.list_projects().await
    }

    #[tracing::instrument(level = "trace")]
    async fn delete(&self, id: &ProjectId) -> Result<(), RepositoryError> {
        let deleted = self.delete_project(&id.to_string()).await?;
        if deleted {
            Ok(())
        } else {
            Err(RepositoryError::NotFound(format!(
                "Project not found: {}",
                id
            )))
        }
    }

    #[tracing::instrument(level = "trace")]
    async fn exists(&self, id: &ProjectId) -> Result<bool, RepositoryError> {
        let found = self.find_by_id(id).await?;
        Ok(found.is_some())
    }

    #[tracing::instrument(level = "trace")]
    async fn count(&self) -> Result<u64, RepositoryError> {
        let projects = self.find_all().await?;
        Ok(projects.len() as u64)
    }
}

#[async_trait]
impl ProjectRepositoryTrait for ProjectLocalAutomergeRepository {}
