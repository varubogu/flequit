use sea_orm;

#[derive(Debug, thiserror::Error)]
pub enum RepositoryError {
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

    #[error("Database error: {0}")]
    DatabaseError(String),

    #[error("Model conversion error: {0}")]
    Conversion(String),

    #[error("Constraint violation: {0}")]
    ConstraintViolation(String),
}

impl From<sea_orm::DbErr> for RepositoryError {
    fn from(err: sea_orm::DbErr) -> Self {
        RepositoryError::DatabaseError(err.to_string())
    }
}
