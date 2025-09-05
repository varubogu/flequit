use flequit_types::errors::repository_error::RepositoryError;
use async_trait::async_trait;
use partially::Partial;
use super::base_repository_trait::Repository;

/// パッチ更新可能なリポジトリトレイト
///
/// Repository traitにパッチ更新機能を追加。
/// ジェネリック型パラメータが含まれるためdyn compatibilityを考慮して分離。
///
/// # 型パラメータ
///
/// * `T` - 管理するエンティティの型
/// * `TId` - エンティティのID型
///
/// # 使用例
///
/// ```rust,no_run
/// # use async_trait::async_trait;
/// # use flequit_repository::repositories::{repository_trait::Repository, patchable_trait::Patchable};
/// # use flequit_types::errors::repository_error::RepositoryError;
/// # use partially::Partial;
/// # struct Project;
/// # struct ProjectId;
/// # struct ProjectPatch;
/// # struct LocalSqliteProjectRepository;
/// impl Patchable<Project, ProjectId> for LocalSqliteProjectRepository {}
/// ```
#[async_trait]
pub trait Patchable<T, TId>: Repository<T, TId>
where
    T: Send + Sync,
    TId: Send + Sync,
{
    /// パッチによる部分更新
    ///
    /// 指定されたIDのエンティティに対して、パッチで指定された
    /// フィールドのみを更新する。内部では find_by_id → apply_some → save を実行。
    ///
    /// # 引数
    ///
    /// * `id` - 更新するエンティティのID
    /// * `patch` - 更新するフィールド情報
    ///
    /// # 戻り値
    ///
    /// 実際に変更が発生した場合は`Ok(true)`、
    /// 変更がなかった場合は`Ok(false)`、
    /// エンティティが存在しない場合は`Ok(false)`、
    /// エラー時は`Err(RepositoryError)`
    async fn patch<P>(&self, id: &TId, patch: &P) -> Result<bool, RepositoryError>
    where
        P: Send + Sync + Clone,
        T: Partial<Item = P> + Clone,
    {
        if let Some(mut entity) = self.find_by_id(id).await? {
            let changed = entity.apply_some(patch.clone());
            if changed {
                self.save(&entity).await?;
            }
            Ok(changed)
        } else {
            Ok(false)
        }
    }
}
