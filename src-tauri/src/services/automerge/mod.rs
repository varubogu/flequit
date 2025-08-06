// Core AutomergeManager
pub mod core;

// Feature modules
pub mod tasks;
pub mod projects;
pub mod task_lists;
pub mod enhanced_tasks;
pub mod subtasks;
pub mod tags;
pub mod sample_data;
pub mod file_operations;
pub mod bulk_operations;

// Re-export the main struct for easy access
pub use core::AutomergeManager;