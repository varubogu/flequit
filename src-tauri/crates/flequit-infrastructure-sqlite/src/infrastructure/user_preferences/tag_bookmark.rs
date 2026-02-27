//! TagBookmark用SQLiteリポジトリ

use super::super::database_manager::DatabaseManager;
use crate::errors::sqlite_error::SQLiteError;
use crate::models::user_preferences::tag_bookmark::{
    ActiveModel as TagBookmarkActiveModel, Column, Entity as TagBookmarkEntity,
};
use crate::models::{DomainToSqliteConverter, SqliteModelConverter};
use flequit_model::models::user_preferences::tag_bookmark::TagBookmark;
use flequit_model::types::id_types::{ProjectId, TagBookmarkId, TagId, UserId};
use flequit_types::errors::repository_error::RepositoryError;
use sea_orm::{ActiveModelTrait, ColumnTrait, EntityTrait, QueryFilter, QueryOrder, Set};
use std::sync::Arc;
use tokio::sync::RwLock;

#[derive(Debug, Clone)]
pub struct TagBookmarkLocalSqliteRepository {
    db_manager: Arc<RwLock<DatabaseManager>>,
}

impl TagBookmarkLocalSqliteRepository {
    pub fn new(db_manager: Arc<RwLock<DatabaseManager>>) -> Self {
        Self { db_manager }
    }

    /// ブックマークを作成
    pub async fn create(&self, bookmark: &TagBookmark) -> Result<(), RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(RepositoryError::from)?;

        let active_model = bookmark
            .to_sqlite_model()
            .await
            .map_err(|e: String| RepositoryError::from(SQLiteError::ConversionError(e)))?;

        active_model
            .insert(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        Ok(())
    }

    /// ブックマークをIDで検索
    pub async fn find_by_id(
        &self,
        id: &TagBookmarkId,
    ) -> Result<Option<TagBookmark>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(RepositoryError::from)?;

        if let Some(model) = TagBookmarkEntity::find_by_id(id.to_string())
            .one(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?
        {
            let bookmark = model
                .to_domain_model()
                .await
                .map_err(|e: String| RepositoryError::from(SQLiteError::ConversionError(e)))?;
            Ok(Some(bookmark))
        } else {
            Ok(None)
        }
    }

    /// ユーザーIDとプロジェクトIDとタグIDでブックマークを検索
    pub async fn find_by_user_project_tag(
        &self,
        user_id: &UserId,
        project_id: &ProjectId,
        tag_id: &TagId,
    ) -> Result<Option<TagBookmark>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(RepositoryError::from)?;

        if let Some(model) = TagBookmarkEntity::find()
            .filter(Column::UserId.eq(user_id.to_string()))
            .filter(Column::ProjectId.eq(project_id.to_string()))
            .filter(Column::TagId.eq(tag_id.to_string()))
            .one(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?
        {
            let bookmark = model
                .to_domain_model()
                .await
                .map_err(|e: String| RepositoryError::from(SQLiteError::ConversionError(e)))?;
            Ok(Some(bookmark))
        } else {
            Ok(None)
        }
    }

    /// ユーザーIDとプロジェクトIDでブックマーク一覧を取得（order_indexでソート）
    pub async fn find_by_user_and_project(
        &self,
        user_id: &UserId,
        project_id: &ProjectId,
    ) -> Result<Vec<TagBookmark>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(RepositoryError::from)?;

        let models = TagBookmarkEntity::find()
            .filter(Column::UserId.eq(user_id.to_string()))
            .filter(Column::ProjectId.eq(project_id.to_string()))
            .order_by_asc(Column::OrderIndex)
            .all(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        let mut bookmarks = Vec::new();
        for model in models {
            let bookmark = model
                .to_domain_model()
                .await
                .map_err(|e: String| RepositoryError::from(SQLiteError::ConversionError(e)))?;
            bookmarks.push(bookmark);
        }

        Ok(bookmarks)
    }

    /// ユーザーIDで全ブックマークを取得（order_indexでソート）
    pub async fn find_by_user(
        &self,
        user_id: &UserId,
    ) -> Result<Vec<TagBookmark>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(RepositoryError::from)?;

