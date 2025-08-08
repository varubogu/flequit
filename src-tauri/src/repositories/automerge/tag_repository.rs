use crate::errors::RepositoryError;
use crate::types::user_types::Tag;
use crate::repositories::automerge::{SqliteStorage, AutomergeStorage};

pub struct TagRepository {
    sqlite_storage: SqliteStorage,
    automerge_storage: AutomergeStorage,
}

impl TagRepository {
    pub fn new(sqlite_storage: SqliteStorage, automerge_storage: AutomergeStorage) -> Self {
        Self {
            sqlite_storage,
            automerge_storage,
        }
    }

    // グローバルタグ操作（レベル1: ルート直下）
    pub async fn set_tag(&self, tag: &Tag) -> Result<(), RepositoryError> {
        let tag_id = &tag.id;
        todo!("Implementation pending - global_document/global_tags/{tag_id} 更新")
    }

    pub async fn get_tag(&self, tag_id: &str) -> Result<Option<Tag>, RepositoryError> {
        todo!("Implementation pending - SQLite優先で読み込み")
    }

    pub async fn list_tags(&self) -> Result<Vec<Tag>, RepositoryError> {
        todo!("Implementation pending - SQLiteから全グローバルタグ取得")
    }

    pub async fn delete_tag(&self, tag_id: &str) -> Result<(), RepositoryError> {
        todo!("Implementation pending - 論理削除のみ")
    }

    // 検索・フィルタリング
    pub async fn find_tags_by_name(&self, name_pattern: &str) -> Result<Vec<Tag>, RepositoryError> {
        todo!("Implementation pending - 部分一致検索")
    }

    pub async fn find_tags_by_color(&self, color: &str) -> Result<Vec<Tag>, RepositoryError> {
        todo!("Implementation pending - 色指定でフィルタ")
    }

    // タグ使用状況（統計情報）
    pub async fn get_tag_usage_count(&self, tag_id: &str) -> Result<u32, RepositoryError> {
        todo!("Implementation pending - このタグを使用するタスク数を取得")
    }

    pub async fn get_tags_with_usage_count(&self) -> Result<Vec<(Tag, u32)>, RepositoryError> {
        todo!("Implementation pending - 全タグと使用回数のタプル")
    }

    pub async fn get_popular_tags(&self, limit: u32) -> Result<Vec<(Tag, u32)>, RepositoryError> {
        todo!("Implementation pending - 使用回数上位のタグ取得")
    }

    pub async fn get_unused_tags(&self) -> Result<Vec<Tag>, RepositoryError> {
        todo!("Implementation pending - 使用回数0のタグ取得")
    }

    // データ整合性チェック
    pub async fn validate_tag_exists(&self, tag_id: &str) -> Result<bool, RepositoryError> {
        todo!("Implementation pending")
    }

    pub async fn is_tag_name_unique(&self, name: &str, exclude_id: Option<&str>) -> Result<bool, RepositoryError> {
        todo!("Implementation pending - タグ名の重複チェック")
    }

    pub async fn can_delete_tag(&self, tag_id: &str) -> Result<bool, RepositoryError> {
        let usage_count = self.get_tag_usage_count(tag_id).await?;
        Ok(usage_count == 0)
    }

    // 統計情報
    pub async fn get_tag_count(&self) -> Result<u64, RepositoryError> {
        todo!("Implementation pending")
    }

    pub async fn get_color_distribution(&self) -> Result<Vec<(Option<String>, u32)>, RepositoryError> {
        todo!("Implementation pending - 色ごとのタグ数統計")
    }
}
