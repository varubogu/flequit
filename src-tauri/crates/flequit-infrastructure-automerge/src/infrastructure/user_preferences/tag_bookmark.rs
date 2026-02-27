//! TagBookmark用Automergeリポジトリ

use crate::infrastructure::document_manager::{DocumentManager, DocumentType};
use flequit_model::models::user_preferences::tag_bookmark::TagBookmark;
use flequit_model::types::id_types::{ProjectId, TagId, UserId};
use flequit_types::errors::repository_error::RepositoryError;
use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::Mutex;

/// Automerge実装のタグブックマークリポジトリ
///
/// ユーザー設定としてタグブックマークを管理します。
/// DocumentType::Userを使用して、Userドキュメント内の
/// `user_preferences/tag_bookmarks/{project_id}/{tag_id}`パスに保存します。
#[derive(Debug, Clone)]
pub struct TagBookmarkLocalAutomergeRepository {
    document_manager: Arc<Mutex<DocumentManager>>,
}

impl TagBookmarkLocalAutomergeRepository {
    pub async fn new(base_path: PathBuf) -> Result<Self, RepositoryError> {
        let document_manager = DocumentManager::new(base_path)?;
        Ok(Self {
            document_manager: Arc::new(Mutex::new(document_manager)),
        })
    }

    /// 共有DocumentManagerを使用して新しいインスタンスを作成
    pub async fn new_with_manager(
        document_manager: Arc<Mutex<DocumentManager>>,
    ) -> Result<Self, RepositoryError> {
        Ok(Self { document_manager })
    }

    /// Automergeドキュメント内のパスを生成
    /// パス: user_preferences/{user_id}/tag_bookmarks/{project_id}/{tag_id}
    fn get_bookmark_path(user_id: &UserId, project_id: &ProjectId, tag_id: &TagId) -> Vec<String> {
        vec![
            "user_preferences".to_string(),
            user_id.to_string(),
            "tag_bookmarks".to_string(),
            project_id.to_string(),
            tag_id.to_string(),
        ]
    }

    /// プロジェクト内の全ブックマークのパスを取得
    fn get_project_bookmarks_path(user_id: &UserId, project_id: &ProjectId) -> Vec<String> {
        vec![
            "user_preferences".to_string(),
            user_id.to_string(),
            "tag_bookmarks".to_string(),
            project_id.to_string(),
        ]
    }

    /// ユーザーの全ブックマークのパスを取得
    fn get_user_bookmarks_path(user_id: &UserId) -> Vec<String> {
        vec![
            "user_preferences".to_string(),
            user_id.to_string(),
            "tag_bookmarks".to_string(),
        ]
    }

    /// ブックマークを作成
    pub async fn create(&self, bookmark: &TagBookmark) -> Result<(), RepositoryError> {
        let path =
            Self::get_bookmark_path(&bookmark.user_id, &bookmark.project_id, &bookmark.tag_id);
        let path_refs: Vec<&str> = path.iter().map(|s| s.as_str()).collect();

        let mut manager = self.document_manager.lock().await;
        manager
            .save_data_at_nested_path(&DocumentType::User, &path_refs, bookmark)
            .await
            .map_err(|e| RepositoryError::AutomergeError(e.to_string()))
    }

    /// ブックマークをIDで検索
    pub async fn find_by_id(
        &self,
        user_id: &UserId,
        project_id: &ProjectId,
        tag_id: &TagId,
    ) -> Result<Option<TagBookmark>, RepositoryError> {
        let path = Self::get_bookmark_path(user_id, project_id, tag_id);
        let path_refs: Vec<&str> = path.iter().map(|s| s.as_str()).collect();

        let mut manager = self.document_manager.lock().await;
        manager
            .load_data_at_nested_path::<TagBookmark>(&DocumentType::User, &path_refs)
            .await
            .map_err(|e| RepositoryError::AutomergeError(e.to_string()))
    }

