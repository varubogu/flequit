//! ユーザー管理モデル
//!
//! このモジュールはアプリケーション内でのユーザー情報を管理する構造体を定義します。
//!
//! ## 概要
//!
//! `User`構造体は、アプリケーション内でのユーザープロフィール情報を表現します。
//! `UserDocument`構造体は、複数のユーザー情報を配列として管理するAutomergeドキュメントです。
//! 認証情報（`Account`）とは分離され、ユーザーの実体情報を管理します。
//!
//! ## 操作制約
//!
//! User Documentは以下の特別な制約があります：
//! - **追加**: 新しいユーザープロフィールの追加は常に可能
//! - **更新**: 既存のユーザープロフィールの更新は可能
//! - **削除**: ユーザープロフィールの削除は不可（情報蓄積方式）
//! - **編集権限**: 自分のAccount.user_idにマッチするプロフィールのみ編集可能

use flequit_model::models::user::User;
use serde::{Deserialize, Serialize};


/// User Documentを表現する構造体（Automergeドキュメント）
///
/// 複数のユーザーをusersr配列として管理します。
/// 追加・更新のみ可能で、削除は不可という制約があります。
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserDocument {
    /// ユーザー情報配列（追加・更新のみ、削除不可）
    pub users: Vec<User>,
}
