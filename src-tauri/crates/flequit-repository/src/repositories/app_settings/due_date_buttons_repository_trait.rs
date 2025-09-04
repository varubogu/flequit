use async_trait::async_trait;
use flequit_model::models::app_settings::due_date_buttons::DueDateButtons;
use flequit_types::errors::repository_error::RepositoryError;

/// 期日ボタン設定リポジトリのトレイト
///
/// 期日ボタンの表示設定を管理するリポジトリのインターフェース。
/// 単一の設定オブジェクトを管理するため、IDベースのCRUD操作ではなく
/// 設定の取得・更新のみを提供する。
///
/// # 設計思想
///
/// - **単一性**: 常に一つの設定オブジェクトを管理
/// - **簡潔性**: ID管理不要な軽量インターフェース
/// - **統合性**: SQLiteとAutomergeの統合的処理
#[async_trait]
pub trait DueDateButtonsRepositoryTrait: Send + Sync {
    /// 期日ボタン設定を取得します。
    ///
    /// # 戻り値
    ///
    /// 設定が存在する場合は`Ok(Some(DueDateButtons))`、
    /// 存在しない場合は`Ok(None)`（デフォルト設定を使用）、
    /// エラー時は`Err(RepositoryError)`
    async fn get_due_date_buttons(&self) -> Result<Option<DueDateButtons>, RepositoryError>;

    /// 期日ボタン設定を保存または更新します。
    ///
    /// # 引数
    ///
    /// * `buttons` - 保存する期日ボタン設定
    ///
    /// # 戻り値
    ///
    /// 成功時は`Ok(())`、失敗時は`Err(RepositoryError)`
    async fn save_due_date_buttons(&self, buttons: &DueDateButtons) -> Result<(), RepositoryError>;

    /// 期日ボタン設定をデフォルト値にリセットします。
    ///
    /// # 戻り値
    ///
    /// 成功時は`Ok(())`、失敗時は`Err(RepositoryError)`
    async fn reset_due_date_buttons(&self) -> Result<(), RepositoryError>;
}
