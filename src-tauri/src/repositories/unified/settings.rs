//! Settings統合リポジトリ
use crate::errors::repository_error::RepositoryError;
use crate::models::setting::{CustomDateFormat, TimeLabel, ViewItem};
use crate::repositories::local_automerge::settings::SettingsLocalAutomergeRepository;
use crate::repositories::local_sqlite::settings::SettingsLocalSqliteRepository;
use crate::repositories::setting_repository_trait::SettingRepositoryTrait;
use async_trait::async_trait;
use std::collections::HashMap;

/// Settings用のリポジトリvariant（静的ディスパッチ用）
#[derive(Debug, Clone)]
pub enum SettingsRepositoryVariant {
    Sqlite(SettingsLocalSqliteRepository),
    Automerge(SettingsLocalAutomergeRepository),
}

#[async_trait]
impl SettingRepositoryTrait for SettingsRepositoryVariant {
    async fn get_setting(&self, key: &str) -> Result<Option<String>, RepositoryError> {
        match self {
            Self::Sqlite(repo) => repo.get_setting(key).await,
            Self::Automerge(repo) => repo.get_setting(key).await,
        }
    }

    async fn set_setting(&self, key: &str, value: &str) -> Result<(), RepositoryError> {
        match self {
            Self::Sqlite(repo) => repo.set_setting(key, value).await,
            Self::Automerge(repo) => repo.set_setting(key, value).await,
        }
    }

    async fn get_all_key_value_settings(&self) -> Result<HashMap<String, String>, RepositoryError> {
        match self {
            Self::Sqlite(repo) => repo.get_all_key_value_settings().await,
            Self::Automerge(repo) => repo.get_all_key_value_settings().await,
        }
    }

    async fn get_custom_date_format(
        &self,
        id: &str,
    ) -> Result<Option<CustomDateFormat>, RepositoryError> {
        match self {
            Self::Sqlite(repo) => repo.get_custom_date_format(id).await,
            Self::Automerge(repo) => repo.get_custom_date_format(id).await,
        }
    }

    async fn get_all_custom_date_formats(&self) -> Result<Vec<CustomDateFormat>, RepositoryError> {
        match self {
            Self::Sqlite(repo) => repo.get_all_custom_date_formats().await,
            Self::Automerge(repo) => repo.get_all_custom_date_formats().await,
        }
    }

    async fn add_custom_date_format(
        &self,
        format: &CustomDateFormat,
    ) -> Result<(), RepositoryError> {
        match self {
            Self::Sqlite(repo) => repo.add_custom_date_format(format).await,
            Self::Automerge(repo) => repo.add_custom_date_format(format).await,
        }
    }

    async fn update_custom_date_format(
        &self,
        format: &CustomDateFormat,
    ) -> Result<(), RepositoryError> {
        match self {
            Self::Sqlite(repo) => repo.update_custom_date_format(format).await,
            Self::Automerge(repo) => repo.update_custom_date_format(format).await,
        }
    }

    async fn delete_custom_date_format(&self, id: &str) -> Result<(), RepositoryError> {
        match self {
            Self::Sqlite(repo) => repo.delete_custom_date_format(id).await,
            Self::Automerge(repo) => repo.delete_custom_date_format(id).await,
        }
    }

    async fn get_time_label(&self, id: &str) -> Result<Option<TimeLabel>, RepositoryError> {
        match self {
            Self::Sqlite(repo) => repo.get_time_label(id).await,
            Self::Automerge(repo) => repo.get_time_label(id).await,
        }
    }

    async fn get_all_time_labels(&self) -> Result<Vec<TimeLabel>, RepositoryError> {
        match self {
            Self::Sqlite(repo) => repo.get_all_time_labels().await,
            Self::Automerge(repo) => repo.get_all_time_labels().await,
        }
    }

    async fn add_time_label(&self, label: &TimeLabel) -> Result<(), RepositoryError> {
        match self {
            Self::Sqlite(repo) => repo.add_time_label(label).await,
            Self::Automerge(repo) => repo.add_time_label(label).await,
        }
    }

    async fn update_time_label(&self, label: &TimeLabel) -> Result<(), RepositoryError> {
        match self {
            Self::Sqlite(repo) => repo.update_time_label(label).await,
            Self::Automerge(repo) => repo.update_time_label(label).await,
        }
    }

    async fn delete_time_label(&self, id: &str) -> Result<(), RepositoryError> {
        match self {
            Self::Sqlite(repo) => repo.delete_time_label(id).await,
            Self::Automerge(repo) => repo.delete_time_label(id).await,
        }
    }

    async fn get_view_item(&self, id: &str) -> Result<Option<ViewItem>, RepositoryError> {
        match self {
            Self::Sqlite(repo) => repo.get_view_item(id).await,
            Self::Automerge(repo) => repo.get_view_item(id).await,
        }
    }

    async fn get_all_view_items(&self) -> Result<Vec<ViewItem>, RepositoryError> {
        match self {
            Self::Sqlite(repo) => repo.get_all_view_items().await,
            Self::Automerge(repo) => repo.get_all_view_items().await,
        }
    }

    async fn add_view_item(&self, item: &ViewItem) -> Result<(), RepositoryError> {
        match self {
            Self::Sqlite(repo) => repo.add_view_item(item).await,
            Self::Automerge(repo) => repo.add_view_item(item).await,
        }
    }

    async fn update_view_item(&self, item: &ViewItem) -> Result<(), RepositoryError> {
        match self {
            Self::Sqlite(repo) => repo.update_view_item(item).await,
            Self::Automerge(repo) => repo.update_view_item(item).await,
        }
    }

