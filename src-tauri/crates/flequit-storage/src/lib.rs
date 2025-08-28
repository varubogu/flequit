//! Flequit Storage Layer
//!
//! このクレートは、Flequitアプリケーションのストレージレイヤーを提供します。
//! SQLite、Automerge、統合ストレージなど複数のストレージバックエンドをサポートします。

pub mod errors;
pub mod infrastructure;
pub mod models;
pub mod repositories;
pub mod utils;

// エラー型をre-export
pub use errors::*;

// 主要なリポジトリ型をre-export
pub use repositories::Repositories;
