pub mod account;
pub mod custom_date_format;
pub mod project;
pub mod setting;
pub mod subtask;
pub mod tag;
pub mod task;
pub mod task_list;
pub mod time_label;
pub mod user;
pub mod view_item;

/// SQLiteモデルと内部ドメインモデル間の変換を提供するトレイト
///
/// このトレイトは、Sea-ORMで使用されるSQLiteエンティティ（ActiveRecord）と、
/// アプリケーション内部で使用される構造体（DateTime<Utc>型の日時フィールドを持つ）間の
/// 双方向変換を統一的に提供します。
///
/// # 目的
///
/// - **SQLite最適化**: 高速な読み書きのためのSQLiteスキーマ対応
/// - **型安全性**: 内部処理では型安全なDateTime<Utc>を使用
/// - **Sea-ORM統合**: ActiveRecord、Entity、Modelトレイトとのシームレスな統合
/// - **インデックス最適化**: 検索・ソート用のDB最適化
///
/// # 使用例
///
/// ```rust
/// // SQLite用エンティティ
/// #[derive(Clone, Debug, PartialEq, DeriveEntityModel)]
/// #[sea_orm(table_name = "tasks")]
/// pub struct Model {
///     #[sea_orm(primary_key)]
///     pub id: String,
///     pub title: String,
///     pub created_at: DateTime<Utc>,  // Sea-ORMがDateTime直接サポート
///     pub updated_at: DateTime<Utc>,
/// }
///
/// // 内部ドメインモデル
/// pub struct Task {
///     pub id: String,
///     pub title: String,
///     pub created_at: DateTime<Utc>,
///     pub updated_at: DateTime<Utc>,
/// }
///
/// impl SqliteModelConverter<Task> for Model {
///     async fn to_domain_model(&self) -> Result<Task, String> {
///         Ok(Task {
///             id: self.id.clone(),
///             title: self.title.clone(),
///             created_at: self.created_at,
///             updated_at: self.updated_at,
///         })
///     }
/// }
///
/// impl SqliteModelConverter<Model> for Task {
///     async fn to_sqlite_model(&self) -> Result<ActiveModel, String> {
///         Ok(ActiveModel {
///             id: Set(self.id.clone()),
///             title: Set(self.title.clone()),
///             created_at: Set(self.created_at),
///             updated_at: Set(self.updated_at),
///         })
///     }
/// }
/// ```
///
/// # パフォーマンス考慮事項
///
/// - **読み取り専用変換**: `to_domain_model()` はコピーを最小化
/// - **書き込み最適化**: `to_sqlite_model()` はSea-ORMのActiveModelを活用
/// - **バッチ処理**: 大量データ処理時の最適化可能
/// - **インデックス活用**: SQLiteの検索最適化をサポート
pub trait SqliteModelConverter<T> {
    /// SQLiteモデルからドメインモデルに変換する
    ///
    /// # 戻り値
    ///
    /// * `Ok(T)` - 変換に成功した場合のドメインモデル
    /// * `Err(String)` - 変換に失敗した場合のエラーメッセージ
    async fn to_domain_model(&self) -> Result<T, String>;
}

/// ドメインモデルからSQLiteモデルへの変換を提供するトレイト
pub trait DomainToSqliteConverter<T> {
    /// ドメインモデルからSQLiteモデル（ActiveModel）に変換する
    ///
    /// # 戻り値
    ///
    /// * `Ok(T)` - 変換に成功した場合のSQLite ActiveModel
    /// * `Err(String)` - 変換に失敗した場合のエラーメッセージ
    async fn to_sqlite_model(&self) -> Result<T, String>;
}