    /// ユーザーとプロジェクトでブックマーク一覧を取得
    pub async fn find_by_user_and_project(
        &self,
        user_id: &UserId,
        project_id: &ProjectId,
    ) -> Result<Vec<TagBookmark>, RepositoryError> {
        let path = Self::get_project_bookmarks_path(user_id, project_id);
        let path_refs: Vec<&str> = path.iter().map(|s| s.as_str()).collect();

        let mut manager = self.document_manager.lock().await;

        // プロジェクトのブックマークMapを取得
        let bookmarks_map: Option<std::collections::HashMap<String, TagBookmark>> = manager
            .load_data_at_nested_path(&DocumentType::User, &path_refs)
            .await
            .map_err(|e| RepositoryError::AutomergeError(e.to_string()))?;

        if let Some(map) = bookmarks_map {
            let mut bookmarks: Vec<TagBookmark> = map.into_values().collect();
            // order_indexでソート
            bookmarks.sort_by(|a, b| a.order_index.cmp(&b.order_index));
            Ok(bookmarks)
        } else {
            Ok(Vec::new())
        }
    }

    /// ユーザーの全ブックマークを取得
    pub async fn find_by_user(
        &self,
        user_id: &UserId,
    ) -> Result<Vec<TagBookmark>, RepositoryError> {
        let path = Self::get_user_bookmarks_path(user_id);
        let path_refs: Vec<&str> = path.iter().map(|s| s.as_str()).collect();

        let mut manager = self.document_manager.lock().await;

        // 全プロジェクトのブックマークMapを取得
        let projects_map: Option<
            std::collections::HashMap<String, std::collections::HashMap<String, TagBookmark>>,
        > = manager
            .load_data_at_nested_path(&DocumentType::User, &path_refs)
            .await
            .map_err(|e| RepositoryError::AutomergeError(e.to_string()))?;

        if let Some(projects) = projects_map {
            let mut all_bookmarks = Vec::new();
            for (_project_id, bookmarks_map) in projects {
                all_bookmarks.extend(bookmarks_map.into_values());
            }
            // order_indexでソート
            all_bookmarks.sort_by(|a, b| a.order_index.cmp(&b.order_index));
            Ok(all_bookmarks)
        } else {
            Ok(Vec::new())
        }
    }

    /// ブックマークを更新
    pub async fn update(&self, bookmark: &TagBookmark) -> Result<(), RepositoryError> {
        // Automergeでは作成と更新は同じ操作
        self.create(bookmark).await
    }

    /// ブックマークを削除
    pub async fn delete(
        &self,
        user_id: &UserId,
        project_id: &ProjectId,
        tag_id: &TagId,
    ) -> Result<(), RepositoryError> {
        let path = Self::get_bookmark_path(user_id, project_id, tag_id);
        let path_refs: Vec<&str> = path.iter().map(|s| s.as_str()).collect();

        let mut manager = self.document_manager.lock().await;

        // nullを保存することで削除を表現
        manager
            .save_data_at_nested_path::<Option<TagBookmark>>(&DocumentType::User, &path_refs, &None)
            .await
            .map_err(|e| RepositoryError::AutomergeError(e.to_string()))
    }

    /// 最大order_indexを取得
    pub async fn get_max_order_index(
        &self,
        user_id: &UserId,
        project_id: &ProjectId,
    ) -> Result<i32, RepositoryError> {
        let bookmarks = self.find_by_user_and_project(user_id, project_id).await?;

        if bookmarks.is_empty() {
            Ok(-1)
        } else {
            Ok(bookmarks.iter().map(|b| b.order_index).max().unwrap_or(-1))
        }
    }
}

impl Default for TagBookmarkLocalAutomergeRepository {
    fn default() -> Self {
        // デフォルトでは空のDocumentManagerを使用
        // 実際の使用時は必ずnew()またはnew_with_manager()で適切なdocument_managerを渡すこと
        use std::env;

        let temp_path = env::temp_dir().join("flequit_automerge_default");
        let document_manager = DocumentManager::new(temp_path)
            .unwrap_or_else(|_| panic!("Failed to create default DocumentManager"));

        Self {
            document_manager: Arc::new(Mutex::new(document_manager)),
        }
    }
}
