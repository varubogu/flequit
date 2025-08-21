use crate::errors::repository_error::RepositoryError;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum ServiceError {
    #[error("Repository error: {0}")]
    Repository(#[from] RepositoryError),
    #[error("Validation error: {0}")]
    ValidationError(String),
    #[error("Invalid argument: {0}")]
    InvalidArgument(String),
    #[error("Not found: {0}")]
    NotFound(String),
    // #[error("Conflict: {0}")]
    // Conflict(String),
    #[error("Internal error: {0}")]
    InternalError(String),
}
