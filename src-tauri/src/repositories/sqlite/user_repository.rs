#[allow(dead_code)]
use async_trait::async_trait;
use crate::errors::RepositoryError;
use crate::models::user_models::User;
use crate::repositories::sqlite::SqliteRepository;
use crate::repositories::core::user_repository_trait::UserRepositoryTrait;


#[async_trait]
impl UserRepositoryTrait for SqliteRepository {
    async fn set_user(&self, _user: &User) -> Result<(), RepositoryError> {
        todo!("SQLiteでのユーザー保存実装")
    }

    async fn get_user(&self, _user_id: &str) -> Result<Option<User>, RepositoryError> {
        todo!("SQLiteでのユーザー取得実装")
    }

    async fn list_users(&self) -> Result<Vec<User>, RepositoryError> {
        todo!("SQLiteでのユーザー一覧実装")
    }

    async fn delete_user(&self, _user_id: &str) -> Result<(), RepositoryError> {
        todo!("SQLiteでのユーザー削除実装")
    }

    async fn find_user_by_email(&self, _email: &str) -> Result<Option<User>, RepositoryError> {
        todo!("SQLiteでのメール別ユーザー検索実装")
    }

    async fn search_users_by_name(&self, _name_pattern: &str) -> Result<Vec<User>, RepositoryError> {
        todo!("SQLiteでの名前別ユーザー検索実装")
    }

    async fn search_users(&self, _query: &str) -> Result<Vec<User>, RepositoryError> {
        todo!("SQLiteでのユーザー検索実装")
    }

    async fn find_users_by_project(&self, _project_id: &str) -> Result<Vec<User>, RepositoryError> {
        todo!("SQLiteでのプロジェクト別ユーザー検索実装")
    }

    async fn find_project_owners(&self, _project_id: &str) -> Result<Vec<User>, RepositoryError> {
        todo!("SQLiteでのプロジェクトオーナー取得実装")
    }

    async fn update_avatar(&self, _user_id: &str, _avatar_url: Option<String>) -> Result<(), RepositoryError> {
        todo!("SQLiteでのアバター更新実装")
    }

    async fn update_name(&self, _user_id: &str, _name: &str) -> Result<(), RepositoryError> {
        todo!("SQLiteでのユーザー名更新実装")
    }

    async fn update_email(&self, _user_id: &str, _email: &str) -> Result<(), RepositoryError> {
        todo!("SQLiteでのメールアドレス更新実装")
    }

    async fn validate_user_exists(&self, _user_id: &str) -> Result<bool, RepositoryError> {
        todo!("SQLiteでのユーザー存在検証実装")
    }

    async fn is_email_unique(&self, _email: &str, _exclude_id: Option<&str>) -> Result<bool, RepositoryError> {
        todo!("SQLiteでのメールアドレスユニーク性検証実装")
    }

    async fn validate_user_in_project(&self, _user_id: &str, _project_id: &str) -> Result<bool, RepositoryError> {
        todo!("SQLiteでのプロジェクト参加検証実装")
    }

    async fn get_user_count(&self) -> Result<u64, RepositoryError> {
        todo!("SQLiteでのユーザー数取得実装")
    }

    async fn get_active_user_count(&self) -> Result<u64, RepositoryError> {
        todo!("SQLiteでのアクティブユーザー数取得実装")
    }

    async fn get_user_project_count(&self, _user_id: &str) -> Result<u64, RepositoryError> {
        todo!("SQLiteでのユーザーのプロジェクト数取得実装")
    }

    async fn get_user_task_count(&self, _user_id: &str) -> Result<u64, RepositoryError> {
        todo!("SQLiteでのユーザーのタスク数取得実装")
    }
}
