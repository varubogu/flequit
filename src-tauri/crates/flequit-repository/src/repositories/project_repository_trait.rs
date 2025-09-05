use async_trait::async_trait;
use flequit_model::types::id_types::ProjectId;
use flequit_types::errors::repository_error::RepositoryError;

/// プロジェクト単位でデータ管理するリポジトリのベーストレイト
///
/// task_projectsフォルダ内の全エンティティに適用される。
/// 各エンティティはプロジェクトIDでスコープされ、プロジェクト内でのみ操作される。
#[async_trait]
pub trait ProjectRepository<T: Send + Sync, ID: Send + Sync>: Send + Sync {
    /// エンティティを保存（プロジェクトスコープ内）
    async fn save(&self, project_id: &ProjectId, entity: &T) -> Result<(), RepositoryError>;

    /// IDでエンティティを検索（プロジェクトスコープ内）
    async fn find_by_id(&self, project_id: &ProjectId, id: &ID) -> Result<Option<T>, RepositoryError>;

    /// プロジェクト内の全エンティティを取得
    async fn find_all(&self, project_id: &ProjectId) -> Result<Vec<T>, RepositoryError>;

    /// エンティティを削除（プロジェクトスコープ内）
    async fn delete(&self, project_id: &ProjectId, id: &ID) -> Result<(), RepositoryError>;

    /// エンティティが存在するかチェック（プロジェクトスコープ内）
    async fn exists(&self, project_id: &ProjectId, id: &ID) -> Result<bool, RepositoryError>;

    /// プロジェクト内のエンティティ数を取得
    async fn count(&self, project_id: &ProjectId) -> Result<u64, RepositoryError>;

    /// プロジェクト内のエンティティを複数保存
    async fn save_all(&self, project_id: &ProjectId, entities: &[T]) -> Result<(), RepositoryError> {
        for entity in entities {
            self.save(project_id, entity).await?;
        }
        Ok(())
    }
}
