use async_trait::async_trait;
use crate::errors::RepositoryError;
use crate::models::user::User;
use crate::repositories::cloud_automerge::CloudAutomergeRepository;
use crate::repositories::user_repository_trait::UserRepositoryTrait;

#[async_trait]
impl UserRepositoryTrait for CloudAutomergeRepository {
    async fn set_user(&self, _user: &User) -> Result<(), RepositoryError> {
        todo!("クラウドAutomergeでのユーザー保存実装")
    }

    async fn get_user(&self, _user_id: &str) -> Result<Option<User>, RepositoryError> {
        todo!("クラウドAutomergeでのユーザー取得実装")
    }

    async fn list_users(&self) -> Result<Vec<User>, RepositoryError> {
        todo!("クラウドAutomergeでのユーザー一覧実装")
    }

    async fn delete_user(&self, _user_id: &str) -> Result<(), RepositoryError> {
        todo!("クラウドAutomergeでのユーザー削除実装")
    }

    async fn find_user_by_email(&self, _email: &str) -> Result<Option<User>, RepositoryError> {
        todo!("クラウドAutomergeでのメール別ユーザー検索実装")
    }

    async fn search_users_by_name(&self, _name_pattern: &str) -> Result<Vec<User>, RepositoryError> {
        todo!("クラウドAutomergeでの名前別ユーザー検索実装")
    }

    async fn search_users(&self, _query: &str) -> Result<Vec<User>, RepositoryError> {
        todo!("クラウドAutomergeでのユーザー検索実装")
    }

    async fn find_users_by_project(&self, _project_id: &str) -> Result<Vec<User>, RepositoryError> {
        todo!("クラウドAutomergeでのプロジェクト別ユーザー検索実装")
    }

    async fn find_project_owners(&self, _project_id: &str) -> Result<Vec<User>, RepositoryError> {
        todo!("クラウドAutomergeでのプロジェクトオーナー取得実装")
    }

    async fn update_avatar(&self, _user_id: &str, _avatar_url: Option<String>) -> Result<(), RepositoryError> {
        todo!("クラウドAutomergeでのアバター更新実装")
    }

    async fn update_name(&self, _user_id: &str, _name: &str) -> Result<(), RepositoryError> {
        todo!("クラウドAutomergeでのユーザー名更新実装")
    }

    async fn update_email(&self, _user_id: &str, _email: &str) -> Result<(), RepositoryError> {
        todo!("クラウドAutomergeでのメールアドレス更新実装")
    }

    async fn validate_user_exists(&self, _user_id: &str) -> Result<bool, RepositoryError> {
        todo!("クラウドAutomergeでのユーザー存在検証実装")
    }

    async fn is_email_unique(&self, _email: &str, _exclude_id: Option<&str>) -> Result<bool, RepositoryError> {
        todo!("クラウドAutomergeでのメールアドレスユニーク性検証実装")
    }

    async fn validate_user_in_project(&self, _user_id: &str, _project_id: &str) -> Result<bool, RepositoryError> {
        todo!("クラウドAutomergeでのプロジェクト参加検証実装")
    }

    async fn get_user_count(&self) -> Result<u64, RepositoryError> {
        todo!("クラウドAutomergeでのユーザー数取得実装")
    }

    async fn get_active_user_count(&self) -> Result<u64, RepositoryError> {
        todo!("クラウドAutomergeでのアクティブユーザー数取得実装")
    }

    async fn get_user_project_count(&self, _user_id: &str) -> Result<u64, RepositoryError> {
        todo!("クラウドAutomergeでのユーザーのプロジェクト数取得実装")
    }

    async fn get_user_task_count(&self, _user_id: &str) -> Result<u64, RepositoryError> {
        todo!("クラウドAutomergeでのユーザーのタスク数取得実装")
    }
}
