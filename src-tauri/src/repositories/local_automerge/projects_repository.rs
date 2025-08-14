// TODO: 実装をautomerge-repoベースに変更する必要があります
// 現在の実装は一時的にコメントアウトしています

use std::path::PathBuf;
use crate::errors::RepositoryError;
use crate::models::{
    project::Project,
    task_list::TaskList,
    task::Task,
    subtask::Subtask,
    tag::Tag,
};

/// Projects用のAutomerge-Repoリポジトリ
/// プロジェクトごとに独立したドキュメントファイルを管理します
pub struct ProjectsRepository {
    // TODO: automerge-repo::RepoHandle を使用
    _base_path: PathBuf,
}

impl ProjectsRepository {
    /// 新しいProjectsRepositoryを作成
    pub fn new(base_path: PathBuf) -> Result<Self, RepositoryError> {
        Ok(Self {
            _base_path: base_path,
        })
    }

    /// プロジェクト情報を保存
    pub fn save_project(&mut self, _project: &Project) -> Result<(), RepositoryError> {
        // TODO: automerge-repoを使用した実装
        Ok(())
    }

    /// プロジェクト情報を取得
    pub fn get_project(&mut self, _project_id: &str) -> Result<Option<Project>, RepositoryError> {
        // TODO: automerge-repoを使用した実装
        Ok(None)
    }

    /// タスクリストを保存
    pub fn save_task_list(&mut self, _project_id: &str, _task_list: &TaskList) -> Result<(), RepositoryError> {
        // TODO: automerge-repoを使用した実装
        Ok(())
    }

    /// タスクリストを取得
    pub fn get_task_list(&mut self, _project_id: &str, _list_id: &str) -> Result<Option<TaskList>, RepositoryError> {
        // TODO: automerge-repoを使用した実装
        Ok(None)
    }

    /// タスクを保存
    pub fn save_task(&mut self, _project_id: &str, _task: &Task) -> Result<(), RepositoryError> {
        // TODO: automerge-repoを使用した実装
        Ok(())
    }

    /// タスクを取得
    pub fn get_task(&mut self, _project_id: &str, _task_id: &str) -> Result<Option<Task>, RepositoryError> {
        // TODO: automerge-repoを使用した実装
        Ok(None)
    }

    /// サブタスクを保存
    pub fn save_subtask(&mut self, _project_id: &str, _subtask: &Subtask) -> Result<(), RepositoryError> {
        // TODO: automerge-repoを使用した実装
        Ok(())
    }

    /// サブタスクを取得
    pub fn get_subtask(&mut self, _project_id: &str, _subtask_id: &str) -> Result<Option<Subtask>, RepositoryError> {
        // TODO: automerge-repoを使用した実装
        Ok(None)
    }

    /// タグを保存
    pub fn save_tag(&mut self, _tag: &Tag) -> Result<(), RepositoryError> {
        // TODO: automerge-repoを使用した実装
        Ok(())
    }

    /// タグを取得
    pub fn get_tag(&mut self, _tag_id: &str) -> Result<Option<Tag>, RepositoryError> {
        // TODO: automerge-repoを使用した実装
        Ok(None)
    }

    /// プロジェクトドキュメントを削除
    pub fn delete_project_document(&mut self, _project_id: &str) -> Result<(), RepositoryError> {
        // TODO: automerge-repoを使用した実装
        Ok(())
    }

    /// プロジェクトのバックアップを作成
    pub fn backup_project(&self, _project_id: &str, _backup_path: &str) -> Result<(), RepositoryError> {
        // TODO: automerge-repoを使用した実装
        Ok(())
    }

    /// バックアップからプロジェクトを復元
    pub fn restore_project(&mut self, _backup_path: &str) -> Result<String, RepositoryError> {
        // TODO: automerge-repoを使用した実装
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

        // 保存 (現在は何もしない)
        repo.save_project(&project).unwrap();

        // TODO: 実装完了後にテストを有効化
        // let retrieved = repo.get_project("proj_test_123").unwrap().unwrap();
        // assert_eq!(retrieved.name, "Test Project");
    }
}