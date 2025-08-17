//! Settings統合リポジトリ
//!
//! 複数の保存先（SQLite、Automerge）に対する設定データの操作を統一的に提供

use crate::errors::repository_error::RepositoryError;
use crate::models::setting::{Settings, ViewItem, CustomDateFormat, TimeLabel, DueDateButtons};
use crate::repositories::local_automerge::settings::SettingsLocalAutomergeRepository;
use crate::repositories::local_sqlite::settings::SettingsLocalSqliteRepository;
use crate::repositories::settings_repository_trait::{SettingsRepository, SettingsValidationError};
use async_trait::async_trait;

/// Settings用のリポジトリvariant（静的ディスパッチ用）
#[derive(Debug)]
pub enum SettingsRepositoryVariant {
    Sqlite(SettingsLocalSqliteRepository),
    Automerge(SettingsLocalAutomergeRepository),
}

impl SettingsRepositoryVariant {
    /// 設定を読み込み
    pub async fn load(&self) -> Result<Settings, RepositoryError> {
        match self {
            SettingsRepositoryVariant::Sqlite(repo) => repo.load().await,
            SettingsRepositoryVariant::Automerge(repo) => repo.load().await,
        }
    }

    /// 設定を保存
    pub async fn save(&self, settings: &Settings) -> Result<(), RepositoryError> {
        match self {
            SettingsRepositoryVariant::Sqlite(repo) => repo.save(settings).await,
            SettingsRepositoryVariant::Automerge(repo) => repo.save(settings).await,
        }
    }

    /// バリデーション付きで設定を保存
    pub async fn save_with_validation(&self, settings: &Settings) -> Result<(), RepositoryError> {
        match self {
            SettingsRepositoryVariant::Sqlite(repo) => repo.save_with_validation(settings).await,
            SettingsRepositoryVariant::Automerge(repo) => repo.save_with_validation(settings).await,
        }
    }

    /// デフォルト設定にリセット
    pub async fn reset_to_default(&self) -> Result<Settings, RepositoryError> {
        match self {
            SettingsRepositoryVariant::Sqlite(repo) => repo.reset_to_default().await,
            SettingsRepositoryVariant::Automerge(repo) => repo.reset_to_default().await,
        }
    }

    /// バリデーション実行
    pub fn validate(&self, settings: &Settings) -> Vec<SettingsValidationError> {
        match self {
            SettingsRepositoryVariant::Sqlite(repo) => repo.validate(settings),
            SettingsRepositoryVariant::Automerge(repo) => repo.validate(settings),
        }
    }

    /// テーマを更新
    pub async fn update_theme(&self, theme: String) -> Result<(), RepositoryError> {
        match self {
            SettingsRepositoryVariant::Sqlite(repo) => repo.update_theme(theme).await,
            SettingsRepositoryVariant::Automerge(repo) => repo.update_theme(theme).await,
        }
    }

    /// 言語を更新
    pub async fn update_language(&self, language: String) -> Result<(), RepositoryError> {
        match self {
            SettingsRepositoryVariant::Sqlite(repo) => repo.update_language(language).await,
            SettingsRepositoryVariant::Automerge(repo) => repo.update_language(language).await,
        }
    }

    /// カスタム日付フォーマットを更新
    pub async fn update_custom_date_formats(&self, formats: Vec<CustomDateFormat>) -> Result<(), RepositoryError> {
        match self {
            SettingsRepositoryVariant::Sqlite(repo) => repo.update_custom_date_formats(formats).await,
            SettingsRepositoryVariant::Automerge(repo) => repo.update_custom_date_formats(formats).await,
        }
    }

    /// 時刻ラベルを更新
    pub async fn update_time_labels(&self, labels: Vec<TimeLabel>) -> Result<(), RepositoryError> {
        match self {
            SettingsRepositoryVariant::Sqlite(repo) => repo.update_time_labels(labels).await,
            SettingsRepositoryVariant::Automerge(repo) => repo.update_time_labels(labels).await,
        }
    }

    /// ビューアイテムを更新
    pub async fn update_view_items(&self, items: Vec<ViewItem>) -> Result<(), RepositoryError> {
        match self {
            SettingsRepositoryVariant::Sqlite(repo) => repo.update_view_items(items).await,
            SettingsRepositoryVariant::Automerge(repo) => repo.update_view_items(items).await,
        }
    }

    /// 期日ボタン設定を更新
    pub async fn update_due_date_buttons(&self, buttons: DueDateButtons) -> Result<(), RepositoryError> {
        match self {
            SettingsRepositoryVariant::Sqlite(repo) => repo.update_due_date_buttons(buttons).await,
            SettingsRepositoryVariant::Automerge(repo) => repo.update_due_date_buttons(buttons).await,
        }
    }

    /// カスタム日付フォーマットを追加
    pub async fn add_custom_date_format(&self, format: CustomDateFormat) -> Result<(), RepositoryError> {
        match self {
            SettingsRepositoryVariant::Sqlite(repo) => repo.add_custom_date_format(format).await,
            SettingsRepositoryVariant::Automerge(repo) => repo.add_custom_date_format(format).await,
        }
    }

