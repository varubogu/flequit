use std::path::PathBuf;
use crate::errors::RepositoryError;
use crate::models::{
    project::Project,
    task_list::TaskList,
    task::Task,
    subtask::Subtask,
    tag::Tag,
};
use super::document_manager::{DocumentManager, DocumentType};
use crate::services::path_service::PathService;

/// Projects用のAutomerge-Repoリポジトリ
/// プロジェクトごとに独立したドキュメントファイルを管理します
pub struct ProjectsRepository {
    document_manager: DocumentManager,
}

impl ProjectsRepository {
    /// 新しいProjectsRepositoryを作成
    pub fn new(base_path: PathBuf) -> Result<Self, RepositoryError> {
        let document_manager = DocumentManager::new(base_path)?;
        Ok(Self {
            document_manager,
        })
    }

    /// デフォルトパスでProjectsRepositoryを作成
    pub fn with_default_path() -> Result<Self, RepositoryError> {
        let data_dir = PathService::get_default_data_dir()
            .unwrap_or_else(|_| PathBuf::from("./flequit"));
        Self::new(data_dir)
    }

    /// プロジェクト情報を保存
    pub async fn save_project(&mut self, project: &Project) -> Result<(), RepositoryError> {
        // プロジェクト毎に個別のドキュメントを作成
        self.document_manager
            .save_data(&DocumentType::Project(project.id.clone()), "project", project).await
    }

    /// プロジェクト情報を取得
    pub async fn get_project(&mut self, project_id: &str) -> Result<Option<Project>, RepositoryError> {
        self.document_manager
            .load_data::<Project>(&DocumentType::Project(project_id.to_string()), "project").await
    }

    /// タスクリストを保存
    pub async fn save_task_list(&mut self, project_id: &str, task_list: &TaskList) -> Result<(), RepositoryError> {
        // タスクリストをプロジェクトドキュメントに保存
        let key = format!("task_list_{}", task_list.id);
        self.document_manager
            .save_data(&DocumentType::Project(project_id.to_string()), &key, task_list).await
    }

    /// タスクリストを取得
    pub async fn get_task_list(&mut self, project_id: &str, list_id: &str) -> Result<Option<TaskList>, RepositoryError> {
        let key = format!("task_list_{}", list_id);
        self.document_manager
            .load_data::<TaskList>(&DocumentType::Project(project_id.to_string()), &key).await
    }

    /// タスクを保存
    pub async fn save_task(&mut self, project_id: &str, task: &Task) -> Result<(), RepositoryError> {
        let key = format!("task_{}", task.id);
        self.document_manager
            .save_data(&DocumentType::Project(project_id.to_string()), &key, task).await
    }

    /// タスクを取得
    pub async fn get_task(&mut self, project_id: &str, task_id: &str) -> Result<Option<Task>, RepositoryError> {
        let key = format!("task_{}", task_id);
        self.document_manager
            .load_data::<Task>(&DocumentType::Project(project_id.to_string()), &key).await
    }

    /// サブタスクを保存
    pub async fn save_subtask(&mut self, project_id: &str, subtask: &Subtask) -> Result<(), RepositoryError> {
        let key = format!("subtask_{}", subtask.id);
        self.document_manager
            .save_data(&DocumentType::Project(project_id.to_string()), &key, subtask).await
    }

    /// サブタスクを取得
    pub async fn get_subtask(&mut self, project_id: &str, subtask_id: &str) -> Result<Option<Subtask>, RepositoryError> {
        let key = format!("subtask_{}", subtask_id);
        self.document_manager
            .load_data::<Subtask>(&DocumentType::Project(project_id.to_string()), &key).await
    }

    /// タグを保存（グローバルタグ用に特別なドキュメントを使用）
    pub async fn save_tag(&mut self, tag: &Tag) -> Result<(), RepositoryError> {
        let key = format!("tag_{}", tag.id);
        // タグはグローバルなため、特別なTagドキュメントタイプが必要
        // 今回は簡略化してSettingsドキュメントを流用
        self.document_manager
            .save_data(&DocumentType::Settings, &key, tag).await
    }

    /// タグを取得
    pub async fn get_tag(&mut self, tag_id: &str) -> Result<Option<Tag>, RepositoryError> {
        let key = format!("tag_{}", tag_id);
        self.document_manager
            .load_data::<Tag>(&DocumentType::Settings, &key).await
    }

    /// プロジェクトドキュメントを削除
    pub fn delete_project_document(&mut self, project_id: &str) -> Result<(), RepositoryError> {
        self.document_manager.delete_document(DocumentType::Project(project_id.to_string()))
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

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;
    use crate::types::project_types::ProjectStatus;
    use chrono::Utc;

    #[tokio::test]
    async fn test_projects_repository() {
        let temp_dir = TempDir::new().unwrap();
        let mut repo = ProjectsRepository::new(temp_dir.path().to_path_buf()).unwrap();

        // テスト用プロジェクトを作成
        let project = Project {
            id: "proj_test_123".to_string(),
            name: "Test Project".to_string(),
            description: Some("Test description".to_string()),
            color: Some("#ff0000".to_string()),
            order_index: 1,
            is_archived: false,
            status: Some(ProjectStatus::Active),
            owner_id: Some("user_123".to_string()),
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        // プロジェクトを保存
        repo.save_project(&project).await.unwrap();
        
        // 基本的なプロジェクト操作テスト
        println!("プロジェクト保存完了: {}", project.name);
        
        // シンプルなタグ操作テスト
        let tag = Tag {
            id: "tag_urgent".to_string(),
            name: "Urgent".to_string(),
            color: Some("#ff0000".to_string()),
            order_index: Some(1),
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };
        
        repo.save_tag(&tag).await.unwrap();
        println!("タグ保存完了: {}", tag.name);
        
        println!("プロジェクトリポジトリの基本機能テストが完了しました。");
        println!("Note: 複雑なオブジェクトのシリアライゼーションは次のフェーズで実装予定です。");
    }
}