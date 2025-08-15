use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::Mutex;
use crate::errors::RepositoryError;
use crate::models::{
    project::{Project},
    task_list::TaskList,
    task::Task,
    subtask::Subtask,
    tag::Tag,
};
use crate::repositories::{TaskRepositoryTrait, SubTaskRepositoryTrait, TagRepositoryTrait};
use crate::types::task_types::TaskStatus;
use super::document_manager::{DocumentManager, DocumentType};
use crate::services::path_service::PathService;
use async_trait::async_trait;

/// Projects用のAutomerge-Repoリポジトリ
/// プロジェクトごとに独立したドキュメントファイルを管理します
pub struct ProjectsRepository {
    document_manager: Arc<Mutex<DocumentManager>>,
}

impl ProjectsRepository {
    /// 新しいProjectsRepositoryを作成
    pub fn new(base_path: PathBuf) -> Result<Self, RepositoryError> {
        let document_manager = DocumentManager::new(base_path)?;
        Ok(Self {
            document_manager: Arc::new(Mutex::new(document_manager)),
        })
    }

    /// デフォルトパスでProjectsRepositoryを作成
    pub fn with_default_path() -> Result<Self, RepositoryError> {
        let data_dir = PathService::get_default_data_dir()
            .unwrap_or_else(|_| PathBuf::from("./flequit"));
        Self::new(data_dir)
    }

    /// プロジェクト情報を保存
    pub async fn set_project(&self, project: &Project) -> Result<(), RepositoryError> {
        // プロジェクト毎に個別のドキュメントを作成
        let doc_type = DocumentType::Project(project.id.to_string());
        let project_clone = project.clone();
        {
            let mut manager = self.document_manager.lock().await;
            manager.save_data(&doc_type, "project", &project_clone).await
        }
    }

    /// プロジェクト情報を取得
    pub async fn get_project(&self, project_id: &str) -> Result<Option<Project>, RepositoryError> {
        let doc_type = DocumentType::Project(project_id.to_string());
        {
            let mut manager = self.document_manager.lock().await;
            manager.load_data::<Project>(&doc_type, "project").await
        }
    }

    /// タスクリストを保存
    pub async fn set_task_list(&self, project_id: &str, task_list: &TaskList) -> Result<(), RepositoryError> {
        // タスクリストをプロジェクトドキュメントに保存
        let key = format!("task_list_{}", task_list.id);
        let doc_type = DocumentType::Project(project_id.to_string());
        let task_list_clone = task_list.clone();
        {
            let mut manager = self.document_manager.lock().await;
            manager.save_data(&doc_type, &key, &task_list_clone).await
        }
    }

    /// タスクリストを取得
    pub async fn get_task_list(&self, project_id: &str, list_id: &str) -> Result<Option<TaskList>, RepositoryError> {
        let key = format!("task_list_{}", list_id);
        let doc_type = DocumentType::Project(project_id.to_string());
        {
            let mut manager = self.document_manager.lock().await;
            manager.load_data::<TaskList>(&doc_type, &key).await
        }
    }

    /// タスクを保存
    pub async fn set_task(&self, project_id: &str, task: &Task) -> Result<(), RepositoryError> {
        let key = format!("task_{}", task.id);
        let doc_type = DocumentType::Project(project_id.to_string());
        let task_clone = task.clone();
        {
            let mut manager = self.document_manager.lock().await;
            manager.save_data(&doc_type, &key, &task_clone).await
        }
    }

    /// タスクを取得
    pub async fn get_task(&self, project_id: &str, task_id: &str) -> Result<Option<Task>, RepositoryError> {
        let key = format!("task_{}", task_id);
        let doc_type = DocumentType::Project(project_id.to_string());
        {
            let mut manager = self.document_manager.lock().await;
            manager.load_data::<Task>(&doc_type, &key).await
        }
    }

    /// サブタスクを保存
    pub async fn set_subtask(&self, project_id: &str, subtask: &Subtask) -> Result<(), RepositoryError> {
        let key = format!("subtask_{}", subtask.id);
        let doc_type = DocumentType::Project(project_id.to_string());
        let subtask_clone = subtask.clone();
        {
            let mut manager = self.document_manager.lock().await;
            manager.save_data(&doc_type, &key, &subtask_clone).await
        }
    }

    /// サブタスクを取得
    pub async fn get_subtask(&self, project_id: &str, subtask_id: &str) -> Result<Option<Subtask>, RepositoryError> {
        let key = format!("subtask_{}", subtask_id);
        let doc_type = DocumentType::Project(project_id.to_string());
        {
            let mut manager = self.document_manager.lock().await;
            manager.load_data::<Subtask>(&doc_type, &key).await
        }
    }