    /// カスタム日付フォーマットを削除
    pub async fn remove_custom_date_format(&self, format_id: &str) -> Result<(), RepositoryError> {
        match self {
            SettingsRepositoryVariant::Sqlite(repo) => repo.remove_custom_date_format(format_id).await,
            SettingsRepositoryVariant::Automerge(repo) => repo.remove_custom_date_format(format_id).await,
        }
    }

    /// 時刻ラベルを追加
    pub async fn add_time_label(&self, label: TimeLabel) -> Result<(), RepositoryError> {
        match self {
            SettingsRepositoryVariant::Sqlite(repo) => repo.add_time_label(label).await,
            SettingsRepositoryVariant::Automerge(repo) => repo.add_time_label(label).await,
        }
    }

    /// 時刻ラベルを削除
    pub async fn remove_time_label(&self, label_id: &str) -> Result<(), RepositoryError> {
        match self {
            SettingsRepositoryVariant::Sqlite(repo) => repo.remove_time_label(label_id).await,
            SettingsRepositoryVariant::Automerge(repo) => repo.remove_time_label(label_id).await,
        }
    }

    /// ビューアイテムを追加
    pub async fn add_view_item(&self, item: ViewItem) -> Result<(), RepositoryError> {
        match self {
            SettingsRepositoryVariant::Sqlite(repo) => repo.add_view_item(item).await,
            SettingsRepositoryVariant::Automerge(repo) => repo.add_view_item(item).await,
        }
    }

    /// ビューアイテムを削除
    pub async fn remove_view_item(&self, item_id: &str) -> Result<(), RepositoryError> {
        match self {
            SettingsRepositoryVariant::Sqlite(repo) => repo.remove_view_item(item_id).await,
            SettingsRepositoryVariant::Automerge(repo) => repo.remove_view_item(item_id).await,
        }
    }
}

/// Settings統合リポジトリ
///
/// 保存操作は複数のリポジトリに対して実行し、
/// 検索操作はSQLiteリポジトリから実行する
#[derive(Debug)]
pub struct SettingsUnifiedRepository {
    /// 保存用のリポジトリ一覧（SQLite + Automerge + 将来的にCloud等）
    save_repositories: Vec<SettingsRepositoryVariant>,
    /// 検索用のリポジトリ（SQLiteのみ、高速検索のため）
    search_repository: SettingsRepositoryVariant,
}

impl SettingsUnifiedRepository {
    /// 新しいインスタンスを作成
    pub fn new(
        save_repositories: Vec<SettingsRepositoryVariant>,
        search_repository: SettingsRepositoryVariant,
    ) -> Self {
        Self {
            save_repositories,
            search_repository,
        }
    }

    /// 複数のリポジトリに保存操作を実行
    async fn save_to_all(&self, settings: &Settings) -> Result<(), RepositoryError> {
        let mut errors = Vec::new();
        
        for repo in &self.save_repositories {
            if let Err(e) = repo.save(settings).await {
                errors.push(format!("Save error: {}", e));
            }
        }

        if !errors.is_empty() {
            return Err(RepositoryError::MultipleErrors(errors));
        }

        Ok(())
    }

    /// バリデーション付きで複数のリポジトリに保存操作を実行
    async fn save_to_all_with_validation(&self, settings: &Settings) -> Result<(), RepositoryError> {
        // まずバリデーションを実行
        let validation_errors = self.search_repository.validate(settings);
        if !validation_errors.is_empty() {
            let error_messages: Vec<String> = validation_errors
                .iter()
                .map(|e| format!("{}: {}", e.field, e.message))
                .collect();
            return Err(RepositoryError::ValidationError(error_messages.join(", ")));
        }

        // バリデーション成功後、全リポジトリに保存
        self.save_to_all(settings).await
    }
}

#[async_trait]
impl SettingsRepository for SettingsUnifiedRepository {
    async fn load(&self) -> Result<Settings, RepositoryError> {
        self.search_repository.load().await
    }

    async fn save(&self, settings: &Settings) -> Result<(), RepositoryError> {
        self.save_to_all(settings).await
    }

    async fn save_with_validation(&self, settings: &Settings) -> Result<(), RepositoryError> {
        self.save_to_all_with_validation(settings).await
    }

    async fn reset_to_default(&self) -> Result<Settings, RepositoryError> {
        // デフォルト設定を全リポジトリに保存し、検索リポジトリから返す
        let default_settings = self.search_repository.reset_to_default().await?;
        
        // 他のリポジトリにも保存
        for repo in &self.save_repositories {
            if let Err(e) = repo.save(&default_settings).await {
                // エラーログを出すが、処理は継続
                eprintln!("Warning: Failed to save default settings to repository: {}", e);
            }
        }

        Ok(default_settings)
    }

    fn validate(&self, settings: &Settings) -> Vec<SettingsValidationError> {
        self.search_repository.validate(settings)
    }

    async fn update_theme(&self, theme: String) -> Result<(), RepositoryError> {
        let mut errors = Vec::new();
        
        for repo in &self.save_repositories {
            if let Err(e) = repo.update_theme(theme.clone()).await {
                errors.push(format!("Update theme error: {}", e));
            }
        }

        if !errors.is_empty() {
            return Err(RepositoryError::MultipleErrors(errors));
        }

        Ok(())
    }

