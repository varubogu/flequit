//! トレイト定義モジュール
//!
//! このモジュールは、モデル層で使用される共通トレイトを定義します。

pub mod trackable;
pub mod transaction;

pub use trackable::Trackable;
pub use transaction::TransactionManager;
