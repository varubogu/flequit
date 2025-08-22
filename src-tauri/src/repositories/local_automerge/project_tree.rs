//! プロジェクト統合ツリー構造のAutomergeリポジトリ
//!
//! プロジェクトごとに1つのAutomergeドキュメントファイルで、
//! プロジェクト～サブタスク＋タスクタグ＋サブタスクタグまでを含んだ
//! 1つのオブジェクトツリー構造として保存・管理する。

use super::document_manager::{DocumentManager, DocumentType};
use crate::errors::RepositoryError;
use crate::models::{
    project::ProjectTree,
    task::{Task, TaskTree},
    task_list::{TaskList, TaskListTree},
};
use crate::types::id_types::{ProjectId, TaskId, TaskListId};
use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::Mutex;

/// プロジェクト統合ツリー構造用のAutomergeリポジトリ
///
/// プロジェクトごとに1つのAutomergeドキュメントを作成し、
/// プロジェクト配下のすべてのデータ（TaskList、Task、SubTask、Tag）を
/// 統合されたツリー構造として管理する。
///
/// # データ構造
/// ```json
/// {
///   "project": {
///     "id": "project_id",
///     "name": "Project Name",
///     "task_lists": [
///       {
///         "id": "list_id",
///         "name": "List Name",
///         "tasks": [
///           {
///             "id": "task_id",
///             "title": "Task Title",
///             "sub_tasks": [...],
///             "tags": [...]
///           }
///         ]
///       }
///     ],
///     "tags": [...]
///   }
/// }
/// ```
#[derive(Debug, Clone)]
pub struct ProjectTreeLocalAutomergeRepository {
    document_manager: Arc<Mutex<DocumentManager>>,
}

impl ProjectTreeLocalAutomergeRepository {
    /// 新しいProjectTreeRepositoryを作成
    pub fn new(base_path: PathBuf) -> Result<Self, RepositoryError> {
        let document_manager = DocumentManager::new(base_path)?;
        Ok(Self {
            document_manager: Arc::new(Mutex::new(document_manager)),
        })
    }

    /// プロジェクトツリー全体を取得
    pub async fn get_project_tree(
        &self,
        project_id: &ProjectId,
    ) -> Result<Option<ProjectTree>, RepositoryError> {
        let mut manager = self.document_manager.lock().await;
        let doc_type = DocumentType::Project(project_id.to_string());

        // load_dataメソッドを使用してデータを取得
        let project_tree: Option<ProjectTree> = manager.load_data(&doc_type, "project").await?;
        Ok(project_tree)
    }

    /// プロジェクトツリー全体を保存
    pub async fn save_project_tree(
        &self,
        project_tree: &ProjectTree,
    ) -> Result<(), RepositoryError> {
        let mut manager = self.document_manager.lock().await;
        let doc_type = DocumentType::Project(project_tree.id.to_string());

        // save_dataメソッドを使用してデータを保存
        manager
            .save_data(&doc_type, "project", project_tree)
            .await?;
        Ok(())
    }

    /// タスクを追加（プロジェクトツリー内で）
    pub async fn add_task_to_list(
        &self,
        project_id: &ProjectId,
        list_id: &TaskListId,
        task: &Task,
    ) -> Result<(), RepositoryError> {
        // ProjectTreeが存在することを確認
        self.ensure_project_tree_exists(project_id).await?;
        
        if let Some(mut project_tree) = self.get_project_tree(project_id).await? {
            // TaskからTaskTreeに変換（空のサブタスクとタグで）
            let task_tree = TaskTree {
                id: task.id.clone(),
                sub_task_id: task.sub_task_id.clone(),
                project_id: task.project_id.clone(),
                list_id: task.list_id.clone(),
                title: task.title.clone(),
                description: task.description.clone(),
                status: task.status.clone(),
                priority: task.priority,
                start_date: task.start_date,
                end_date: task.end_date,
                is_range_date: task.is_range_date,
                recurrence_rule: task.recurrence_rule.clone(),
                assigned_user_ids: task.assigned_user_ids.clone(),
                order_index: task.order_index,
                is_archived: task.is_archived,
                created_at: task.created_at,
                updated_at: task.updated_at,
                sub_tasks: vec![], // 空のサブタスクリスト
                tags: vec![], // 空のタグリスト（tag_idsから実際のタグを取得する必要があるが、今は簡略化）
            };

            // 指定されたタスクリストを見つけてタスクを追加
            for task_list in &mut project_tree.task_lists {
                if &task_list.id == list_id {
                    task_list.tasks.push(task_tree);
                    self.save_project_tree(&project_tree).await?;
                    return Ok(());
                }
            }
            
            // タスクリストが見つからない場合は、空のタスクリストを作成してからタスクを追加
            log::warn!("TaskList {} not found in ProjectTree, creating empty task list", list_id);
            let empty_task_list = TaskListTree {
                id: *list_id,
                project_id: *project_id,
                name: format!("TaskList {}", list_id), // 仮の名前
                description: None,
                color: None,
                order_index: 0,
                is_archived: false,
                created_at: chrono::Utc::now(),
                updated_at: chrono::Utc::now(),
                tasks: vec![task_tree], // 追加するタスクを含む
            };
            project_tree.task_lists.push(empty_task_list);
            self.save_project_tree(&project_tree).await?;
            Ok(())
        } else {
            Err(RepositoryError::NotFound(format!(
                "Project {} not found",
                project_id
            )))
        }
    }