    /// タグを保存（グローバルタグ用に特別なドキュメントを使用）
    pub async fn set_tag(&self, tag: &Tag) -> Result<(), RepositoryError> {
        let key = format!("tag_{}", tag.id);
        // タグはグローバルなため、特別なTagドキュメントタイプが必要
        // 今回は簡略化してSettingsドキュメントを流用
        let tag_clone = tag.clone();
        {
            let mut manager = self.document_manager.lock().await;
            manager.save_data(&DocumentType::Settings, &key, &tag_clone).await
        }
    }

    /// タグを取得
    pub async fn get_tag(&self, tag_id: &str) -> Result<Option<Tag>, RepositoryError> {
        let key = format!("tag_{}", tag_id);
        {
            let mut manager = self.document_manager.lock().await;
            manager.load_data::<Tag>(&DocumentType::Settings, &key).await
        }
    }

    /// プロジェクトドキュメントを削除
    pub async fn delete_project(&self, project_id: &str) -> Result<(), RepositoryError> {
        {
            let mut manager = self.document_manager.lock().await;
            manager.delete_document(DocumentType::Project(project_id.to_string()))
        }
    }

    /// プロジェクトのバックアップを作成
    pub fn backup_project(&self, _project_id: &str, _backup_path: &str) -> Result<(), RepositoryError> {
        // TODO: プロジェクトドキュメントファイルをバックアップパスにコピー
        Ok(())
    }

    /// バックアップからプロジェクトを復元
    pub async fn restore_project(&mut self, _backup_path: &str) -> Result<String, RepositoryError> {
        // TODO: バックアップファイルからプロジェクトドキュメントを復元
        Ok("restored_project_id".to_string())
    }
}

// ProjectRepositoryTrait実装は project_repository_impl.rs に移行しました

#[async_trait]
impl TaskRepositoryTrait for ProjectsRepository {
    async fn set_task(&self, project_id: &str, task: &Task) -> Result<(), RepositoryError> {
        self.set_task(project_id, task).await
    }

    async fn get_task(&self, project_id: &str, task_id: &str) -> Result<Option<Task>, RepositoryError> {
        self.get_task(project_id, task_id).await
    }

    async fn list_tasks(&self, _project_id: &str) -> Result<Vec<Task>, RepositoryError> {
        // TODO: タスク一覧取得実装
        Ok(Vec::new())
    }

    async fn delete_task(&self, _project_id: &str, _task_id: &str) -> Result<(), RepositoryError> {
        // TODO: タスク削除実装
        Ok(())
    }

    async fn find_tasks_by_assignee(&self, _project_id: &str, _assignee_id: &str) -> Result<Vec<Task>, RepositoryError> {
        // TODO: 担当者によるタスク検索実装
        Ok(Vec::new())
    }

    async fn find_tasks_by_status(&self, _project_id: &str, _status: TaskStatus) -> Result<Vec<Task>, RepositoryError> {
        // TODO: ステータスによるタスク検索実装
        Ok(Vec::new())
    }

    async fn find_tasks_by_priority(&self, _project_id: &str, _priority: i32) -> Result<Vec<Task>, RepositoryError> {
        // TODO: 優先度によるタスク検索実装
        Ok(Vec::new())
    }

    async fn find_tasks_by_tag(&self, _project_id: &str, _tag_id: &str) -> Result<Vec<Task>, RepositoryError> {
        // TODO: タグによるタスク検索実装
        Ok(Vec::new())
    }

    async fn find_overdue_tasks(&self, _project_id: &str, _current_time: i64) -> Result<Vec<Task>, RepositoryError> {
        // TODO: 期限切れタスク検索実装
        Ok(Vec::new())
    }

    async fn update_task_status(&self, _project_id: &str, _task_id: &str, _status: TaskStatus) -> Result<(), RepositoryError> {
        // TODO: タスクステータス更新実装
        Ok(())
    }

    async fn update_task_priority(&self, _project_id: &str, _task_id: &str, _priority: i32) -> Result<(), RepositoryError> {
        // TODO: タスク優先度更新実装
        Ok(())
    }

    async fn assign_task(&self, _project_id: &str, _task_id: &str, _assignee_id: Option<String>) -> Result<(), RepositoryError> {
        // TODO: タスクアサイン実装
        Ok(())
    }

    async fn add_tag_to_task(&self, _project_id: &str, _task_id: &str, _tag_id: &str) -> Result<(), RepositoryError> {
        // TODO: タスクへのタグ追加実装
        Ok(())
    }

