pub mod automerge_service;

pub use automerge_service::AutomergeService;

use std::sync::{Arc, Mutex};
use crate::services::automerge_service::AutomergeManager;

pub type AutomergeService = Arc<Mutex<AutomergeManager>>;