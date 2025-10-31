//! 操作追跡トレイト
//!
//! このモジュールは、エンティティの作成・更新・削除・復元の操作を追跡するための
//! Trackableトレイトを定義します。

use crate::types::id_types::UserId;
use chrono::{DateTime, Utc};

/// 操作追跡トレイト
///
/// エンティティの作成・更新・削除・復元の操作を追跡するためのトレイトです。
/// すべてのエンティティモデルはこのトレイトを実装することで、
/// 統一された方法で操作履歴を管理できます。
///
/// # フィールド要件
///
/// このトレイトを実装する構造体は、以下のフィールドを持つ必要があります：
/// - `created_at: DateTime<Utc>` - エンティティ作成日時
/// - `updated_at: DateTime<Utc>` - 最終更新日時
/// - `updated_by: UserId` - 最終更新者のユーザーID（必須）
/// - `deleted: bool` - 論理削除フラグ（Automerge同期用）
///
/// # 設計思想
///
/// - **統一インターフェース**: すべてのエンティティで同じ方法で操作を追跡
/// - **必須情報**: updated_byは必須フィールドとし、すべての操作で更新者を記録
/// - **論理削除対応**: deletedフラグでAutomerge同期時の論理削除を管理
/// - **タイムスタンプ管理**: created_atとupdated_atで操作履歴を時系列で追跡
///
/// # 使用例
///
/// ```rust,no_run
/// # use chrono::Utc;
/// # use flequit_model::traits::Trackable;
/// # use flequit_model::types::id_types::{ProjectId, UserId};
/// # use flequit_model::models::task_projects::project::Project;
///
/// let mut project = Project {
///     id: ProjectId::new(),
///     name: "新プロジェクト".to_string(),
///     description: None,
///     color: None,
///     icon: None,
///     is_favorite: false,
///     is_archived: false,
///     order_index: 0,
///     created_at: Utc::now(),
///     updated_at: Utc::now(),
///     deleted: false,
///     updated_by: UserId::from("user_123".to_string()),
/// };
///
/// // 作成時の操作を記録
/// let user_id = UserId::from("user_123".to_string());
/// let timestamp = Utc::now();
/// project.mark_created(user_id.clone(), timestamp);
///
/// // 更新時の操作を記録
/// project.mark_updated(user_id.clone(), Utc::now());
///
/// // 削除時の操作を記録（論理削除）
/// project.mark_deleted(user_id.clone(), Utc::now());
///
/// // 削除済みかどうかを確認
/// assert!(project.is_deleted());
///
/// // 復元時の操作を記録
/// project.mark_restored(user_id, Utc::now());
/// assert!(!project.is_deleted());
/// ```
pub trait Trackable {
    /// エンティティ作成時の操作を記録する
    ///
    /// # 引数
    ///
    /// * `user_id` - 作成者のユーザーID（必須）
    /// * `timestamp` - 作成日時
    ///
    /// # 動作
    ///
    /// - `created_at`に作成日時を設定
    /// - `updated_at`に作成日時を設定（作成時は作成日時と同じ）
    /// - `updated_by`に作成者のユーザーIDを設定
    /// - `deleted`をfalseに設定
    fn mark_created(&mut self, user_id: UserId, timestamp: DateTime<Utc>);

    /// エンティティ更新時の操作を記録する
    ///
    /// # 引数
    ///
    /// * `user_id` - 更新者のユーザーID（必須）
    /// * `timestamp` - 更新日時
    ///
    /// # 動作
    ///
    /// - `updated_at`に更新日時を設定
    /// - `updated_by`に更新者のユーザーIDを設定
    /// - `deleted`フラグは変更しない
    fn mark_updated(&mut self, user_id: UserId, timestamp: DateTime<Utc>);

    /// エンティティ削除時の操作を記録する（論理削除）
    ///
    /// # 引数
    ///
    /// * `user_id` - 削除者のユーザーID（必須）
    /// * `timestamp` - 削除日時
    ///
    /// # 動作
    ///
    /// - `deleted`をtrueに設定
    /// - `updated_at`に削除日時を設定
    /// - `updated_by`に削除者のユーザーIDを設定
    ///
    /// # 注意
    ///
    /// このメソッドは論理削除のみを行います。物理削除はSQLite層で行われます。
    fn mark_deleted(&mut self, user_id: UserId, timestamp: DateTime<Utc>);

    /// エンティティ復元時の操作を記録する
    ///
    /// # 引数
    ///
    /// * `user_id` - 復元者のユーザーID（必須）
    /// * `timestamp` - 復元日時
    ///
    /// # 動作
    ///
    /// - `deleted`をfalseに設定
    /// - `updated_at`に復元日時を設定
    /// - `updated_by`に復元者のユーザーIDを設定
    fn mark_restored(&mut self, user_id: UserId, timestamp: DateTime<Utc>);

    /// エンティティが削除済みかどうかを返す
    ///
    /// # 戻り値
    ///
    /// - `true` - 削除済み（論理削除フラグがtrue）
    /// - `false` - 削除されていない
    fn is_deleted(&self) -> bool;

    /// 最終更新者のユーザーIDを返す
    ///
    /// # 戻り値
    ///
    /// 最終更新者のユーザーID（必須フィールド）
    fn get_updated_by(&self) -> UserId;

    /// 作成日時を返す
    ///
    /// # 戻り値
    ///
    /// エンティティの作成日時
    fn get_created_at(&self) -> DateTime<Utc>;

    /// 最終更新日時を返す
    ///
    /// # 戻り値
    ///
    /// エンティティの最終更新日時
    fn get_updated_at(&self) -> DateTime<Utc>;
}
