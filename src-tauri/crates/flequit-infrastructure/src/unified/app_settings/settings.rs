//! 設定用統合リポジトリ

use async_trait::async_trait;
use flequit_repository::patchable_trait::Patchable;
use flequit_types::errors::repository_error::RepositoryError;
use flequit_repository::repositories::app_settings::settings_repository_trait::SettingsRepositoryTrait;
use flequit_repository::repositories::base_repository_trait::Repository;
use flequit_infrastructure_automerge::infrastructure::app_settings::settings::SettingsLocalAutomergeRepository;
use flequit_infrastructure_sqlite::infrastructure::app_settings::settings::SettingsLocalSqliteRepository;
use flequit_model::models::app_settings::settings::Settings;
use flequit_model::types::id_types::SettingsId;

#[derive(Debug)]
pub struct SettingsUnifiedRepository {
    save_repositories: Vec<SettingsRepositoryVariant>,
    search_repositories: Vec<SettingsRepositoryVariant>,
}

#[derive(Debug)]
enum SettingsRepositoryVariant {
    LocalSqlite(SettingsLocalSqliteRepository),
    LocalAutomerge(SettingsLocalAutomergeRepository),
}

impl Default for SettingsUnifiedRepository {
    fn default() -> Self {
        Self::new(vec![], vec![])
    }
}

impl SettingsUnifiedRepository {
    pub fn new(save_repositories: Vec<SettingsRepositoryVariant>, search_repositories: Vec<SettingsRepositoryVariant>) -> Self {
        Self { save_repositories, search_repositories }
    }
}

#[async_trait]
impl Repository<Settings, SettingsId> for SettingsUnifiedRepository {
    async fn save(&self, entity: &Settings) -> Result<(), RepositoryError> { Ok(()) }
    async fn find_by_id(&self, id: &SettingsId) -> Result<Option<Settings>, RepositoryError> { Ok(None) }
    async fn find_all(&self) -> Result<Vec<Settings>, RepositoryError> { Ok(vec![]) }
    async fn delete(&self, id: &SettingsId) -> Result<(), RepositoryError> { Ok(()) }
    async fn exists(&self, id: &SettingsId) -> Result<bool, RepositoryError> { Ok(false) }
    async fn count(&self) -> Result<u64, RepositoryError> { Ok(0) }
}

impl SettingsRepositoryTrait for SettingsUnifiedRepository {
    #[doc = " すべての設定をSettings構造体として取得します。"]
    #[must_use]
    #[allow(elided_named_lifetimes,clippy::type_complexity,clippy::type_repetition_in_bounds)]
    fn get_settings<'life0,'async_trait>(&'life0 self) ->  ::core::pin::Pin<Box<dyn ::core::future::Future<Output = Result<Option<Settings> ,RepositoryError> > + ::core::marker::Send+'async_trait> >where 'life0:'async_trait,Self:'async_trait {
        todo!()
    }
}

#[async_trait]
impl Patchable<Settings, SettingsId> for SettingsUnifiedRepository {}
