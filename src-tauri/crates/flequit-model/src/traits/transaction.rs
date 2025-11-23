//! トランザクション管理トレイト
//!
//! このモジュールは、データベーストランザクション管理の抽象インターフェースを定義します。

use async_trait::async_trait;
use flequit_types::errors::repository_error::RepositoryError;

/// トランザクション管理の抽象インターフェース
///
/// このトレイトは、データベーストランザクションの開始、コミット、ロールバックを
/// 抽象化します。各データベース実装（SQLite、PostgreSQLなど）は、このトレイトを
/// 実装することで、統一的なトランザクション管理を提供します。
///
/// # トランザクション制御の責務
///
/// - **Facade層**: トランザクションの開始、コミット、ロールバックを制御
/// - **Service層**: トランザクションオブジェクトを受け取り、Repository層に渡す
/// - **Repository層**: 渡されたトランザクションオブジェクトを使用してデータアクセス
///
/// # 使用例
///
/// ```rust,ignore
/// // Facade層でトランザクション制御
/// pub async fn delete_tag<R, TM>(
///     repositories: &R,
///     tx_manager: &TM,
///     project_id: &ProjectId,
///     tag_id: &TagId,
/// ) -> Result<bool, String>
/// where
///     R: InfrastructureRepositoriesTrait + Send + Sync,
///     TM: TransactionManager + Send + Sync,
/// {
///     // トランザクション開始
///     let txn = tx_manager.begin().await?;
///
///     // ビジネスロジック実行
///     match tag_service::delete_tag(&txn, repositories, project_id, tag_id).await {
///         Ok(_) => {
///             // 成功時: コミット
///             tx_manager.commit(txn).await?;
///             Ok(true)
///         }
///         Err(e) => {
///             // 失敗時: ロールバック
///             let _ = tx_manager.rollback(txn).await;
///             Err(format!("Failed to delete tag: {:?}", e))
///         }
///     }
/// }
/// ```
#[async_trait]
pub trait TransactionManager: Send + Sync {
    /// トランザクションオブジェクトの型
    type Transaction: Send + Sync;

    /// トランザクションを開始
    ///
    /// # Returns
    ///
    /// 開始されたトランザクションオブジェクト
    ///
    /// # Errors
    ///
    /// - データベース接続エラー
    /// - リソース不足
    async fn begin(&self) -> Result<Self::Transaction, RepositoryError>;

    /// トランザクションをコミット
    ///
    /// トランザクション内で行われたすべての変更を確定します。
    ///
    /// # Arguments
    ///
    /// * `txn` - コミットするトランザクション
    ///
    /// # Errors
    ///
    /// - ディスク容量不足
    /// - データベース破損
    async fn commit(&self, txn: Self::Transaction) -> Result<(), RepositoryError>;

    /// トランザクションをロールバック
    ///
    /// トランザクション内で行われたすべての変更を破棄します。
    ///
    /// # Arguments
    ///
    /// * `txn` - ロールバックするトランザクション
    ///
    /// # Errors
    ///
    /// - データベース接続エラー
    /// - トランザクション状態が不正
    async fn rollback(&self, txn: Self::Transaction) -> Result<(), RepositoryError>;
}
