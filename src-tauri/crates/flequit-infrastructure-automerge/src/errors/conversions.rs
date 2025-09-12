use flequit_types::errors::repository_error::RepositoryError;
use crate::errors::automerge_error::AutomergeError;

impl From<AutomergeError> for RepositoryError {
    fn from(err: AutomergeError) -> Self {
        match err {
            AutomergeError::NotFound(msg) => RepositoryError::NotFound(msg),
            AutomergeError::UserNotFound(msg) => RepositoryError::UserNotFound(msg),
            AutomergeError::SerializationError(msg) => RepositoryError::SerializationError(msg),
            AutomergeError::IOError(msg) => RepositoryError::IOError(msg),
            AutomergeError::ConversionError(msg) => RepositoryError::ConversionError(msg),
            AutomergeError::Conversion(msg) => RepositoryError::Conversion(msg),
            AutomergeError::ValidationError(msg) => RepositoryError::ValidationError(msg),
            AutomergeError::EmailConflict(msg) => RepositoryError::EmailConflict(msg),
            AutomergeError::ConnectionError(msg) => RepositoryError::ConnectionError(msg),
            AutomergeError::TransactionError(msg) => RepositoryError::TransactionError(msg),
            AutomergeError::InvalidOperation(msg) => RepositoryError::InvalidOperation(msg),
            AutomergeError::ConfigurationError(msg) => RepositoryError::ConfigurationError(msg),
            AutomergeError::ConstraintViolation(msg) => RepositoryError::ConstraintViolation(msg),
            AutomergeError::Export(msg) => RepositoryError::Export(msg),
            AutomergeError::MultipleErrors(errs) => RepositoryError::MultipleErrors(errs),
            AutomergeError::AutomergeError(msg) => RepositoryError::AutomergeError(msg),
            AutomergeError::StorageError(msg) => RepositoryError::IOError(msg),
            AutomergeError::InvalidPath(msg) => RepositoryError::InvalidOperation(msg),
        }
    }
}

impl From<String> for AutomergeError {
    fn from(err: String) -> Self {
        AutomergeError::ConversionError(err)
    }
}

impl From<serde_json::Error> for AutomergeError {
    fn from(err: serde_json::Error) -> Self {
        AutomergeError::SerializationError(err.to_string())
    }
}
