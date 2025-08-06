pub mod automerge;
pub mod path_service;

pub use automerge::AutomergeManager;

// Legacy alias for backward compatibility
pub type AutomergeService = std::sync::Arc<std::sync::Mutex<AutomergeManager>>;