    async fn remove_tag_from_task(&self, _project_id: &str, _task_id: &str, _tag_id: &str) -> Result<(), RepositoryError> {
        // TODO: タスクからのタグ削除実装
        Ok(())
    }

    async fn validate_task_exists(&self, project_id: &str, task_id: &str) -> Result<bool, RepositoryError> {
        Ok(self.get_task(project_id, task_id).await?.is_some())
    }

    async fn validate_project_exists(&self, project_id: &str) -> Result<bool, RepositoryError> {
        Ok(self.get_project(project_id).await?.is_some())
    }

    async fn get_task_count(&self, _project_id: &str) -> Result<u64, RepositoryError> {
        // TODO: タスク数カウント実装
        Ok(0)
    }

    async fn get_task_count_by_status(&self, _project_id: &str, _status: TaskStatus) -> Result<u64, RepositoryError> {
        // TODO: ステータス別タスク数カウント実装
        Ok(0)
    }

    async fn get_completion_rate(&self, _project_id: &str) -> Result<f32, RepositoryError> {
        // TODO: 完了率計算実装
        Ok(0.0)
    }
}

#[async_trait]
impl SubTaskRepositoryTrait for ProjectsRepository {
    async fn set_subtask(&self, project_id: &str, _task_id: &str, subtask: &Subtask) -> Result<(), RepositoryError> {
        self.set_subtask(project_id, subtask).await
    }

    async fn get_subtask(&self, project_id: &str, _task_id: &str, subtask_id: &str) -> Result<Option<Subtask>, RepositoryError> {
        self.get_subtask(project_id, subtask_id).await
    }

    async fn list_subtasks(&self, _project_id: &str, _task_id: &str) -> Result<Vec<Subtask>, RepositoryError> {
        // TODO: サブタスク一覧取得実装
        Ok(Vec::new())
    }

    async fn delete_subtask(&self, _project_id: &str, _task_id: &str, _subtask_id: &str) -> Result<(), RepositoryError> {
        // TODO: サブタスク削除実装
        Ok(())
    }

    async fn find_completed_subtasks(&self, _project_id: &str, _task_id: &str) -> Result<Vec<Subtask>, RepositoryError> {
        // TODO: 完了済みサブタスク検索実装
        Ok(Vec::new())
    }

    async fn find_incomplete_subtasks(&self, _project_id: &str, _task_id: &str) -> Result<Vec<Subtask>, RepositoryError> {
        // TODO: 未完了サブタスク検索実装
        Ok(Vec::new())
    }

    async fn find_subtasks_by_project(&self, _project_id: &str) -> Result<Vec<Subtask>, RepositoryError> {
        // TODO: プロジェクト内サブタスク検索実装
        Ok(Vec::new())
    }

    async fn toggle_completion(&self, _project_id: &str, _task_id: &str, _subtask_id: &str) -> Result<(), RepositoryError> {
        // TODO: サブタスク完了切り替え実装
        Ok(())
    }

    async fn mark_completed(&self, _project_id: &str, _task_id: &str, _subtask_id: &str) -> Result<(), RepositoryError> {
        // TODO: サブタスク完了マーク実装
        Ok(())
    }

    async fn mark_incomplete(&self, _project_id: &str, _task_id: &str, _subtask_id: &str) -> Result<(), RepositoryError> {
        // TODO: サブタスク未完了マーク実装
        Ok(())
    }

    async fn validate_subtask_exists(&self, project_id: &str, _task_id: &str, subtask_id: &str) -> Result<bool, RepositoryError> {
        Ok(self.get_subtask(project_id, subtask_id).await?.is_some())
    }

    async fn validate_task_exists(&self, project_id: &str, task_id: &str) -> Result<bool, RepositoryError> {
        Ok(self.get_task(project_id, task_id).await?.is_some())
    }

    async fn get_subtask_count(&self, _project_id: &str, _task_id: &str) -> Result<u64, RepositoryError> {
        // TODO: サブタスク数カウント実装
        Ok(0)
    }

    async fn get_completed_subtask_count(&self, _project_id: &str, _task_id: &str) -> Result<u64, RepositoryError> {
        // TODO: 完了済みサブタスク数カウント実装
        Ok(0)
    }

    async fn get_completion_rate(&self, _project_id: &str, _task_id: &str) -> Result<f32, RepositoryError> {
        // TODO: サブタスク完了率計算実装
        Ok(0.0)
    }

