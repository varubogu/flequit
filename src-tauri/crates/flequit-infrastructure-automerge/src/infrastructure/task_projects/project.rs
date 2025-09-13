use crate::infrastructure::document::Document;

use super::super::document_manager::{DocumentManager, DocumentType};
use async_trait::async_trait;
use chrono::{DateTime, Utc};
use flequit_model::models::task_projects::member::Member;
use flequit_model::models::task_projects::{
    project::Project, subtask::SubTask, tag::Tag, task::Task, task_list::TaskList,
};
use flequit_model::types::id_types::{ProjectId, UserId};
use flequit_model::types::project_types::ProjectStatus;
use flequit_repository::base_repository_trait::Repository;
use flequit_repository::repositories::task_projects::project_repository_trait::ProjectRepositoryTrait;
use flequit_types::errors::repository_error::RepositoryError;
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use std::sync::Arc;
use tokio::sync::Mutex;

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
/// DocumentManager (プロジェクトごとのドキュメント管理)
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
/// - **ステートレス**: プロジェクトIDは必要時に引数で受け取る
#[derive(Debug)]
pub struct ProjectLocalAutomergeRepository {
    document_manager: Arc<Mutex<DocumentManager>>,
}

impl ProjectLocalAutomergeRepository {
    /// 新しいProjectRepositoryを作成

    pub async fn new(base_path: PathBuf) -> Result<Self, RepositoryError> {
        let document_manager = DocumentManager::new(base_path)?;
        Ok(Self {
            document_manager: Arc::new(Mutex::new(document_manager)),
        })
    }

    /// 共有DocumentManagerを使用して新しいインスタンスを作成

    pub async fn new_with_manager(
        document_manager: Arc<Mutex<DocumentManager>>,
    ) -> Result<Self, RepositoryError> {
        Ok(Self {
            document_manager,
        })
    }

    /// 指定されたプロジェクトのDocumentを取得または作成

    async fn get_or_create_document(
        &self,
        project_id: &ProjectId,
    ) -> Result<Document, RepositoryError> {
        let doc_type = DocumentType::Project(project_id.clone());
        let mut manager = self.document_manager.lock().await;
        manager
            .get_or_create(&doc_type)
            .await
            .map_err(|e| RepositoryError::AutomergeError(e.to_string()))
    }

    /// プロジェクトドキュメント全体を取得

    pub async fn get_project_document(
        &self,
        project_id: &ProjectId,
    ) -> Result<Option<ProjectDocument>, RepositoryError> {
        let document = self.get_or_create_document(project_id).await?;

        // 基本プロジェクト情報の読み込み
        let id: Option<String> = document.load_data("id").await?;
        let name: Option<String> = document.load_data("name").await?;
        let description: Option<Option<String>> = document.load_data("description").await?;
        let color: Option<Option<String>> = document.load_data("color").await?;
        let order_index: Option<i32> = document.load_data("order_index").await?;
        let is_archived: Option<bool> = document.load_data("is_archived").await?;
        let status: Option<Option<ProjectStatus>> = document.load_data("status").await?;
        let owner_id: Option<Option<UserId>> = document.load_data("owner_id").await?;
        let created_at: Option<DateTime<Utc>> = document.load_data("created_at").await?;
        let updated_at: Option<DateTime<Utc>> = document.load_data("updated_at").await?;

        // プロジェクト内エンティティの読み込み
        let task_lists: Option<Vec<TaskList>> = document.load_data("task_lists").await?;
        let tasks: Option<Vec<Task>> = document.load_data("tasks").await?;
        let subtasks: Option<Vec<SubTask>> = document.load_data("subtasks").await?;
        let tags: Option<Vec<Tag>> = document.load_data("tags").await?;
        let members: Option<Vec<Member>> = document.load_data("members").await?;

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

    pub async fn save_project_document(
        &self,
        project_id: &ProjectId,
        project_document: &ProjectDocument,
    ) -> Result<(), RepositoryError> {
        let document = self.get_or_create_document(project_id).await?;

        // 基本プロジェクト情報を個別に保存
        document.save_data("id", &project_document.id).await?;
        document.save_data("name", &project_document.name).await?;
        document
            .save_data("description", &project_document.description)
            .await?;
        document.save_data("color", &project_document.color).await?;
        document
            .save_data("order_index", &project_document.order_index)
            .await?;
        document
            .save_data("is_archived", &project_document.is_archived)
            .await?;
        document
            .save_data("status", &project_document.status)
            .await?;
        document
            .save_data("owner_id", &project_document.owner_id)
            .await?;
        document
            .save_data("created_at", &project_document.created_at)
            .await?;
        document
            .save_data("updated_at", &project_document.updated_at)
            .await?;

        // プロジェクト内エンティティを個別に保存
        document
            .save_data("task_lists", &project_document.task_lists)
            .await?;
        document.save_data("tasks", &project_document.tasks).await?;
        document
            .save_data("subtasks", &project_document.subtasks)
            .await?;
        document.save_data("tags", &project_document.tags).await?;
        document
            .save_data("members", &project_document.members)
            .await?;

        Ok(())
    }

    /// 空のプロジェクトドキュメントを作成

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

        self.save_project_document(&project.id, &empty_document)
            .await
    }

