use super::AutomergeError;

#[derive(Debug, thiserror::Error)]
pub enum RepositoryError {
    #[error("Automerge error: {0}")]
    AutomergeError(#[from] AutomergeError),

    #[error("Email conflict: {0}")]
    EmailConflict(String),

    #[error("User not found: {0}")]
    UserNotFound(String),

    // #[error("Data conversion error: {0}")]
    // ConversionError(String),

    // #[error("Connection error: {0}")]
    // ConnectionError(String),

    // #[error("Transaction error: {0}")]
    // TransactionError(String),

    // #[error("Invalid operation: {0}")]
    // InvalidOperation(String),
}