    async fn mark_all_completed(&self, _project_id: &str, _task_id: &str) -> Result<(), RepositoryError> {
        // TODO: 全サブタスク完了実装
        Ok(())
    }

    async fn mark_all_incomplete(&self, _project_id: &str, _task_id: &str) -> Result<(), RepositoryError> {
        // TODO: 全サブタスク未完了実装
        Ok(())
    }
}

#[async_trait]
impl TagRepositoryTrait for ProjectsRepository {
    async fn set_tag(&self, tag: &Tag) -> Result<(), RepositoryError> {
        self.set_tag(tag).await
    }

    async fn get_tag(&self, tag_id: &str) -> Result<Option<Tag>, RepositoryError> {
        self.get_tag(tag_id).await
    }

    async fn list_tags(&self) -> Result<Vec<Tag>, RepositoryError> {
        // TODO: タグ一覧取得実装
        Ok(Vec::new())
    }

    async fn delete_tag(&self, _tag_id: &str) -> Result<(), RepositoryError> {
        // TODO: タグ削除実装
        Ok(())
    }

    async fn find_tags_by_name(&self, _name_pattern: &str) -> Result<Vec<Tag>, RepositoryError> {
        // TODO: 名前によるタグ検索実装
        Ok(Vec::new())
    }

    async fn find_tags_by_color(&self, _color: &str) -> Result<Vec<Tag>, RepositoryError> {
        // TODO: 色によるタグ検索実装
        Ok(Vec::new())
    }

    async fn get_tag_usage_count(&self, _tag_id: &str) -> Result<u32, RepositoryError> {
        // TODO: タグ使用数カウント実装
        Ok(0)
    }

    async fn get_tags_with_usage_count(&self) -> Result<Vec<(Tag, u32)>, RepositoryError> {
        // TODO: 使用数付きタグ一覧実装
        Ok(Vec::new())
    }

    async fn get_popular_tags(&self, _limit: u32) -> Result<Vec<(Tag, u32)>, RepositoryError> {
        // TODO: 人気タグ取得実装
        Ok(Vec::new())
    }

    async fn get_unused_tags(&self) -> Result<Vec<Tag>, RepositoryError> {
        // TODO: 未使用タグ取得実装
        Ok(Vec::new())
    }

    async fn validate_tag_exists(&self, tag_id: &str) -> Result<bool, RepositoryError> {
        Ok(self.get_tag(tag_id).await?.is_some())
    }

    async fn is_tag_name_unique(&self, _name: &str, _exclude_id: Option<&str>) -> Result<bool, RepositoryError> {
        // TODO: タグ名の一意性チェック実装
        Ok(true)
    }

    async fn can_delete_tag(&self, _tag_id: &str) -> Result<bool, RepositoryError> {
        // TODO: タグ削除可能性チェック実装
        Ok(true)
    }

    async fn get_tag_count(&self) -> Result<u64, RepositoryError> {
        // TODO: タグ数カウント実装
        Ok(0)
    }

    async fn get_color_distribution(&self) -> Result<Vec<(Option<String>, u32)>, RepositoryError> {
        // TODO: 色分布取得実装
        Ok(Vec::new())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;
    use crate::types::{id_types::{ProjectId, UserId}, project_types::ProjectStatus};
    use chrono::Utc;

    #[tokio::test]
    async fn test_projects_repository() {
        let temp_dir = TempDir::new().unwrap();
        let repo = ProjectsRepository::new(temp_dir.path().to_path_buf()).unwrap();

        // テスト用プロジェクトを作成
        let test_project_id = ProjectId::new();
        let project = Project {
            id: test_project_id,
            name: "Test Project".to_string(),
            description: Some("Test description".to_string()),
            color: Some("#ff0000".to_string()),
            order_index: 1,
            is_archived: false,
            status: Some(ProjectStatus::Active),
            owner_id: Some(UserId::new()),
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        // プロジェクトを保存
        repo.set_project(&project).await.unwrap();

        // 基本的なプロジェクト操作テスト
        println!("プロジェクト保存完了: {}", project.name);

        // シンプルなタグ操作テスト
        let tag = Tag {
            id: crate::types::id_types::TagId::new(),
            name: "Urgent".to_string(),
            color: Some("#ff0000".to_string()),
            order_index: Some(1),
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        repo.set_tag(&tag).await.unwrap();
        println!("タグ保存完了: {}", tag.name);

        println!("プロジェクトリポジトリの基本機能テストが完了しました。");
        println!("Note: 複雑なオブジェクトのシリアライゼーションは次のフェーズで実装予定です。");
    }
}
