pub mod service_error;
pub mod repository_error;
pub mod command_error;

// pub use service_error::ServiceError;
pub use repository_error::RepositoryError;
// pub use command_error::CommandError;

// Automerge関連の基本エラー型（infrastructure層で使用）
#[derive(Debug, thiserror::Error)]
pub enum AutomergeError {
    // #[error("Automerge operation failed: {0}")]
    // OperationError(String),

    // #[error("Serialization error: {0}")]
    // SerializationError(String),

    // #[error("Deserialization error: {0}")]
    // DeserializationError(String),

    // #[error("Invalid value: {0}")]
    // InvalidValue(String),

    // #[error("Document not found: {0}")]
    // DocumentNotFound(String),

    // #[error("Path not found: {0}")]
    // PathNotFound(String),

    // #[error("Storage error: {0}")]
    // StorageError(String),

    // #[error("Network error: {0}")]
    // NetworkError(String),

    // #[error("Schema validation error: {0}")]
    // SchemaValidationError(String),
}
