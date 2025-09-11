pub mod errors;
pub mod infrastructure;
pub mod models;

// 公開API
pub use infrastructure::LocalAutomergeRepositories;
// テスト支援は tests/ 側でのみ使用（本番ビルドに露出しない）