    /// タスクを更新（プロジェクトツリー内で）
    pub async fn update_task(
        &self,
        project_id: &ProjectId,
        task_id: &TaskId,
        task: &Task,
    ) -> Result<(), RepositoryError> {
        // ProjectTreeが存在しない場合はProject not foundエラーになるので、
        // まずProjectTreeを確実に初期化する
        self.ensure_project_tree_exists(project_id).await?;

        // 既存の全体ロード方式を使用（後で局所更新に変更予定）
        if let Some(mut project_tree) = self.get_project_tree(project_id).await? {
            // 指定されたタスクを見つけて更新
            for task_list in &mut project_tree.task_lists {
                for existing_task in &mut task_list.tasks {
                    if &existing_task.id == task_id {
                        // 既存のサブタスクとタグを保持してTaskを更新
                        let task_tree = TaskTree {
                            id: task.id.clone(),
                            sub_task_id: task.sub_task_id.clone(),
                            project_id: task.project_id.clone(),
                            list_id: task.list_id.clone(),
                            title: task.title.clone(),
                            description: task.description.clone(),
                            status: task.status.clone(),
                            priority: task.priority,
                            start_date: task.start_date,
                            end_date: task.end_date,
                            is_range_date: task.is_range_date,
                            recurrence_rule: task.recurrence_rule.clone(),
                            assigned_user_ids: task.assigned_user_ids.clone(),
                            order_index: task.order_index,
                            is_archived: task.is_archived,
                            created_at: task.created_at,
                            updated_at: task.updated_at,
                            sub_tasks: existing_task.sub_tasks.clone(), // 既存のサブタスクを保持
                            tags: existing_task.tags.clone(),           // 既存のタグを保持
                        };
                        *existing_task = task_tree;
                        self.save_project_tree(&project_tree).await?;
                        return Ok(());
                    }
                }
            }
            Err(RepositoryError::NotFound(format!(
                "Task {} not found in project {}",
                task_id, project_id
            )))
        } else {
            Err(RepositoryError::NotFound(format!(
                "Project {} not found",
                project_id
            )))
        }
    }

    /// タスクを削除（プロジェクトツリー内で）
    pub async fn delete_task(
        &self,
        project_id: &ProjectId,
        task_id: &TaskId,
    ) -> Result<(), RepositoryError> {
        if let Some(mut project_tree) = self.get_project_tree(project_id).await? {
            // 指定されたタスクを見つけて削除
            for task_list in &mut project_tree.task_lists {
                task_list.tasks.retain(|task| &task.id != task_id);
            }
            self.save_project_tree(&project_tree).await?;
            Ok(())
        } else {
            Err(RepositoryError::NotFound(format!(
                "Project {} not found",
                project_id
            )))
        }
    }

    /// プロジェクト内のすべてのタスクを取得
    pub async fn get_tasks_by_project(
        &self,
        project_id: &ProjectId,
    ) -> Result<Vec<Task>, RepositoryError> {
        if let Some(project_tree) = self.get_project_tree(project_id).await? {
            let mut tasks = Vec::new();
            for task_list in &project_tree.task_lists {
                for task_tree in &task_list.tasks {
                    // TaskTreeからTaskに変換（FromTreeModelトレイトを使用）
                    use crate::models::FromTreeModel;
                    let task = task_tree
                        .from_tree_model()
                        .await
                        .map_err(|e| RepositoryError::ConversionError(e))?;
                    tasks.push(task);
                }
            }
            Ok(tasks)
        } else {
            Ok(vec![])
        }
    }