    /// IDでプロジェクトを取得（プロジェクトドキュメントから基本情報のみ）

    pub async fn get_project(&self, project_id: &str) -> Result<Option<Project>, RepositoryError> {
        if let Some(document) = self
            .get_project_document(&ProjectId::from(project_id))
            .await?
        {
            Ok(Some(Project {
                id: ProjectId::from(document.id),
                name: document.name,
                description: document.description,
                color: document.color,
                order_index: document.order_index,
                is_archived: document.is_archived,
                status: document.status,
                owner_id: document.owner_id,
                created_at: document.created_at,
                updated_at: document.updated_at,
            }))
        } else {
            Ok(None)
        }
    }

    /// プロジェクトを作成または更新（基本情報のみ）

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

            self.save_project_document(&project.id, &document).await
        } else {
            log::info!(
                "set_project - 新規プロジェクトドキュメント作成: {:?}",
                project.id
            );
            // 新規プロジェクトドキュメントを作成
            self.create_empty_project_document(project).await
        }
    }

    /// タスクリストを追加

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

        self.save_project_document(project_id, &document).await
    }

    /// タスクを追加

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

        self.save_project_document(project_id, &document).await
    }

    /// サブタスクを追加

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

        self.save_project_document(project_id, &document).await
    }

    /// タグを追加

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

        self.save_project_document(project_id, &document).await
    }

    /// メンバーを追加

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

        self.save_project_document(project_id, &document).await
    }

    /// プロジェクト内の全タスクを取得

    pub async fn get_tasks(&self, project_id: &ProjectId) -> Result<Vec<Task>, RepositoryError> {
        if let Some(document) = self.get_project_document(project_id).await? {
            Ok(document.tasks)
        } else {
            Ok(Vec::new())
        }
    }

    /// プロジェクト内の全タスクリストを取得

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

    pub async fn get_tags(&self, project_id: &ProjectId) -> Result<Vec<Tag>, RepositoryError> {
        if let Some(document) = self.get_project_document(project_id).await? {
            Ok(document.tags)
        } else {
            Ok(Vec::new())
        }
    }

    /// プロジェクト内の全メンバーを取得

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

    /// プロジェクトドキュメント自体を削除

    pub async fn delete_project_document(
        &self,
        project_id: &ProjectId,
    ) -> Result<(), RepositoryError> {
        let mut manager = self.document_manager.lock().await;
        let doc_type = DocumentType::Project(project_id.clone());
        manager
            .delete(doc_type)
            .map_err(|e| RepositoryError::AutomergeError(e.to_string()))
    }

    /// JSON出力機能：プロジェクト変更履歴をエクスポート

    pub async fn export_project_changes_history<P: AsRef<Path>>(
        &self,
        project_id: &ProjectId,
        output_dir: P,
        description: Option<&str>,
    ) -> Result<(), RepositoryError> {
        let document = self.get_or_create_document(project_id).await?;
        document
            .export_document_changes_history(&output_dir, description)
            .await
            .map_err(|e| RepositoryError::Export(e.to_string()))
    }

    /// JSON出力機能：現在のプロジェクト状態をファイルにエクスポート

    pub async fn export_project_state<P: AsRef<Path>>(
        &self,
        project_id: &ProjectId,
        file_path: P,
        description: Option<&str>,
    ) -> Result<(), RepositoryError> {
        let document = self.get_or_create_document(project_id).await?;
        document
            .export_json(&file_path, description)
            .await
            .map_err(|e| RepositoryError::Export(e.to_string()))
    }
}

#[async_trait]
impl Repository<Project, ProjectId> for ProjectLocalAutomergeRepository {

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


    async fn find_by_id(&self, id: &ProjectId) -> Result<Option<Project>, RepositoryError> {
        self.get_project(&id.to_string()).await
    }


    async fn find_all(&self) -> Result<Vec<Project>, RepositoryError> {
        // 注意: この実装は個別プロジェクト管理の範囲外
        // 一覧取得はProjectListLocalAutomergeRepositoryを使用してください
        Err(RepositoryError::NotFound(
            "Use ProjectListLocalAutomergeRepository for project listing".to_string(),
        ))
    }


    async fn delete(&self, id: &ProjectId) -> Result<(), RepositoryError> {
        // プロジェクトドキュメント自体を削除
        // 注意: プロジェクト一覧からの削除は別途ProjectListLocalAutomergeRepositoryで行ってください
        self.delete_project_document(id).await
    }


    async fn exists(&self, id: &ProjectId) -> Result<bool, RepositoryError> {
        let found = self.find_by_id(id).await?;
        Ok(found.is_some())
    }


    async fn count(&self) -> Result<u64, RepositoryError> {
        // 注意: この実装は個別プロジェクト管理の範囲外
        // カウント取得はProjectListLocalAutomergeRepositoryを使用してください
        Err(RepositoryError::NotFound(
            "Use ProjectListLocalAutomergeRepository for project counting".to_string(),
        ))
    }
}

#[async_trait]
impl ProjectRepositoryTrait for ProjectLocalAutomergeRepository {}