        let models = TagBookmarkEntity::find()
            .filter(Column::UserId.eq(user_id.to_string()))
            .order_by_asc(Column::OrderIndex)
            .all(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        let mut bookmarks = Vec::new();
        for model in models {
            let bookmark = model
                .to_domain_model()
                .await
                .map_err(|e: String| RepositoryError::from(SQLiteError::ConversionError(e)))?;
            bookmarks.push(bookmark);
        }

        Ok(bookmarks)
    }

    /// プロジェクトIDとタグIDで全ブックマークを取得
    pub async fn find_by_project_and_tag(
        &self,
        project_id: &ProjectId,
        tag_id: &TagId,
    ) -> Result<Vec<TagBookmark>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(RepositoryError::from)?;

        let models = TagBookmarkEntity::find()
            .filter(Column::ProjectId.eq(project_id.to_string()))
            .filter(Column::TagId.eq(tag_id.to_string()))
            .all(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        let mut bookmarks = Vec::new();
        for model in models {
            let bookmark = model
                .to_domain_model()
                .await
                .map_err(|e: String| RepositoryError::from(SQLiteError::ConversionError(e)))?;
            bookmarks.push(bookmark);
        }

        Ok(bookmarks)
    }

    /// ブックマークを更新
    pub async fn update(&self, bookmark: &TagBookmark) -> Result<(), RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(RepositoryError::from)?;

        let existing = TagBookmarkEntity::find_by_id(bookmark.id.to_string())
            .one(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?
            .ok_or_else(|| {
                RepositoryError::NotFound(format!("TagBookmark not found: {}", bookmark.id))
            })?;

        let mut active_model: TagBookmarkActiveModel = existing.into();

        // 更新可能なフィールドのみを更新
        active_model.order_index = Set(bookmark.order_index);
        active_model.updated_at = Set(bookmark.updated_at);

        active_model
            .update(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        Ok(())
    }

    /// 複数のブックマークを一括更新（並び替え用）
    pub async fn update_bulk(&self, bookmarks: &[TagBookmark]) -> Result<(), RepositoryError> {
        for bookmark in bookmarks {
            self.update(bookmark).await?;
        }
        Ok(())
    }

    /// ブックマークを削除
    pub async fn delete(&self, id: &TagBookmarkId) -> Result<(), RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(RepositoryError::from)?;

        TagBookmarkEntity::delete_by_id(id.to_string())
            .exec(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        Ok(())
    }

    /// ユーザーとプロジェクトにおける最大order_indexを取得
    pub async fn get_max_order_index(
        &self,
        user_id: &UserId,
        project_id: &ProjectId,
    ) -> Result<i32, RepositoryError> {
        let bookmarks = self.find_by_user_and_project(user_id, project_id).await?;

        if bookmarks.is_empty() {
            Ok(-1) // 最初のブックマークはorder_index=0になるように
        } else {
            Ok(bookmarks.iter().map(|b| b.order_index).max().unwrap_or(-1))
        }
    }

    /// 指定タグに関連する全てのブックマークをトランザクション内で削除
    ///
    /// トランザクションは呼び出し側（Facade層）が管理します。
    pub async fn remove_all_by_tag_id_with_txn(
        &self,
        txn: &sea_orm::DatabaseTransaction,
        project_id: &ProjectId,
        tag_id: &TagId,
    ) -> Result<(), RepositoryError> {
        TagBookmarkEntity::delete_many()
            .filter(Column::ProjectId.eq(project_id.to_string()))
            .filter(Column::TagId.eq(tag_id.to_string()))
            .exec(txn)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        Ok(())
    }
}

impl Default for TagBookmarkLocalSqliteRepository {
    fn default() -> Self {
        // デフォルトではダミーのDatabaseManagerを使用
        // 実際の使用時は必ずnew()で適切なdb_managerを渡すこと
        // 注: DatabaseManagerはシングルトンなので、instance()を呼び出す必要があるが
        // Defaultトレイトでは非同期処理が使えないため、別のアプローチを取る

        // ダミーのDatabaseManagerを作成（実際には使用されないことを想定）
        // DatabaseManagerのnew_testメソッドがあればそれを使用、なければpanic
        // この実装は主にテスト用途を想定
        panic!("TagBookmarkLocalSqliteRepository::default() should not be called directly. Use new() with a proper DatabaseManager instead.")
    }
}