    /// プロジェクト内の指定されたタスクリストのタスクを取得
    pub async fn get_tasks_by_list(
        &self,
        project_id: &ProjectId,
        list_id: &TaskListId,
    ) -> Result<Vec<Task>, RepositoryError> {
        if let Some(project_tree) = self.get_project_tree(project_id).await? {
            for task_list in &project_tree.task_lists {
                if &task_list.id == list_id {
                    let mut tasks = Vec::new();
                    for task_tree in &task_list.tasks {
                        // TaskTreeからTaskに変換（FromTreeModelトレイトを使用）
                        use crate::models::FromTreeModel;
                        let task = task_tree
                            .from_tree_model()
                            .await
                            .map_err(|e| RepositoryError::ConversionError(e))?;
                        tasks.push(task);
                    }
                    return Ok(tasks);
                }
            }
            Ok(vec![])
        } else {
            Ok(vec![])
        }
    }

    /// タスクリストを追加
    pub async fn add_task_list(
        &self,
        project_id: &ProjectId,
        task_list: &TaskList,
    ) -> Result<(), RepositoryError> {
        // ProjectTreeが存在することを確認
        self.ensure_project_tree_exists(project_id).await?;
        
        if let Some(mut project_tree) = self.get_project_tree(project_id).await? {
            // TaskListからTaskListTreeに変換（空のタスクリストで）
            let task_list_tree = TaskListTree {
                id: task_list.id.clone(),
                project_id: task_list.project_id.clone(),
                name: task_list.name.clone(),
                description: task_list.description.clone(),
                color: task_list.color.clone(),
                order_index: task_list.order_index,
                is_archived: task_list.is_archived,
                created_at: task_list.created_at,
                updated_at: task_list.updated_at,
                tasks: vec![], // 空のタスクリスト
            };
            project_tree.task_lists.push(task_list_tree);
            self.save_project_tree(&project_tree).await?;
            Ok(())
        } else {
            Err(RepositoryError::NotFound(format!(
                "Project {} not found",
                project_id
            )))
        }
    }

    /// タスクリストを更新
    pub async fn update_task_list(
        &self,
        project_id: &ProjectId,
        list_id: &TaskListId,
        task_list: &TaskList,
    ) -> Result<(), RepositoryError> {
        if let Some(mut project_tree) = self.get_project_tree(project_id).await? {
            for existing_list in &mut project_tree.task_lists {
                if &existing_list.id == list_id {
                    // 既存のタスクを保持してタスクリストを更新
                    let task_list_tree = TaskListTree {
                        id: task_list.id.clone(),
                        project_id: task_list.project_id.clone(),
                        name: task_list.name.clone(),
                        description: task_list.description.clone(),
                        color: task_list.color.clone(),
                        order_index: task_list.order_index,
                        is_archived: task_list.is_archived,
                        created_at: task_list.created_at,
                        updated_at: task_list.updated_at,
                        tasks: existing_list.tasks.clone(), // 既存のタスクを保持
                    };
                    *existing_list = task_list_tree;
                    self.save_project_tree(&project_tree).await?;
                    return Ok(());
                }
            }
            Err(RepositoryError::NotFound(format!(
                "TaskList {} not found in project {}",
                list_id, project_id
            )))
        } else {
            Err(RepositoryError::NotFound(format!(
                "Project {} not found",
                project_id
            )))
        }
    }

    /// タスクリストを削除
    pub async fn delete_task_list(
        &self,
        project_id: &ProjectId,
        list_id: &TaskListId,
    ) -> Result<(), RepositoryError> {
        if let Some(mut project_tree) = self.get_project_tree(project_id).await? {
            project_tree.task_lists.retain(|list| &list.id != list_id);
            self.save_project_tree(&project_tree).await?;
            Ok(())
        } else {
            Err(RepositoryError::NotFound(format!(
                "Project {} not found",
                project_id
            )))
        }
    }

    /// ProjectTreeが存在することを確認し、存在しない場合は作成
    async fn ensure_project_tree_exists(&self, project_id: &ProjectId) -> Result<(), RepositoryError> {
        // ProjectTreeが存在するかチェック
        if self.get_project_tree(project_id).await?.is_none() {
            // 存在しない場合、Project情報を取得して空のProjectTreeを作成
            // 注意：この方法ではProjectの基本情報が必要だが、今回は簡略化
            // 実際にはProject repositoryから情報を取得すべき
            let empty_project_tree = ProjectTree {
                id: *project_id,
                name: format!("Project {}", project_id), // 仮の名前
                description: None,
                color: None,
                order_index: 0,
                is_archived: false,
                status: None,
                owner_id: None,
                created_at: chrono::Utc::now(),
                updated_at: chrono::Utc::now(),
                task_lists: Vec::new(), // 空のタスクリスト
            };
            
            self.save_project_tree(&empty_project_tree).await?;
        }
        Ok(())
    }
}
