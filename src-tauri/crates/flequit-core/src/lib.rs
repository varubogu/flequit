//! Flequit Core Business Logic
//!
//! このクレートは、Flequitアプリケーションのコアビジネスロジックを提供します。
//! サービス、ファサード、型定義などを含みます。

pub mod facades;
pub mod ports;
pub mod services;

pub use ports::infrastructure_repositories::InfrastructureRepositoriesTrait;
