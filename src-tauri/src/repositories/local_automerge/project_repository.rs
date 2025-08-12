use async_trait::async_trait;
use crate::errors::RepositoryError;
use crate::models::project_models::{Project, ProjectMember};
use crate::types::project_types::ProjectStatus;
use crate::repositories::local_automerge::LocalAutomergeRepository;
use crate::repositories::core::project_repository_trait::ProjectRepositoryTrait;

#[async_trait]
impl ProjectRepositoryTrait for LocalAutomergeRepository {
    async fn set_project(&self, project: &Project) -> Result<(), RepositoryError> {
        self.storage.set_project(project).await
    }

    async fn get_project(&self, project_id: &str) -> Result<Option<Project>, RepositoryError> {
        self.storage.get_project(project_id).await
    }

    async fn list_projects(&self) -> Result<Vec<Project>, RepositoryError> {
        self.storage.list_projects().await
    }

    async fn delete_project(&self, project_id: &str) -> Result<(), RepositoryError> {
        // ローカルAutomergeでは物理削除を行う
        self.storage.delete_project_document(project_id).await
    }

    async fn set_member(&self, project_id: &str, member: &ProjectMember) -> Result<(), RepositoryError> {
        self.storage.set_member(project_id, member).await
    }

    async fn get_member(&self, project_id: &str, user_id: &str) -> Result<Option<ProjectMember>, RepositoryError> {
        self.storage.get_member(project_id, user_id).await
    }

    async fn list_members(&self, project_id: &str) -> Result<Vec<ProjectMember>, RepositoryError> {
        self.storage.list_members(project_id).await
    }

    async fn remove_member(&self, _project_id: &str, _user_id: &str) -> Result<(), RepositoryError> {
        // ローカルAutomergeではメンバーを物理削除
        // 実装では該当メンバードキュメントを削除する
        todo!("Implementation pending - プロジェクトメンバー物理削除")
    }

    async fn find_projects_by_status(&self, status: ProjectStatus) -> Result<Vec<Project>, RepositoryError> {
        let all_projects = self.storage.list_projects().await?;
        let filtered_projects = all_projects
            .into_iter()
            .filter(|project| project.status.as_ref() == Some(&status))
            .collect();
        Ok(filtered_projects)
    }

    async fn find_projects_by_member(&self, user_id: &str) -> Result<Vec<Project>, RepositoryError> {
        let all_projects = self.storage.list_projects().await?;
        let mut member_projects = Vec::new();

        for project in all_projects {
            // オーナーかチェック
            if let Some(owner_id) = &project.owner_id {
                if owner_id == user_id {
                    member_projects.push(project);
                    continue;
                }
            }

            // メンバーかチェック
            if let Ok(Some(_)) = self.storage.get_member(&project.id, user_id).await {
                member_projects.push(project);
            }
        }

        Ok(member_projects)
    }

    async fn validate_project_exists(&self, project_id: &str) -> Result<bool, RepositoryError> {
        match self.storage.get_project(project_id).await? {
            Some(_) => Ok(true),
            None => Ok(false),
        }
    }

    async fn validate_member_exists(&self, project_id: &str, user_id: &str) -> Result<bool, RepositoryError> {
        match self.storage.get_member(project_id, user_id).await? {
            Some(_) => Ok(true),
            None => Ok(false),
        }
    }

    async fn get_project_count(&self) -> Result<u64, RepositoryError> {
        let projects = self.storage.list_projects().await?;
        Ok(projects.len() as u64)
    }

    async fn get_member_count(&self, project_id: &str) -> Result<u64, RepositoryError> {
        let members = self.storage.list_members(project_id).await?;
        Ok(members.len() as u64)
    }
}
