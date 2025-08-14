use crate::repositories::core::CoreRepositoryTrait;
use local_automerge_storage::LocalAutomergeStorage;

pub mod local_automerge_storage;
pub mod project_repository;
pub mod task_repository;
pub mod subtask_repository;
pub mod tag_repository;
pub mod user_repository;

// 新しいAutomergeドキュメント管理システム
pub mod document_manager;
pub mod settings_repository;
pub mod account_repository;
pub mod projects_repository;

pub struct LocalAutomergeRepository {
    pub storage: LocalAutomergeStorage,
}

impl LocalAutomergeRepository {
    pub fn new() -> Self {
        Self {
            storage: LocalAutomergeStorage::new(),
        }
    }
}

impl CoreRepositoryTrait for LocalAutomergeRepository {
}

// 新しいリポジトリの再エクスポート
// pub use document_manager::{DocumentManager, DocumentType};
// pub use settings_repository::SettingsRepository;
// pub use account_repository::AccountRepository;
// pub use projects_repository::ProjectsRepository;
