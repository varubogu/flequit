//! User用SQLiteリポジトリ
//!
//! ユーザーデータのSQLiteベースでのCRUD操作を提供

use super::database_manager::DatabaseManager;
use crate::errors::repository_error::RepositoryError;
use crate::models::sqlite::user::{ActiveModel as UserActiveModel, Column, Entity as UserEntity};
use crate::models::sqlite::{DomainToSqliteConverter, SqliteModelConverter};
use crate::models::user::User;
use crate::repositories::base_repository_trait::Repository;
use crate::repositories::user_repository_trait::UserRepositoryTrait;
use crate::types::id_types::UserId;
use log::info;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, EntityTrait, PaginatorTrait, QueryFilter, QueryOrder,
    QuerySelect,
};
use std::sync::Arc;
use tokio::sync::RwLock;

/// User用SQLiteリポジトリ
#[derive(Debug)]
pub struct UserLocalSqliteRepository {
    db_manager: Arc<RwLock<DatabaseManager>>,
}

impl UserLocalSqliteRepository {
    /// 新しいUserRepositoryを作成
    pub fn new(db_manager: Arc<RwLock<DatabaseManager>>) -> Self {
        Self { db_manager }
    }

    /// メールアドレスでユーザーを検索
    pub async fn find_by_email(&self, email: &str) -> Result<Option<User>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await?;

        if let Some(model) = UserEntity::find()
            .filter(Column::Email.eq(email))
            .one(db)
            .await?
        {
            let user = model
                .to_domain_model()
                .await
                .map_err(RepositoryError::Conversion)?;
            Ok(Some(user))
        } else {
            Ok(None)
        }
    }

    /// ユーザー名でユーザーを検索
    pub async fn find_by_username(&self, username: &str) -> Result<Option<User>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await?;

        if let Some(model) = UserEntity::find()
            .filter(Column::Username.eq(username))
            .one(db)
            .await?
        {
            let user = model
                .to_domain_model()
                .await
                .map_err(RepositoryError::Conversion)?;
            Ok(Some(user))
        } else {
            Ok(None)
        }
    }

    /// 名前でユーザーを検索（部分一致）
    pub async fn find_by_name_partial(&self, name: &str) -> Result<Vec<User>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await?;

        let models = UserEntity::find()
            .filter(Column::Username.contains(name))
            .order_by_asc(Column::Username)
            .all(db)
            .await?;

        let mut users = Vec::new();
        for model in models {
            let user = model
                .to_domain_model()
                .await
                .map_err(RepositoryError::Conversion)?;
            users.push(user);
        }

        Ok(users)
    }

    /// 表示名でユーザーを検索（部分一致）
    pub async fn find_by_display_name_partial(
        &self,
        display_name: &str,
    ) -> Result<Vec<User>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await?;

        let models = UserEntity::find()
            .filter(Column::DisplayName.contains(display_name))
            .order_by_asc(Column::DisplayName)
            .all(db)
            .await?;

        let mut users = Vec::new();
        for model in models {
            let user = model
                .to_domain_model()
                .await
                .map_err(RepositoryError::Conversion)?;
            users.push(user);
        }

        Ok(users)
    }

    /// 最近作成されたユーザーを取得
    pub async fn find_recent_users(&self, limit: u64) -> Result<Vec<User>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await?;

        let models = UserEntity::find()
            .order_by_desc(Column::CreatedAt)
            .limit(limit)
            .all(db)
            .await?;

        let mut users = Vec::new();
        for model in models {
            let user = model
                .to_domain_model()
                .await
                .map_err(RepositoryError::Conversion)?;
            users.push(user);
        }

        Ok(users)
    }
}

impl UserRepositoryTrait for UserLocalSqliteRepository {}

#[async_trait::async_trait]
impl Repository<User, UserId> for UserLocalSqliteRepository {
    async fn save(&self, user: &User) -> Result<(), RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await?;

        // 既存のユーザーをチェック（IDで）
        let existing = UserEntity::find_by_id(user.id.to_string()).one(db).await?;

        if let Some(existing_model) = existing {
            // 更新
            let mut active_model: UserActiveModel = existing_model.into();
            let new_active = user
                .to_sqlite_model()
                .await
                .map_err(RepositoryError::Conversion)?;

            active_model.username = new_active.username;
            active_model.display_name = new_active.display_name;
            active_model.email = new_active.email;
            active_model.avatar_url = new_active.avatar_url;
            active_model.bio = new_active.bio;
            active_model.timezone = new_active.timezone;
            active_model.is_active = new_active.is_active;
            active_model.updated_at = new_active.updated_at;

            active_model.update(db).await?;
            Ok(())
        } else {
            // 新規作成
            let active_model = user
                .to_sqlite_model()
                .await
                .map_err(RepositoryError::Conversion)?;
            active_model.insert(db).await?;
            Ok(())
        }
    }

    async fn find_by_id(&self, id: &UserId) -> Result<Option<User>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await?;

        if let Some(model) = UserEntity::find_by_id(id.to_string()).one(db).await? {
            let user = model
                .to_domain_model()
                .await
                .map_err(RepositoryError::Conversion)?;
            Ok(Some(user))
        } else {
            Ok(None)
        }
    }

    async fn delete(&self, id: &UserId) -> Result<(), RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await?;

        UserEntity::delete_by_id(id.to_string()).exec(db).await?;
        Ok(())
    }

    async fn find_all(&self) -> Result<Vec<User>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await?;

        let models = UserEntity::find()
            .order_by_asc(Column::CreatedAt)
            .all(db)
            .await?;

        let mut users = Vec::new();
        for model in models {
            let user = model
                .to_domain_model()
                .await
                .map_err(RepositoryError::Conversion)?;
            users.push(user);
        }

        Ok(users)
    }

    async fn exists(&self, id: &UserId) -> Result<bool, RepositoryError> {
        info!("UserLocalSqliteRepository::exists");
        info!("{:?}", id);

        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await?;

        let count = UserEntity::find_by_id(id.to_string()).count(db).await?;

        Ok(count > 0)
    }

    async fn count(&self) -> Result<u64, RepositoryError> {
        info!("UserLocalSqliteRepository::count");

        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await?;

        let count = UserEntity::find().count(db).await?;
        Ok(count)
    }
}
