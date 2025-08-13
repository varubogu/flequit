use async_trait::async_trait;
use crate::errors::RepositoryError;
use crate::models::project::{Project, ProjectMember};
use crate::types::project_types::ProjectStatus;
use crate::repositories::web::WebRepository;
use crate::repositories::core::project_repository_trait::ProjectRepositoryTrait;



#[async_trait]
impl ProjectRepositoryTrait for WebRepository {
    async fn set_project(&self, _project: &Project) -> Result<(), RepositoryError> {
        todo!("WebAPIでのプロジェクト保存実装")
    }

    async fn get_project(&self, _project_id: &str) -> Result<Option<Project>, RepositoryError> {
        todo!("WebAPIでのプロジェクト取得実装")
    }

    async fn list_projects(&self) -> Result<Vec<Project>, RepositoryError> {
        todo!("WebAPIでのプロジェクト一覧実装")
    }

    async fn delete_project(&self, _project_id: &str) -> Result<(), RepositoryError> {
        todo!("WebAPIでのプロジェクト削除実装")
    }

    async fn set_member(&self, _project_id: &str, _member: &ProjectMember) -> Result<(), RepositoryError> {
        todo!("WebAPIでのメンバー設定実装")
    }

    async fn get_member(&self, _project_id: &str, _user_id: &str) -> Result<Option<ProjectMember>, RepositoryError> {
        todo!("WebAPIでのメンバー取得実装")
    }

    async fn list_members(&self, _project_id: &str) -> Result<Vec<ProjectMember>, RepositoryError> {
        todo!("WebAPIでのメンバー一覧実装")
    }

    async fn remove_member(&self, _project_id: &str, _user_id: &str) -> Result<(), RepositoryError> {
        todo!("WebAPIでのメンバー削除実装")
    }

    async fn find_projects_by_status(&self, _status: ProjectStatus) -> Result<Vec<Project>, RepositoryError> {
        todo!("WebAPIでのステータス別プロジェクト検索実装")
    }

    async fn find_projects_by_member(&self, _user_id: &str) -> Result<Vec<Project>, RepositoryError> {
        todo!("WebAPIでの参加プロジェクト取得実装")
    }

    async fn validate_project_exists(&self, _project_id: &str) -> Result<bool, RepositoryError> {
        todo!("WebAPIでのプロジェクト存在検証実装")
    }

    async fn validate_member_exists(&self, _project_id: &str, _user_id: &str) -> Result<bool, RepositoryError> {
        todo!("WebAPIでのメンバー存在検証実装")
    }

    async fn get_project_count(&self) -> Result<u64, RepositoryError> {
        todo!("WebAPIでのプロジェクト数取得実装")
    }

    async fn get_member_count(&self, _project_id: &str) -> Result<u64, RepositoryError> {
        todo!("WebAPIでのメンバー数取得実装")
    }
}
