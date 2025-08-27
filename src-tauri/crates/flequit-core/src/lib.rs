//! Flequit Core Business Logic
//!
//! このクレートは、Flequitアプリケーションのコアビジネスロジックを提供します。
//! サービス、ファサード、型定義などを含みます。

pub mod facades;
pub mod services;

// ストレージレイヤーをre-export（型も含む）
pub use flequit_storage::{errors, models, repositories, types, utils};