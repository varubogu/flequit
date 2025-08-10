use async_trait::async_trait;
use crate::errors::RepositoryError;
use crate::types::user_types::User;
use crate::repositories::local_automerge::LocalAutomergeRepository;
use crate::repositories::core::user_repository_trait::UserRepositoryTrait;

#[async_trait]
impl UserRepositoryTrait for LocalAutomergeRepository {
    async fn set_user(&self, user: &User) -> Result<(), RepositoryError> {
        self.storage.set_user(user).await
    }

    async fn get_user(&self, user_id: &str) -> Result<Option<User>, RepositoryError> {
        self.storage.get_user(user_id).await
    }

    async fn list_users(&self) -> Result<Vec<User>, RepositoryError> {
        self.storage.list_users().await
    }

    async fn delete_user(&self, _user_id: &str) -> Result<(), RepositoryError> {
        // ローカルAutomergeでは物理削除
        // 実装では該当ユーザードキュメントを削除する
        todo!("Implementation pending - ユーザー物理削除")
    }

    async fn find_user_by_email(&self, email: &str) -> Result<Option<User>, RepositoryError> {
        let all_users = self.storage.list_users().await?;

        for user in all_users {
            if user.email == email {
                return Ok(Some(user));
            }
        }

        Ok(None)
    }

    async fn search_users_by_name(&self, name_pattern: &str) -> Result<Vec<User>, RepositoryError> {
        let all_users = self.storage.list_users().await?;
        let filtered_users = all_users
            .into_iter()
            .filter(|user| {
                user.name.to_lowercase().contains(&name_pattern.to_lowercase()) ||
                user.display_name.as_ref().map_or(false, |display_name| {
                    display_name.to_lowercase().contains(&name_pattern.to_lowercase())
                })
            })
            .collect();
        Ok(filtered_users)
    }

    async fn search_users(&self, query: &str) -> Result<Vec<User>, RepositoryError> {
        let all_users = self.storage.list_users().await?;
        let query_lower = query.to_lowercase();

        let filtered_users = all_users
            .into_iter()
            .filter(|user| {
                user.name.to_lowercase().contains(&query_lower) ||
                user.email.to_lowercase().contains(&query_lower) ||
                user.display_name.as_ref().map_or(false, |display_name| {
                    display_name.to_lowercase().contains(&query_lower)
                })
            })
            .collect();
        Ok(filtered_users)
    }

    async fn find_users_by_project(&self, project_id: &str) -> Result<Vec<User>, RepositoryError> {
        let members = self.storage.list_members(project_id).await?;
        let mut project_users = Vec::new();

        for member in members {
            if let Some(user) = self.storage.get_user(&member.user_id).await? {
                project_users.push(user);
            }
        }

        Ok(project_users)
    }

    async fn find_project_owners(&self, project_id: &str) -> Result<Vec<User>, RepositoryError> {
        let members = self.storage.list_members(project_id).await?;
        let mut owners = Vec::new();

        for member in members {
            if format!("{:?}", member.role).to_lowercase() == "owner" {
                if let Some(user) = self.storage.get_user(&member.user_id).await? {
                    owners.push(user);
                }
            }
        }

        Ok(owners)
    }

    async fn update_avatar(&self, user_id: &str, avatar_url: Option<String>) -> Result<(), RepositoryError> {
        if let Some(mut user) = self.storage.get_user(user_id).await? {
            user.avatar_url = avatar_url;
            self.storage.set_user(&user).await
        } else {
            todo!("User not found error handling")
        }
    }

    async fn update_name(&self, user_id: &str, name: &str) -> Result<(), RepositoryError> {
        if let Some(mut user) = self.storage.get_user(user_id).await? {
            user.name = name.to_string();
            self.storage.set_user(&user).await
        } else {
            todo!("User not found error handling")
        }
    }

    async fn update_email(&self, user_id: &str, email: &str) -> Result<(), RepositoryError> {
        // メールアドレスの重複チェック
        if !self.is_email_unique(email, Some(user_id)).await? {
            return Err(RepositoryError::EmailConflict(format!("Email {} already exists", email)));
        }

        if let Some(mut user) = self.storage.get_user(user_id).await? {
            user.email = email.to_string();
            self.storage.set_user(&user).await
        } else {
            Err(RepositoryError::UserNotFound(format!("User {} not found", user_id)))
        }
    }

    async fn validate_user_exists(&self, user_id: &str) -> Result<bool, RepositoryError> {
        match self.storage.get_user(user_id).await? {
            Some(_) => Ok(true),
            None => Ok(false),
        }
    }

    async fn is_email_unique(&self, email: &str, exclude_id: Option<&str>) -> Result<bool, RepositoryError> {
        let all_users = self.storage.list_users().await?;

        for user in all_users {
            if user.email.to_lowercase() == email.to_lowercase() {
                // exclude_idが指定されている場合、そのIDは除外する
                if let Some(exclude_id) = exclude_id {
                    if user.id == exclude_id {
                        continue;
                    }
                }
                return Ok(false); // 重複あり
            }
        }

        Ok(true) // ユニーク
    }

    async fn validate_user_in_project(&self, user_id: &str, project_id: &str) -> Result<bool, RepositoryError> {
        match self.storage.get_member(project_id, user_id).await? {
            Some(_) => Ok(true),
            None => Ok(false),
        }
    }

    async fn get_user_count(&self) -> Result<u64, RepositoryError> {
        let users = self.storage.list_users().await?;
        Ok(users.len() as u64)
    }

    async fn get_active_user_count(&self) -> Result<u64, RepositoryError> {
        // ローカルAutomergeでは削除されたユーザーは物理削除されるため、
        // 全ユーザーがアクティブユーザー
        self.get_user_count().await
    }

    async fn get_user_project_count(&self, user_id: &str) -> Result<u64, RepositoryError> {
        let all_projects = self.storage.list_projects().await?;
        let mut project_count = 0u64;

        for project in all_projects {
            // オーナーかチェック
            if let Some(owner_id) = &project.owner_id {
                if owner_id == user_id {
                    project_count += 1;
                    continue;
                }
            }

            // メンバーかチェック
            if let Ok(Some(_)) = self.storage.get_member(&project.id, user_id).await {
                project_count += 1;
            }
        }

        Ok(project_count)
    }

    async fn get_user_task_count(&self, user_id: &str) -> Result<u64, RepositoryError> {
        let all_projects = self.storage.list_projects().await?;
        let mut task_count = 0u64;

        for project in all_projects {
            let tasks = self.storage.list_tasks(&project.id).await?;
            for task in tasks {
                if task.assigned_user_ids.contains(&user_id.to_string()) {
                    task_count += 1;
                }
            }
        }

        Ok(task_count)
    }
}