    async fn update_language(&self, language: String) -> Result<(), RepositoryError> {
        let mut errors = Vec::new();
        
        for repo in &self.save_repositories {
            if let Err(e) = repo.update_language(language.clone()).await {
                errors.push(format!("Update language error: {}", e));
            }
        }

        if !errors.is_empty() {
            return Err(RepositoryError::MultipleErrors(errors));
        }

        Ok(())
    }

    async fn update_custom_date_formats(&self, formats: Vec<CustomDateFormat>) -> Result<(), RepositoryError> {
        let mut errors = Vec::new();
        
        for repo in &self.save_repositories {
            if let Err(e) = repo.update_custom_date_formats(formats.clone()).await {
                errors.push(format!("Update custom date formats error: {}", e));
            }
        }

        if !errors.is_empty() {
            return Err(RepositoryError::MultipleErrors(errors));
        }

        Ok(())
    }

    async fn update_time_labels(&self, labels: Vec<TimeLabel>) -> Result<(), RepositoryError> {
        let mut errors = Vec::new();
        
        for repo in &self.save_repositories {
            if let Err(e) = repo.update_time_labels(labels.clone()).await {
                errors.push(format!("Update time labels error: {}", e));
            }
        }

        if !errors.is_empty() {
            return Err(RepositoryError::MultipleErrors(errors));
        }

        Ok(())
    }

    async fn update_view_items(&self, items: Vec<ViewItem>) -> Result<(), RepositoryError> {
        let mut errors = Vec::new();
        
        for repo in &self.save_repositories {
            if let Err(e) = repo.update_view_items(items.clone()).await {
                errors.push(format!("Update view items error: {}", e));
            }
        }

        if !errors.is_empty() {
            return Err(RepositoryError::MultipleErrors(errors));
        }

        Ok(())
    }

    async fn update_due_date_buttons(&self, buttons: DueDateButtons) -> Result<(), RepositoryError> {
        let mut errors = Vec::new();
        
        for repo in &self.save_repositories {
            if let Err(e) = repo.update_due_date_buttons(buttons.clone()).await {
                errors.push(format!("Update due date buttons error: {}", e));
            }
        }

        if !errors.is_empty() {
            return Err(RepositoryError::MultipleErrors(errors));
        }

        Ok(())
    }

    async fn add_custom_date_format(&self, format: CustomDateFormat) -> Result<(), RepositoryError> {
        let mut errors = Vec::new();
        
        for repo in &self.save_repositories {
            if let Err(e) = repo.add_custom_date_format(format.clone()).await {
                errors.push(format!("Add custom date format error: {}", e));
            }
        }

        if !errors.is_empty() {
            return Err(RepositoryError::MultipleErrors(errors));
        }

        Ok(())
    }

    async fn remove_custom_date_format(&self, format_id: &str) -> Result<(), RepositoryError> {
        let mut errors = Vec::new();
        
        for repo in &self.save_repositories {
            if let Err(e) = repo.remove_custom_date_format(format_id).await {
                errors.push(format!("Remove custom date format error: {}", e));
            }
        }

        if !errors.is_empty() {
            return Err(RepositoryError::MultipleErrors(errors));
        }

        Ok(())
    }

    async fn add_time_label(&self, label: TimeLabel) -> Result<(), RepositoryError> {
        let mut errors = Vec::new();
        
        for repo in &self.save_repositories {
            if let Err(e) = repo.add_time_label(label.clone()).await {
                errors.push(format!("Add time label error: {}", e));
            }
        }

        if !errors.is_empty() {
            return Err(RepositoryError::MultipleErrors(errors));
        }

        Ok(())
    }

    async fn remove_time_label(&self, label_id: &str) -> Result<(), RepositoryError> {
        let mut errors = Vec::new();
        
        for repo in &self.save_repositories {
            if let Err(e) = repo.remove_time_label(label_id).await {
                errors.push(format!("Remove time label error: {}", e));
            }
        }

        if !errors.is_empty() {
            return Err(RepositoryError::MultipleErrors(errors));
        }

        Ok(())
    }

    async fn add_view_item(&self, item: ViewItem) -> Result<(), RepositoryError> {
        let mut errors = Vec::new();
        
        for repo in &self.save_repositories {
            if let Err(e) = repo.add_view_item(item.clone()).await {
                errors.push(format!("Add view item error: {}", e));
            }
        }

        if !errors.is_empty() {
            return Err(RepositoryError::MultipleErrors(errors));
        }

        Ok(())
    }

    async fn remove_view_item(&self, item_id: &str) -> Result<(), RepositoryError> {
        let mut errors = Vec::new();
        
        for repo in &self.save_repositories {
            if let Err(e) = repo.remove_view_item(item_id).await {
                errors.push(format!("Remove view item error: {}", e));
            }
        }

        if !errors.is_empty() {
            return Err(RepositoryError::MultipleErrors(errors));
        }

        Ok(())
    }
}
