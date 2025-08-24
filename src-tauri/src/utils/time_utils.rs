use std::time::{SystemTime, UNIX_EPOCH};

#[tracing::instrument(level = "trace")]
pub fn current_timestamp() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs() as i64
}