    async fn delete_view_item(&self, id: &str) -> Result<(), RepositoryError> {
        match self {
            Self::Sqlite(repo) => repo.delete_view_item(id).await,
            Self::Automerge(repo) => repo.delete_view_item(id).await,
        }
    }
}

/// Settings統合リポジトリ
#[derive(Default)]
pub struct SettingsUnifiedRepository {
    save_repositories: Vec<SettingsRepositoryVariant>,
    search_repositories: Vec<SettingsRepositoryVariant>,
}

impl SettingsUnifiedRepository {
    pub fn new(
        save_repositories: Vec<SettingsRepositoryVariant>,
        search_repositories: Vec<SettingsRepositoryVariant>,
    ) -> Self {
        Self {
            save_repositories,
            search_repositories,
        }
    }
    // `project.rs` に倣ったヘルパーメソッド群
    pub fn add_sqlite_for_save(&mut self, sqlite_repo: SettingsLocalSqliteRepository) {
        self.save_repositories
            .push(SettingsRepositoryVariant::Sqlite(sqlite_repo));
    }
    pub fn add_sqlite_for_search(&mut self, sqlite_repo: SettingsLocalSqliteRepository) {
        self.search_repositories
            .push(SettingsRepositoryVariant::Sqlite(sqlite_repo));
    }
    pub fn add_automerge_for_save(&mut self, automerge_repo: SettingsLocalAutomergeRepository) {
        self.save_repositories
            .push(SettingsRepositoryVariant::Automerge(automerge_repo));
    }
}

#[async_trait]
impl SettingRepositoryTrait for SettingsUnifiedRepository {
    async fn get_setting(&self, key: &str) -> Result<Option<String>, RepositoryError> {
        if let Some(repo) = self.search_repositories.first() {
            repo.get_setting(key).await
        } else {
            Ok(None)
        }
    }

    async fn set_setting(&self, key: &str, value: &str) -> Result<(), RepositoryError> {
        for repo in &self.save_repositories {
            repo.set_setting(key, value).await?;
        }
        Ok(())
    }

    async fn get_all_key_value_settings(&self) -> Result<HashMap<String, String>, RepositoryError> {
        if let Some(repo) = self.search_repositories.first() {
            repo.get_all_key_value_settings().await
        } else {
            Ok(HashMap::new())
        }
    }

    async fn get_custom_date_format(
        &self,
        id: &str,
    ) -> Result<Option<CustomDateFormat>, RepositoryError> {
        if let Some(repo) = self.search_repositories.first() {
            repo.get_custom_date_format(id).await
        } else {
            Ok(None)
        }
    }

    async fn get_all_custom_date_formats(&self) -> Result<Vec<CustomDateFormat>, RepositoryError> {
        if let Some(repo) = self.search_repositories.first() {
            repo.get_all_custom_date_formats().await
        } else {
            Ok(vec![])
        }
    }

    async fn add_custom_date_format(
        &self,
        format: &CustomDateFormat,
    ) -> Result<(), RepositoryError> {
        for repo in &self.save_repositories {
            repo.add_custom_date_format(format).await?;
        }
        Ok(())
    }

    async fn update_custom_date_format(
        &self,
        format: &CustomDateFormat,
    ) -> Result<(), RepositoryError> {
        for repo in &self.save_repositories {
            repo.update_custom_date_format(format).await?;
        }
        Ok(())
    }

    async fn delete_custom_date_format(&self, id: &str) -> Result<(), RepositoryError> {
        for repo in &self.save_repositories {
            repo.delete_custom_date_format(id).await?;
        }
        Ok(())
    }

    async fn get_time_label(&self, id: &str) -> Result<Option<TimeLabel>, RepositoryError> {
        if let Some(repo) = self.search_repositories.first() {
            repo.get_time_label(id).await
        } else {
            Ok(None)
        }
    }

    async fn get_all_time_labels(&self) -> Result<Vec<TimeLabel>, RepositoryError> {
        if let Some(repo) = self.search_repositories.first() {
            repo.get_all_time_labels().await
        } else {
            Ok(vec![])
        }
    }

    async fn add_time_label(&self, label: &TimeLabel) -> Result<(), RepositoryError> {
        for repo in &self.save_repositories {
            repo.add_time_label(label).await?;
        }
        Ok(())
    }

    async fn update_time_label(&self, label: &TimeLabel) -> Result<(), RepositoryError> {
        for repo in &self.save_repositories {
            repo.update_time_label(label).await?;
        }
        Ok(())
    }

    async fn delete_time_label(&self, id: &str) -> Result<(), RepositoryError> {
        for repo in &self.save_repositories {
            repo.delete_time_label(id).await?;
        }
        Ok(())
    }

    async fn get_view_item(&self, id: &str) -> Result<Option<ViewItem>, RepositoryError> {
        if let Some(repo) = self.search_repositories.first() {
            repo.get_view_item(id).await
        } else {
            Ok(None)
        }
    }

    async fn get_all_view_items(&self) -> Result<Vec<ViewItem>, RepositoryError> {
        if let Some(repo) = self.search_repositories.first() {
            repo.get_all_view_items().await
        } else {
            Ok(vec![])
        }
    }

    async fn add_view_item(&self, item: &ViewItem) -> Result<(), RepositoryError> {
        for repo in &self.save_repositories {
            repo.add_view_item(item).await?;
        }
        Ok(())
    }

    async fn update_view_item(&self, item: &ViewItem) -> Result<(), RepositoryError> {
        for repo in &self.save_repositories {
            repo.update_view_item(item).await?;
        }
        Ok(())
    }

    async fn delete_view_item(&self, id: &str) -> Result<(), RepositoryError> {
        for repo in &self.save_repositories {
            repo.delete_view_item(id).await?;
        }
        Ok(())
    }
}
