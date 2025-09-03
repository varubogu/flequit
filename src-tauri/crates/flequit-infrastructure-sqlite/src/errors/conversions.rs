  use flequit_types::errors::repository_error::RepositoryError;
  use crate::errors::sqlite_error::SQLiteError;
  use sea_orm::DbErr;

// DbErr -> SqliteError (同じクレート内なので可能)
impl From<DbErr> for SQLiteError {
    fn from(err: DbErr) -> Self {
        match err {
            DbErr::RecordNotFound(msg) => SQLiteError::NotFound(msg),
            DbErr::ConnectionAcquire(_) => SQLiteError::ConnectionError(err.to_string()),
            // DbErr::TryIntoErr { from, into, source } => todo!(),
            // DbErr::Conn(runtime_err) => todo!(),
            // DbErr::Exec(runtime_err) => todo!(),
            // DbErr::Query(runtime_err) => todo!(),
            // DbErr::ConvertFromU64(_) => todo!(),
            // DbErr::UnpackInsertId => todo!(),
            // DbErr::UpdateGetPrimaryKey => todo!(),
            // DbErr::AttrNotSet(_) => todo!(),
            // DbErr::Custom(_) => todo!(),
            // DbErr::Type(_) => todo!(),
            // DbErr::Json(_) => todo!(),
            // DbErr::Migration(_) => todo!(),
            // DbErr::RecordNotInserted => todo!(),
            // DbErr::RecordNotUpdated => todo!(),
            _ => SQLiteError::DatabaseError(err.to_string()),
        }
    }
}

// SqliteError -> RepositoryError (同じクレート内なので可能)
impl From<SQLiteError> for RepositoryError {
    fn from(err: SQLiteError) -> Self {
        match err {
            SQLiteError::NotFound(msg) => RepositoryError::NotFound(msg),
            SQLiteError::ConnectionError(msg) => RepositoryError::ConnectionError(msg),
            SQLiteError::DatabaseError(msg) => RepositoryError::DatabaseError(msg),
            SQLiteError::SerializationError(msg) => RepositoryError::SerializationError(msg),
            SQLiteError::IOError(msg) => RepositoryError::IOError(msg),
            SQLiteError::AutomergeError(msg) => RepositoryError::AutomergeError(msg),
            SQLiteError::EmailConflict(msg) => RepositoryError::EmailConflict(msg),
            SQLiteError::UserNotFound(msg) => RepositoryError::UserNotFound(msg),
            SQLiteError::ConversionError(msg) => RepositoryError::ConversionError(msg),
            SQLiteError::TransactionError(msg) => RepositoryError::TransactionError(msg),
            SQLiteError::InvalidOperation(msg) => RepositoryError::InvalidOperation(msg),
            SQLiteError::ValidationError(msg) => RepositoryError::ValidationError(msg),
            SQLiteError::ConfigurationError(msg) => RepositoryError::ConfigurationError(msg),
            SQLiteError::Conversion(msg) => RepositoryError::Conversion(msg),
            SQLiteError::ConstraintViolation(msg) => RepositoryError::ConstraintViolation(msg),
            SQLiteError::MultipleErrors(items) => RepositoryError::MultipleErrors(items),
            SQLiteError::Export(msg) => RepositoryError::Export(msg),
        }
    }
}

impl From<String> for SQLiteError {
    fn from(err: String) -> Self {
        SQLiteError::ConversionError(err)
    }
}

impl From<serde_json::Error> for SQLiteError {
    fn from(err: serde_json::Error) -> Self {
        SQLiteError::SerializationError(err.to_string())
    }
}

// String -> SQLiteError -> RepositoryError の変換チェーン
// Orphan Rulesのため、String -> RepositoryErrorは直接実装できない
// 代わりに .map_err(|e: String| -> RepositoryError { SQLiteError::ConversionError(e).into() }) を使用

// Orphan Rulesのため直接実装不可。代わりにmap_errを使用:
// .await.map_err(|e: sea_orm::DbErr| -> RepositoryError { SQLiteError::from(e).into() })?
