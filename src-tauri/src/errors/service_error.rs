use super::RepositoryError;

#[derive(Debug, thiserror::Error)]
pub enum ServiceError {
    #[error("Validation error: {0}")]
    ValidationError(String),

    // #[error("Not found: {0}")]
    // NotFound(String),

    #[error("Repository error: {0}")]
    Repository(#[from] RepositoryError),

    // #[error("Permission denied: {0}")]
    // PermissionDenied(String),

    // #[error("Business logic error: {0}")]
    // BusinessLogic(String),

    // #[error("Conflict error: {0}")]
    // Conflict(String),

    // #[error("Internal error: {0}")]
    // InternalError(String),
}
