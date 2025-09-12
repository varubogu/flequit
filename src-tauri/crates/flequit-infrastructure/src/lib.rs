//! Infrastructure統合層
//!
//! SQLite、Automerge等の各Infrastructure層を統合し、
//! Service層から直接アクセスできる統一リポジトリインターフェースを提供する。
//!
//! 設計原則:
//! - 検索系操作: SQLite（高速）
//! - 保存系操作: Automerge（永続化） → SQLite（同期）
//! - 統一インターフェース: 全エンティティで一貫したアクセス方法

pub mod config;
pub mod infrastructure_repositories;
pub mod unified;

// 公開API
pub use config::InfrastructureConfig;
pub use infrastructure_repositories::{
    InfrastructureRepositories, InfrastructureRepositoriesTrait,
};
pub use unified::*;
