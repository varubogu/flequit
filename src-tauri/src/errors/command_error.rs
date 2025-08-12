// use super::ServiceError;

// #[derive(Debug, thiserror::Error)]
// pub enum CommandError {
//     #[error("Service error: {0}")]
//     Service(#[from] ServiceError),

//     #[error("Serialization error: {0}")]
//     SerializationError(String),

//     #[error("Invalid request: {0}")]
//     InvalidRequest(String),

//     #[error("Authentication error: {0}")]
//     AuthenticationError(String),

//     #[error("Authorization error: {0}")]
//     AuthorizationError(String),
// }
