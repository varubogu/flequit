use crate::errors::repository_error::RepositoryError;
use crate::models::setting::{CustomDateFormat, TimeLabel, ViewItem};
use async_trait::async_trait;
use std::collections::HashMap;

/// 設定リポジトリのトレイト
#[async_trait]
pub trait SettingRepositoryTrait: Send + Sync {
    // ---------------------------
    // Key-Value設定
    // ---------------------------

    /// 指定したキーの設定値を取得します。
    async fn get_setting(&self, key: &str) -> Result<Option<String>, RepositoryError>;

    /// 指定したキーの設定値を保存（新規作成または更新）します。
    async fn set_setting(&self, key: &str, value: &str) -> Result<(), RepositoryError>;

    /// すべてのKey-Value設定をHashMapとして取得します。
    async fn get_all_key_value_settings(&self) -> Result<HashMap<String, String>, RepositoryError>;

    // ---------------------------
    // Custom Date Formats
    // ---------------------------

    /// 指定したIDのカスタム日付フォーマットを取得します。
    async fn get_custom_date_format(
        &self,
        id: &str,
    ) -> Result<Option<CustomDateFormat>, RepositoryError>;

    /// すべてのカスタム日付フォーマットを取得します。
    async fn get_all_custom_date_formats(&self) -> Result<Vec<CustomDateFormat>, RepositoryError>;

    /// カスタム日付フォーマットを新規追加します。
    async fn add_custom_date_format(
        &self,
        format: &CustomDateFormat,
    ) -> Result<(), RepositoryError>;

    /// カスタム日付フォーマットを更新します。
    async fn update_custom_date_format(
        &self,
        format: &CustomDateFormat,
    ) -> Result<(), RepositoryError>;

    /// カスタム日付フォーマットを削除します。
    async fn delete_custom_date_format(&self, id: &str) -> Result<(), RepositoryError>;

    // ---------------------------
    // Time Labels
    // ---------------------------

    /// 指定したIDの時刻ラベルを取得します。
    async fn get_time_label(&self, id: &str) -> Result<Option<TimeLabel>, RepositoryError>;

    /// すべての時刻ラベルを取得します。
    async fn get_all_time_labels(&self) -> Result<Vec<TimeLabel>, RepositoryError>;

    /// 時刻ラベルを新規追加します。
    async fn add_time_label(&self, label: &TimeLabel) -> Result<(), RepositoryError>;

    /// 時刻ラベルを更新します。
    async fn update_time_label(&self, label: &TimeLabel) -> Result<(), RepositoryError>;

    /// 時刻ラベルを削除します。
    async fn delete_time_label(&self, id: &str) -> Result<(), RepositoryError>;

    // ---------------------------
    // View Items
    // ---------------------------

    /// 指定したIDのビューアイテムを取得します。
    async fn get_view_item(&self, id: &str) -> Result<Option<ViewItem>, RepositoryError>;

    /// すべてのビューアイテムを取得します。
    async fn get_all_view_items(&self) -> Result<Vec<ViewItem>, RepositoryError>;

    /// ビューアイテムを新規追加します。
    async fn add_view_item(&self, item: &ViewItem) -> Result<(), RepositoryError>;

    /// ビューアイテムを更新します。
    async fn update_view_item(&self, item: &ViewItem) -> Result<(), RepositoryError>;

    /// ビューアイテムを削除します。
    async fn delete_view_item(&self, id: &str) -> Result<(), RepositoryError>;
}
