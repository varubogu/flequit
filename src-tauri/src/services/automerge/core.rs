use automerge::{Automerge, AutomergeError};
use std::sync::{Arc, Mutex};
use crate::services::path_service::PathService;

pub struct AutomergeManager {
    pub(crate) doc: Arc<Mutex<Automerge>>,
    pub(crate) path_service: PathService,
}

impl AutomergeManager {
    pub fn new() -> Self {
        let doc = Automerge::new();
        let path_service = PathService::new().expect("Failed to initialize PathService");
        Self {
            doc: Arc::new(Mutex::new(doc)),
            path_service,
        }
    }

    pub fn get_document_state(&self) -> Vec<u8> {
        let doc = self.doc.lock().unwrap();
        doc.save()
    }

    pub fn load_document_state(&self, data: &[u8]) -> Result<(), AutomergeError> {
        let mut doc = self.doc.lock().unwrap();
        *doc = Automerge::load(data)?;
        Ok(())
    }

    pub fn merge_document(&self, other_data: &[u8]) -> Result<(), AutomergeError> {
        let mut doc = self.doc.lock().unwrap();
        let other_doc = Automerge::load(other_data)?;
        doc.merge(&other_doc)?;
        Ok(())
    }
}