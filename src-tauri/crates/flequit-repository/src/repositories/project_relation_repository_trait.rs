use async_trait::async_trait;
use flequit_model::types::id_types::ProjectId;
use flequit_types::errors::repository_error::RepositoryError;

/// プロジェクト単位でリレーションデータ管理するリポジトリのベーストレイト
///
/// task_projectsフォルダ内のリレーション系エンティティ（TaskAssignment、TaskTag等）に適用される。
/// 各リレーションはプロジェクトIDでスコープされ、プロジェクト内でのみ操作される。
///
/// # 型パラメータ
/// 
/// * `TRelation` - リレーションエンティティの型（TaskAssignment、TaskTag等）
/// * `TParentId` - 親エンティティのID型（TaskId等）  
/// * `TChildId` - 子エンティティのID型（UserId、TagId等）
#[async_trait]
pub trait ProjectRelationRepository<TRelation, TParentId, TChildId>: Send + Sync
where
    TRelation: Send + Sync,
    TParentId: Send + Sync,
    TChildId: Send + Sync,
{
    /// プロジェクト内でリレーションを追加
    ///
    /// # 引数
    ///
    /// * `project_id` - プロジェクトID
    /// * `parent_id` - 親エンティティのID
    /// * `child_id` - 子エンティティのID
    ///
    /// # 戻り値
    ///
    /// 成功時は`Ok(())`、失敗時は`Err(RepositoryError)`
    async fn add(&self, project_id: &ProjectId, parent_id: &TParentId, child_id: &TChildId) -> Result<(), RepositoryError>;

    /// プロジェクト内でリレーションを削除
    ///
    /// # 引数
    ///
    /// * `project_id` - プロジェクトID
    /// * `parent_id` - 親エンティティのID
    /// * `child_id` - 子エンティティのID
    ///
    /// # 戻り値
    ///
    /// 成功時は`Ok(())`、失敗時は`Err(RepositoryError)`
    async fn remove(&self, project_id: &ProjectId, parent_id: &TParentId, child_id: &TChildId) -> Result<(), RepositoryError>;

    /// プロジェクト内で親エンティティに関連する全リレーションを削除
    ///
    /// # 引数
    ///
    /// * `project_id` - プロジェクトID
    /// * `parent_id` - 親エンティティのID
    ///
    /// # 戻り値
    ///
    /// 成功時は`Ok(())`、失敗時は`Err(RepositoryError)`
    async fn remove_all(&self, project_id: &ProjectId, parent_id: &TParentId) -> Result<(), RepositoryError>;

    /// プロジェクト内で親エンティティのリレーション一覧を取得
    ///
    /// # 引数
    ///
    /// * `project_id` - プロジェクトID
    /// * `parent_id` - 親エンティティのID
    ///
    /// # 戻り値
    ///
    /// リレーションのベクター、失敗時は`Err(RepositoryError)`
    async fn find_relations(&self, project_id: &ProjectId, parent_id: &TParentId) -> Result<Vec<TRelation>, RepositoryError>;

    /// プロジェクト内でリレーションが存在するかチェック
    ///
    /// # 引数
    ///
    /// * `project_id` - プロジェクトID
    /// * `parent_id` - 親エンティティのID
    ///
    /// # 戻り値
    ///
    /// 存在する場合は`Ok(true)`、存在しない場合は`Ok(false)`、
    /// エラー時は`Err(RepositoryError)`
    async fn exists(&self, project_id: &ProjectId, parent_id: &TParentId) -> Result<bool, RepositoryError>;

    /// プロジェクト内で親エンティティのリレーション数を取得
    ///
    /// # 引数
    ///
    /// * `project_id` - プロジェクトID
    /// * `parent_id` - 親エンティティのID
    ///
    /// # 戻り値
    ///
    /// リレーション数、失敗時は`Err(RepositoryError)`
    async fn count(&self, project_id: &ProjectId, parent_id: &TParentId) -> Result<u64, RepositoryError>;

    /// プロジェクト内の全リレーション一覧を取得
    ///
    /// # 引数
    ///
    /// * `project_id` - プロジェクトID
    ///
    /// # 戻り値
    ///
    /// 全リレーションのベクター、失敗時は`Err(RepositoryError)`
    async fn find_all(&self, project_id: &ProjectId) -> Result<Vec<TRelation>, RepositoryError>;

    /// プロジェクト内の特定のリレーションを検索
    ///
    /// # 引数
    ///
    /// * `project_id` - プロジェクトID
    /// * `parent_id` - 親エンティティのID
    /// * `child_id` - 子エンティティのID
    ///
    /// # 戻り値
    ///
    /// リレーションが存在する場合は`Ok(Some(TRelation))`、
    /// 存在しない場合は`Ok(None)`、
    /// エラー時は`Err(RepositoryError)`
    async fn find_relation(&self, project_id: &ProjectId, parent_id: &TParentId, child_id: &TChildId) -> Result<Option<TRelation>, RepositoryError>;

    /// プロジェクト内で複数の親エンティティのリレーション一覧を一括取得
    ///
    /// # 引数
    ///
    /// * `project_id` - プロジェクトID
    /// * `parent_ids` - 親エンティティのIDリスト
    ///
    /// # 戻り値
    ///
    /// リレーションのベクター、失敗時は`Err(RepositoryError)`
    async fn find_relations_by_parents(&self, project_id: &ProjectId, parent_ids: &[TParentId]) -> Result<Vec<TRelation>, RepositoryError>
    where
        TParentId: Clone,
    {
        let mut results = Vec::new();
        for parent_id in parent_ids {
            let relations = self.find_relations(project_id, parent_id).await?;
            results.extend(relations);
        }
        Ok(results)
    }

    /// プロジェクト内で複数のリレーションを一括追加
    ///
    /// # 引数
    ///
    /// * `project_id` - プロジェクトID
    /// * `relations` - 親子IDのペアリスト
    ///
    /// # 戻り値
    ///
    /// 成功時は`Ok(())`、失敗時は`Err(RepositoryError)`
    async fn add_all(&self, project_id: &ProjectId, relations: &[(TParentId, TChildId)]) -> Result<(), RepositoryError>
    where
        TParentId: Clone,
        TChildId: Clone,
    {
        for (parent_id, child_id) in relations {
            self.add(project_id, parent_id, child_id).await?;
        }
        Ok(())
    }
}