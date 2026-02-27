use super::project_repository_trait::ProjectRepository;
use async_trait::async_trait;
use chrono::{DateTime, Utc};
use flequit_model::types::id_types::{ProjectId, UserId};
use flequit_types::errors::repository_error::RepositoryError;
use partially::Partial;

/// プロジェクトスコープでパッチ更新可能なリポジトリトレイト
///
/// ProjectRepository traitにパッチ更新機能を追加。
/// プロジェクトIDでスコープされたエンティティに対する部分更新を提供する。
///
/// # 型パラメータ
///
/// * `T` - 管理するエンティティの型
/// * `TId` - エンティティのID型
///
/// # 使用例
///
/// ```rust,no_run
/// # use flequit_model::types::id_types::ProjectId;
/// # struct Task;
/// # use flequit_repository::repositories::project_patchable_trait::ProjectPatchable;
/// fn assert_project_patchable<R, TId>()
/// where
///     TId: Send + Sync + std::fmt::Debug,
///     R: ProjectPatchable<Task, TId>,
/// {
///     let _ = ProjectId::new();
/// }
/// ```
#[async_trait]
pub trait ProjectPatchable<T, TId>: ProjectRepository<T, TId>
where
    T: Send + Sync,
    TId: Send + Sync + std::fmt::Debug,
{
    /// プロジェクトスコープでのパッチによる部分更新
    ///
    /// 指定されたプロジェクト内の指定されたIDのエンティティに対して、
    /// パッチで指定されたフィールドのみを更新する。
    /// 内部では find_by_id → apply_some → save を実行。
    ///
    /// # 引数
    ///
    /// * `project_id` - プロジェクトID
    /// * `id` - 更新するエンティティのID
    /// * `patch` - 更新するフィールド情報
    ///
    /// # 戻り値
    ///
    /// 実際に変更が発生した場合は`Ok(true)`、
    /// 変更がなかった場合は`Ok(false)`、
    /// エンティティが存在しない場合は`Ok(false)`、
    /// エラー時は`Err(RepositoryError)`
    async fn patch<P>(
        &self,
        project_id: &ProjectId,
        id: &TId,
        patch: &P,
        user_id: &UserId,
        timestamp: &DateTime<Utc>,
    ) -> Result<bool, RepositoryError>
    where
        P: Send + Sync + Clone,
        T: Partial<Item = P> + Clone,
    {
        if let Some(mut entity) = self.find_by_id(project_id, id).await? {
            let changed = entity.apply_some(patch.clone());
            if changed {
                self.save(project_id, &entity, user_id, timestamp).await?;
            }
            Ok(changed)
        } else {
            Ok(false)
        }
    }

    /// プロジェクトスコープでの複数エンティティの一括パッチ更新
    ///
    /// 指定されたプロジェクト内の複数のエンティティに対して、
    /// 同じパッチを適用する。
    ///
    /// # 引数
    ///
    /// * `project_id` - プロジェクトID
    /// * `ids` - 更新するエンティティのIDリスト
    /// * `patch` - 更新するフィールド情報
    ///
    /// # 戻り値
    ///
    /// 実際に変更が発生したエンティティの数、
    /// エラー時は`Err(RepositoryError)`
    async fn patch_many<P>(
        &self,
        project_id: &ProjectId,
        ids: &[TId],
        patch: &P,
        user_id: &UserId,
        timestamp: &DateTime<Utc>,
    ) -> Result<u64, RepositoryError>
    where
        P: Send + Sync + Clone,
        T: Partial<Item = P> + Clone,
        TId: Clone,
    {
        let mut changed_count = 0;
        for id in ids {
            if self
                .patch(project_id, id, patch, user_id, timestamp)
                .await?
            {
                changed_count += 1;
            }
        }
        Ok(changed_count)
    }
}
