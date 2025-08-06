// Basic commands
pub mod greet;
pub mod auto_save;

// Task management commands
pub mod task_commands;
pub mod subtask_commands;
pub mod tag_commands;

// Project management commands
pub mod project_commands;
pub mod task_list_commands;

// Bulk operation commands
pub mod bulk_commands;

// File operation commands
pub mod file_commands;

// AutoMerge document commands
pub mod document_commands;

// Path management commands
pub mod path_commands;

// Re-export all command functions for easy access
pub use greet::*;
pub use auto_save::*;
pub use task_commands::*;
pub use subtask_commands::*;
pub use tag_commands::*;
pub use project_commands::*;
pub use task_list_commands::*;
pub use bulk_commands::*;
pub use file_commands::*;
pub use document_commands::*;
pub use path_commands::*;