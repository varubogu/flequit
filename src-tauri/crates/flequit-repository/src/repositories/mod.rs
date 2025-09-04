// Organized by domain structure
pub mod accounts;
pub mod app_settings;
pub mod task_projects;
pub mod users;

// Base traits and common functionality
pub mod base_repository_trait;
pub mod initialized_data_repository_trait;
pub mod search_repository_trait;

// Re-export all traits for compatibility
pub use accounts::*;
pub use app_settings::*;
pub use task_projects::*;
pub use users::*;