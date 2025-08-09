use crate::errors::RepositoryError;
use crate::types::project_types::{Project, ProjectMember, ProjectStatus};
use crate::repositories::automerge::{SqliteStorage, AutomergeStorage};
use crate::repositories::core::ProjectRepositoryTrait;
use async_trait::async_trait;

pub struct ProjectRepository {
    sqlite_storage: SqliteStorage,
    automerge_storage: AutomergeStorage,
}

#[async_trait]
impl ProjectRepositoryTrait for ProjectRepository {
    async fn set_project(&self, project: &Project) -> Result<(), RepositoryError> {
        todo!("Implementation pending - 2層ストレージ（SQLite + Automerge）更新")
    }

    async fn get_project(&self, project_id: &str) -> Result<Option<Project>, RepositoryError> {
        todo!("Implementation pending - SQLite優先で読み込み")
    }

    async fn list_projects(&self) -> Result<Vec<Project>, RepositoryError> {
        todo!("Implementation pending - SQLiteから全プロジェクト取得")
    }

    async fn delete_project(&self, project_id: &str) -> Result<(), RepositoryError> {
        todo!("Implementation pending - 論理削除のみ")
    }

    async fn set_member(&self, project_id: &str, member: &ProjectMember) -> Result<(), RepositoryError> {
        todo!("Implementation pending - プロジェクトドキュメント内のmembersパス更新")
    }

    async fn get_member(&self, project_id: &str, user_id: &str) -> Result<Option<ProjectMember>, RepositoryError> {
        todo!("Implementation pending")
    }

    async fn list_members(&self, project_id: &str) -> Result<Vec<ProjectMember>, RepositoryError> {
        todo!("Implementation pending")
    }

    async fn remove_member(&self, project_id: &str, user_id: &str) -> Result<(), RepositoryError> {
        todo!("Implementation pending - 論理削除")
    }

    async fn find_projects_by_status(&self, status: ProjectStatus) -> Result<Vec<Project>, RepositoryError> {
        todo!("Implementation pending - SQLiteクエリ")
    }

    async fn find_projects_by_member(&self, user_id: &str) -> Result<Vec<Project>, RepositoryError> {
        todo!("Implementation pending - SQLiteクエリ")
    }

    async fn validate_project_exists(&self, project_id: &str) -> Result<bool, RepositoryError> {
        todo!("Implementation pending")
    }

    async fn validate_member_exists(&self, project_id: &str, user_id: &str) -> Result<bool, RepositoryError> {
        todo!("Implementation pending")
    }

    async fn get_project_count(&self) -> Result<u64, RepositoryError> {
        todo!("Implementation pending")
    }

    async fn get_member_count(&self, project_id: &str) -> Result<u64, RepositoryError> {
        todo!("Implementation pending")
    }
}

impl ProjectRepository {
    pub fn new(sqlite_storage: SqliteStorage, automerge_storage: AutomergeStorage) -> Self {
        Self {
            sqlite_storage,
            automerge_storage,
        }
    }

    // プロジェクト基本操作（レベル1: ルート直下）
    // 今後削除予定のメソッドたち（レガシーサポート）
}