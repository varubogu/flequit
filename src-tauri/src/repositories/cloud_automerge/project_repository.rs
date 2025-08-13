use async_trait::async_trait;
use crate::errors::RepositoryError;
use crate::repositories::cloud_automerge::CloudAutomergeRepository;
use crate::models::project::{Project, ProjectMember};
use crate::types::project_types::ProjectStatus;
use crate::repositories::core::project_repository_trait::ProjectRepositoryTrait;

#[async_trait]
impl ProjectRepositoryTrait for CloudAutomergeRepository {
    async fn set_project(&self, _project: &Project) -> Result<(), RepositoryError> {
        todo!("クラウドAutomergeでのプロジェクト保存実装")
    }

    async fn get_project(&self, _project_id: &str) -> Result<Option<Project>, RepositoryError> {
        todo!("クラウドAutomergeでのプロジェクト取得実装")
    }

    async fn list_projects(&self) -> Result<Vec<Project>, RepositoryError> {
        todo!("クラウドAutomergeでのプロジェクト一覧実装")
    }

    async fn delete_project(&self, _project_id: &str) -> Result<(), RepositoryError> {
        todo!("クラウドAutomergeでのプロジェクト削除実装")
    }

    async fn set_member(&self, _project_id: &str, _member: &ProjectMember) -> Result<(), RepositoryError> {
        todo!("クラウドAutomergeでのメンバー設定実装")
    }

    async fn get_member(&self, _project_id: &str, _user_id: &str) -> Result<Option<ProjectMember>, RepositoryError> {
        todo!("クラウドAutomergeでのメンバー取得実装")
    }

    async fn list_members(&self, _project_id: &str) -> Result<Vec<ProjectMember>, RepositoryError> {
        todo!("クラウドAutomergeでのメンバー一覧実装")
    }

    async fn remove_member(&self, _project_id: &str, _user_id: &str) -> Result<(), RepositoryError> {
        todo!("クラウドAutomergeでのメンバー削除実装")
    }

    async fn find_projects_by_status(&self, _status: ProjectStatus) -> Result<Vec<Project>, RepositoryError> {
        todo!("クラウドAutomergeでのステータス別プロジェクト検索実装")
    }

    async fn find_projects_by_member(&self, _user_id: &str) -> Result<Vec<Project>, RepositoryError> {
        todo!("クラウドAutomergeでの参加プロジェクト取得実装")
    }

    async fn validate_project_exists(&self, _project_id: &str) -> Result<bool, RepositoryError> {
        todo!("クラウドAutomergeでのプロジェクト存在検証実装")
    }

    async fn validate_member_exists(&self, _project_id: &str, _user_id: &str) -> Result<bool, RepositoryError> {
        todo!("クラウドAutomergeでのメンバー存在検証実装")
    }

    async fn get_project_count(&self) -> Result<u64, RepositoryError> {
        todo!("クラウドAutomergeでのプロジェクト数取得実装")
    }

    async fn get_member_count(&self, _project_id: &str) -> Result<u64, RepositoryError> {
        todo!("クラウドAutomergeでのメンバー数取得実装")
    }
}
