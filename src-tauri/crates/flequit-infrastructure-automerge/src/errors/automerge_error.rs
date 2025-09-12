#[derive(Debug, thiserror::Error)]
pub enum AutomergeError {
    #[error("Automerge error: {0}")]
    AutomergeError(String),

    #[error("Serialization error: {0}")]
    SerializationError(String),

    #[error("Not found: {0}")]
    NotFound(String),

    #[error("Email conflict: {0}")]
    EmailConflict(String),

    #[error("User not found: {0}")]
    UserNotFound(String),

    #[error("IO error: {0}")]
    IOError(String),

    #[error("Data conversion error: {0}")]
    ConversionError(String),

    #[error("Connection error: {0}")]
    ConnectionError(String),

    #[error("Transaction error: {0}")]
    TransactionError(String),

    #[error("Invalid operation: {0}")]
    InvalidOperation(String),

    #[error("Validation error: {0}")]
    ValidationError(String),

    #[error("Configuration error: {0}")]
    ConfigurationError(String),

    #[error("Model conversion error: {0}")]
    Conversion(String),

    #[error("Constraint violation: {0}")]
    ConstraintViolation(String),

    #[error("Multiple errors: {0:?}")]
    MultipleErrors(Vec<String>),

    #[error("Export error: {0}")]
    Export(String),

    #[error("Storage error: {0}")]
    StorageError(String),

    #[error("Invalid path: {0}")]
    InvalidPath(String),
}

use flequit_types::errors::repository_error::RepositoryError;

impl From<RepositoryError> for AutomergeError {
    fn from(err: RepositoryError) -> Self {
        match err {
            RepositoryError::NotFound(msg) => AutomergeError::NotFound(msg),
            RepositoryError::AutomergeError(msg) => AutomergeError::AutomergeError(msg),
            RepositoryError::IOError(msg) => AutomergeError::IOError(msg),
            RepositoryError::SerializationError(msg) => AutomergeError::SerializationError(msg),
            RepositoryError::ValidationError(msg) => AutomergeError::ValidationError(msg),
            RepositoryError::ConversionError(msg) => AutomergeError::ConversionError(msg),
            RepositoryError::ConnectionError(msg) => AutomergeError::ConnectionError(msg),
            RepositoryError::TransactionError(msg) => AutomergeError::TransactionError(msg),
            RepositoryError::InvalidOperation(msg) => AutomergeError::InvalidOperation(msg),
            RepositoryError::ConfigurationError(msg) => AutomergeError::ConfigurationError(msg),
            RepositoryError::ConstraintViolation(msg) => AutomergeError::ConstraintViolation(msg),
            RepositoryError::MultipleErrors(msgs) => AutomergeError::MultipleErrors(msgs),
            RepositoryError::Export(msg) => AutomergeError::Export(msg),
            RepositoryError::EmailConflict(msg) => AutomergeError::EmailConflict(msg),
            RepositoryError::UserNotFound(msg) => AutomergeError::NotFound(msg),
            _ => panic!("想定しないエラー RepositoryError={}", err),
        }
    }
}

