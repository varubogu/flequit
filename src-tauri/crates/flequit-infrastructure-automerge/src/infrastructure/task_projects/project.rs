use crate::infrastructure::document::Document;

use super::super::document_manager::{DocumentManager, DocumentType};
use async_trait::async_trait;
use chrono::{DateTime, Utc};
use flequit_model::models::task_projects::member::Member;
use flequit_model::models::task_projects::{
    project::Project, subtask::SubTask, tag::Tag, task::Task, task_list::TaskList,
};
use flequit_model::traits::Trackable;
use flequit_model::types::id_types::{ProjectId, TagId, TaskId, TaskListId, UserId};
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
    /// 最終更新者のユーザーID
    pub updated_by: UserId,
    /// 論理削除フラグ
    pub deleted: bool,

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
        Ok(Self { document_manager })
    }

    /// 指定されたプロジェクトのDocumentを取得または作成
    async fn get_or_create_document(
        &self,
        project_id: &ProjectId,
    ) -> Result<Document, RepositoryError> {
        let doc_type = DocumentType::Project(*project_id);
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
        let updated_by: Option<UserId> = document.load_data("updated_by").await?;
        let deleted: Option<bool> = document.load_data("deleted").await?;

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
                id: id.clone(),
                name,
                description: description.unwrap_or(None),
                color: color.unwrap_or(None),
                order_index: order_index.unwrap_or(0),
                is_archived: is_archived.unwrap_or(false),
                status: status.unwrap_or(None),
                owner_id: owner_id.unwrap_or(None),
                created_at,
                updated_at,
                updated_by: updated_by.unwrap_or_else(|| UserId::from(id)),
                deleted: deleted.unwrap_or(false),
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
        document
            .save_data("updated_by", &project_document.updated_by)
            .await?;
        document
            .save_data("deleted", &project_document.deleted)
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
            owner_id: project.owner_id,
            created_at: project.created_at,
            updated_at: project.updated_at,
            updated_by: project.updated_by,
            deleted: project.deleted,
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
                updated_by: document.updated_by,
                deleted: document.deleted,
            }))
        } else {
            Ok(None)
        }
    }

    /// プロジェクトを作成または更新（基本情報のみ）
    pub async fn set_project(&self, project: &Project) -> Result<(), RepositoryError> {
        tracing::info!("set_project - 開始: {:?}", project.id);

        // プロジェクトドキュメントが存在するか確認
        if let Some(mut document) = self.get_project_document(&project.id).await? {
            tracing::info!(
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
            document.owner_id = project.owner_id;
            document.updated_at = project.updated_at;
            document.updated_by = project.updated_by;
            document.deleted = project.deleted;

            self.save_project_document(&project.id, &document).await
        } else {
            tracing::info!(
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
        let doc_type = DocumentType::Project(*project_id);
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

    // ========== 論理削除メソッド（Phase 1） ==========

    /// プロジェクトを論理削除（deleted=trueに設定）
    ///
    /// # 引数
    /// * `project_id` - 削除するプロジェクトのID
    /// * `user_id` - 削除操作を実行するユーザーのID
    /// * `timestamp` - 削除操作の日時
    ///
    /// # 戻り値
    /// 成功時は`Ok(())`、プロジェクトが見つからない場合は`Err(RepositoryError::NotFound)`
    pub async fn mark_project_deleted(
        &self,
        project_id: &ProjectId,
        user_id: &UserId,
        timestamp: &DateTime<Utc>,
    ) -> Result<(), RepositoryError> {
        if let Some(mut project) = self.get_project(&project_id.to_string()).await? {
            // Trackableトレイトを使用して論理削除
            project.mark_deleted(*user_id, *timestamp);
            self.set_project(&project).await
        } else {
            Err(RepositoryError::NotFound(format!(
                "Project not found: {}",
                project_id
            )))
        }
    }

    /// プロジェクト内のすべてのタスクを論理削除
    pub async fn mark_all_tasks_deleted(
        &self,
        project_id: &ProjectId,
        user_id: &UserId,
        timestamp: &DateTime<Utc>,
    ) -> Result<(), RepositoryError> {
        let mut document = self
            .get_project_document(project_id)
            .await?
            .ok_or_else(|| {
                RepositoryError::NotFound(format!("Project not found: {}", project_id))
            })?;

        for task in &mut document.tasks {
            task.mark_deleted(*user_id, *timestamp);
        }

        self.save_project_document(project_id, &document).await
    }

    /// プロジェクト内のすべてのタグを論理削除
    pub async fn mark_all_tags_deleted(
        &self,
        project_id: &ProjectId,
        user_id: &UserId,
        timestamp: &DateTime<Utc>,
    ) -> Result<(), RepositoryError> {
        let mut document = self
            .get_project_document(project_id)
            .await?
            .ok_or_else(|| {
                RepositoryError::NotFound(format!("Project not found: {}", project_id))
            })?;

        for tag in &mut document.tags {
            tag.mark_deleted(*user_id, *timestamp);
        }

        self.save_project_document(project_id, &document).await
    }

    /// プロジェクト内のすべてのタスクリストを論理削除
    pub async fn mark_all_task_lists_deleted(
        &self,
        project_id: &ProjectId,
        user_id: &UserId,
        timestamp: &DateTime<Utc>,
    ) -> Result<(), RepositoryError> {
        let mut document = self
            .get_project_document(project_id)
            .await?
            .ok_or_else(|| {
                RepositoryError::NotFound(format!("Project not found: {}", project_id))
            })?;

        for task_list in &mut document.task_lists {
            task_list.mark_deleted(*user_id, *timestamp);
        }

        self.save_project_document(project_id, &document).await
    }

    // ========== スナップショット機能（Phase 2） ==========

    /// スナップショットを作成（更新前の状態を保存）
    ///
    /// トランザクション中のロールバック用に、プロジェクトドキュメント全体をメモリに保持します。
    ///
    /// # 引数
    /// * `project_id` - スナップショットを作成するプロジェクトのID
    ///
    /// # 戻り値
    /// プロジェクトドキュメントのクローン。プロジェクトが存在しない場合はエラー。
    pub async fn create_snapshot(
        &self,
        project_id: &ProjectId,
    ) -> Result<ProjectDocument, RepositoryError> {
        let document = self
            .get_project_document(project_id)
            .await?
            .ok_or_else(|| {
                RepositoryError::NotFound(format!("Project not found: {}", project_id))
            })?;
        Ok(document.clone())
    }

    /// スナップショットから復元
    ///
    /// トランザクション失敗時に、保存されたスナップショットからドキュメントを復元します。
    ///
    /// # 引数
    /// * `project_id` - 復元するプロジェクトのID
    /// * `snapshot` - 復元元のプロジェクトドキュメント
    pub async fn restore_from_snapshot(
        &self,
        project_id: &ProjectId,
        snapshot: &ProjectDocument,
    ) -> Result<(), RepositoryError> {
        self.save_project_document(project_id, snapshot).await
    }

    // ========== クエリフィルタ（Phase 3） ==========

    /// 削除済みプロジェクトを取得
    ///
    /// # 引数
    /// * `project_id` - プロジェクトのID
    ///
    /// # 戻り値
    /// 削除済み（deleted=true）のプロジェクト、またはNone
    pub async fn get_deleted_project(
        &self,
        project_id: &ProjectId,
    ) -> Result<Option<Project>, RepositoryError> {
        if let Some(project) = self.get_project(&project_id.to_string()).await? {
            if project.is_deleted() {
                Ok(Some(project))
            } else {
                Ok(None)
            }
        } else {
            Ok(None)
        }
    }

    /// アクティブなタスクのみ取得（deleted=falseのみ）
    pub async fn get_active_tasks(
        &self,
        project_id: &ProjectId,
    ) -> Result<Vec<Task>, RepositoryError> {
        let document = self
            .get_project_document(project_id)
            .await?
            .ok_or_else(|| {
                RepositoryError::NotFound(format!("Project not found: {}", project_id))
            })?;
        Ok(document
            .tasks
            .into_iter()
            .filter(|t| !t.is_deleted())
            .collect())
    }

    /// 削除済みタスクのみ取得（deleted=trueのみ）
    pub async fn get_deleted_tasks(
        &self,
        project_id: &ProjectId,
    ) -> Result<Vec<Task>, RepositoryError> {
        let document = self
            .get_project_document(project_id)
            .await?
            .ok_or_else(|| {
                RepositoryError::NotFound(format!("Project not found: {}", project_id))
            })?;
        Ok(document
            .tasks
            .into_iter()
            .filter(|t| t.is_deleted())
            .collect())
    }

    /// アクティブなタグのみ取得（deleted=falseのみ）
    pub async fn get_active_tags(
        &self,
        project_id: &ProjectId,
    ) -> Result<Vec<Tag>, RepositoryError> {
        let document = self
            .get_project_document(project_id)
            .await?
            .ok_or_else(|| {
                RepositoryError::NotFound(format!("Project not found: {}", project_id))
            })?;
        Ok(document
            .tags
            .into_iter()
            .filter(|t| !t.is_deleted())
            .collect())
    }

    /// 削除済みタグのみ取得（deleted=trueのみ）
    pub async fn get_deleted_tags(
        &self,
        project_id: &ProjectId,
    ) -> Result<Vec<Tag>, RepositoryError> {
        let document = self
            .get_project_document(project_id)
            .await?
            .ok_or_else(|| {
                RepositoryError::NotFound(format!("Project not found: {}", project_id))
            })?;
        Ok(document
            .tags
            .into_iter()
            .filter(|t| t.is_deleted())
            .collect())
    }

    /// アクティブなタスクリストのみ取得（deleted=falseのみ）
    pub async fn get_active_task_lists(
        &self,
        project_id: &ProjectId,
    ) -> Result<Vec<TaskList>, RepositoryError> {
        let document = self
            .get_project_document(project_id)
            .await?
            .ok_or_else(|| {
                RepositoryError::NotFound(format!("Project not found: {}", project_id))
            })?;
        Ok(document
            .task_lists
            .into_iter()
            .filter(|tl| !tl.is_deleted())
            .collect())
    }

    /// 削除済みタスクリストのみ取得（deleted=trueのみ）
    pub async fn get_deleted_task_lists(
        &self,
        project_id: &ProjectId,
    ) -> Result<Vec<TaskList>, RepositoryError> {
        let document = self
            .get_project_document(project_id)
            .await?
            .ok_or_else(|| {
                RepositoryError::NotFound(format!("Project not found: {}", project_id))
            })?;
        Ok(document
            .task_lists
            .into_iter()
            .filter(|tl| tl.is_deleted())
            .collect())
    }

    /// プロジェクトを復元（deleted=falseに設定）
    pub async fn restore_project(
        &self,
        project_id: &ProjectId,
        user_id: &UserId,
        timestamp: &DateTime<Utc>,
    ) -> Result<(), RepositoryError> {
        if let Some(mut project) = self.get_project(&project_id.to_string()).await? {
            if !project.is_deleted() {
                return Err(RepositoryError::InvalidOperation(format!(
                    "Project is not deleted: {}",
                    project_id
                )));
            }

            // Trackableトレイトを使用して復元
            project.mark_restored(*user_id, *timestamp);
            self.set_project(&project).await
        } else {
            Err(RepositoryError::NotFound(format!(
                "Project not found: {}",
                project_id
            )))
        }
    }

    /// プロジェクト内のすべてのタスクを復元
    pub async fn restore_all_tasks(
        &self,
        project_id: &ProjectId,
        user_id: &UserId,
        timestamp: &DateTime<Utc>,
    ) -> Result<(), RepositoryError> {
        let mut document = self
            .get_project_document(project_id)
            .await?
            .ok_or_else(|| {
                RepositoryError::NotFound(format!("Project not found: {}", project_id))
            })?;

        for task in &mut document.tasks {
            if task.is_deleted() {
                task.mark_restored(*user_id, *timestamp);
            }
        }

        self.save_project_document(project_id, &document).await
    }

    /// プロジェクト内のすべてのタグを復元
    pub async fn restore_all_tags(
        &self,
        project_id: &ProjectId,
        user_id: &UserId,
        timestamp: &DateTime<Utc>,
    ) -> Result<(), RepositoryError> {
        let mut document = self
            .get_project_document(project_id)
            .await?
            .ok_or_else(|| {
                RepositoryError::NotFound(format!("Project not found: {}", project_id))
            })?;

        for tag in &mut document.tags {
            if tag.is_deleted() {
                tag.mark_restored(*user_id, *timestamp);
            }
        }

        self.save_project_document(project_id, &document).await
    }

    /// プロジェクト内のすべてのタスクリストを復元
    pub async fn restore_all_task_lists(
        &self,
        project_id: &ProjectId,
        user_id: &UserId,
        timestamp: &DateTime<Utc>,
    ) -> Result<(), RepositoryError> {
        let mut document = self
            .get_project_document(project_id)
            .await?
            .ok_or_else(|| {
                RepositoryError::NotFound(format!("Project not found: {}", project_id))
            })?;

        for task_list in &mut document.task_lists {
            if task_list.is_deleted() {
                task_list.mark_restored(*user_id, *timestamp);
            }
        }

        self.save_project_document(project_id, &document).await
    }

    /// 個別タスクの論理削除
    pub async fn mark_task_deleted(
        &self,
        project_id: &ProjectId,
        task_id: &TaskId,
        user_id: &UserId,
        timestamp: &DateTime<Utc>,
    ) -> Result<(), RepositoryError> {
        let mut document = self
            .get_project_document(project_id)
            .await?
            .ok_or_else(|| {
                RepositoryError::NotFound(format!("Project not found: {}", project_id))
            })?;

        let task = document.tasks.iter_mut().find(|t| t.id == *task_id).ok_or_else(|| {
            RepositoryError::NotFound(format!("Task not found: {}", task_id))
        })?;
        task.mark_deleted(*user_id, *timestamp);

        self.save_project_document(project_id, &document).await
    }

    /// 個別タグの論理削除
    pub async fn mark_tag_deleted(
        &self,
        project_id: &ProjectId,
        tag_id: &TagId,
        user_id: &UserId,
        timestamp: &DateTime<Utc>,
    ) -> Result<(), RepositoryError> {
        let mut document = self
            .get_project_document(project_id)
            .await?
            .ok_or_else(|| {
                RepositoryError::NotFound(format!("Project not found: {}", project_id))
            })?;

        let tag = document.tags.iter_mut().find(|t| t.id == *tag_id).ok_or_else(|| {
            RepositoryError::NotFound(format!("Tag not found: {}", tag_id))
        })?;
        tag.mark_deleted(*user_id, *timestamp);

        self.save_project_document(project_id, &document).await
    }

    /// 個別タスクリストの論理削除
    pub async fn mark_task_list_deleted(
        &self,
        project_id: &ProjectId,
        task_list_id: &TaskListId,
        user_id: &UserId,
        timestamp: &DateTime<Utc>,
    ) -> Result<(), RepositoryError> {
        let mut document = self
            .get_project_document(project_id)
            .await?
            .ok_or_else(|| {
                RepositoryError::NotFound(format!("Project not found: {}", project_id))
            })?;

        let task_list = document
            .task_lists
            .iter_mut()
            .find(|tl| tl.id == *task_list_id)
            .ok_or_else(|| {
                RepositoryError::NotFound(format!("TaskList not found: {}", task_list_id))
            })?;
        task_list.mark_deleted(*user_id, *timestamp);

        self.save_project_document(project_id, &document).await
    }

    /// 個別タスクの復元
    pub async fn restore_task(
        &self,
        project_id: &ProjectId,
        task_id: &TaskId,
        user_id: &UserId,
        timestamp: &DateTime<Utc>,
    ) -> Result<(), RepositoryError> {
        let mut document = self
            .get_project_document(project_id)
            .await?
            .ok_or_else(|| {
                RepositoryError::NotFound(format!("Project not found: {}", project_id))
            })?;

        let task = document.tasks.iter_mut().find(|t| t.id == *task_id).ok_or_else(|| {
            RepositoryError::NotFound(format!("Task not found: {}", task_id))
        })?;
        if !task.is_deleted() {
            return Err(RepositoryError::InvalidOperation(format!(
                "Task is not deleted: {}",
                task_id
            )));
        }
        task.mark_restored(*user_id, *timestamp);

        self.save_project_document(project_id, &document).await
    }

    /// 個別タグの復元
    pub async fn restore_tag(
        &self,
        project_id: &ProjectId,
        tag_id: &TagId,
        user_id: &UserId,
        timestamp: &DateTime<Utc>,
    ) -> Result<(), RepositoryError> {
        let mut document = self
            .get_project_document(project_id)
            .await?
            .ok_or_else(|| {
                RepositoryError::NotFound(format!("Project not found: {}", project_id))
            })?;

        let tag = document.tags.iter_mut().find(|t| t.id == *tag_id).ok_or_else(|| {
            RepositoryError::NotFound(format!("Tag not found: {}", tag_id))
        })?;
        if !tag.is_deleted() {
            return Err(RepositoryError::InvalidOperation(format!(
                "Tag is not deleted: {}",
                tag_id
            )));
        }
        tag.mark_restored(*user_id, *timestamp);

        self.save_project_document(project_id, &document).await
    }

    /// 個別タスクリストの復元
    pub async fn restore_task_list(
        &self,
        project_id: &ProjectId,
        task_list_id: &TaskListId,
        user_id: &UserId,
        timestamp: &DateTime<Utc>,
    ) -> Result<(), RepositoryError> {
        let mut document = self
            .get_project_document(project_id)
            .await?
            .ok_or_else(|| {
                RepositoryError::NotFound(format!("Project not found: {}", project_id))
            })?;

        let task_list = document
            .task_lists
            .iter_mut()
            .find(|tl| tl.id == *task_list_id)
            .ok_or_else(|| {
                RepositoryError::NotFound(format!("TaskList not found: {}", task_list_id))
            })?;
        if !task_list.is_deleted() {
            return Err(RepositoryError::InvalidOperation(format!(
                "TaskList is not deleted: {}",
                task_list_id
            )));
        }
        task_list.mark_restored(*user_id, *timestamp);

        self.save_project_document(project_id, &document).await
    }

    /// 削除済み個別タスクの取得
    pub async fn get_deleted_task_by_id(
        &self,
        project_id: &ProjectId,
        task_id: &TaskId,
    ) -> Result<Option<Task>, RepositoryError> {
        let document = match self.get_project_document(project_id).await? {
            Some(doc) => doc,
            None => return Ok(None),
        };

        Ok(document.tasks.into_iter().find(|t| t.id == *task_id && t.is_deleted()))
    }

    /// 削除済み個別タグの取得
    pub async fn get_deleted_tag_by_id(
        &self,
        project_id: &ProjectId,
        tag_id: &TagId,
    ) -> Result<Option<Tag>, RepositoryError> {
        let document = match self.get_project_document(project_id).await? {
            Some(doc) => doc,
            None => return Ok(None),
        };

        Ok(document.tags.into_iter().find(|t| t.id == *tag_id && t.is_deleted()))
    }

    /// 削除済み個別タスクリストの取得
    pub async fn get_deleted_task_list_by_id(
        &self,
        project_id: &ProjectId,
        task_list_id: &TaskListId,
    ) -> Result<Option<TaskList>, RepositoryError> {
        let document = match self.get_project_document(project_id).await? {
            Some(doc) => doc,
            None => return Ok(None),
        };

        Ok(document
            .task_lists
            .into_iter()
            .find(|tl| tl.id == *task_list_id && tl.is_deleted()))
    }
}

#[async_trait]
impl Repository<Project, ProjectId> for ProjectLocalAutomergeRepository {
    async fn save(&self, entity: &Project, user_id: &UserId, timestamp: &DateTime<Utc>) -> Result<(), RepositoryError> {
        tracing::info!(
            "ProjectLocalAutomergeRepository::save - 開始: {:?}",
            entity.id
        );

        // updated_by と updated_at を更新
        let mut updated_entity = entity.clone();
        updated_entity.updated_by = *user_id;
        updated_entity.updated_at = *timestamp;

        let result = self.set_project(&updated_entity).await;
        if result.is_ok() {
            tracing::info!(
                "ProjectLocalAutomergeRepository::save - 完了: {:?}",
                entity.id
            );
        } else {
            tracing::error!(
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
