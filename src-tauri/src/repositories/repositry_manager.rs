use crate::{
    errors::RepositoryError,
    repositories::unified::{LocalAutomergeRepositories, LocalSqliteRepositories},
};

pub(crate) struct RepositoryManager {
    sqlite_repositories: LocalSqliteRepositories,
    automerge_repositories: LocalAutomergeRepositories,
}

impl RepositoryManager {
    pub(crate) async fn new() -> Result<Self, RepositoryError> {
        let sqlite_repositories = LocalSqliteRepositories::new().await?;
        let automerge_repositories = LocalAutomergeRepositories::new().await?;

        Ok(Self {
            sqlite_repositories,
            automerge_repositories,
        })
    }

    /// SQLiteリポジトリへの参照を取得（内部使用）
    pub(crate) fn sqlite(&self) -> &LocalSqliteRepositories {
        &self.sqlite_repositories
    }

    /// Automergeリポジトリへの参照を取得（内部使用）
    pub(crate) fn automerge(&self) -> &LocalAutomergeRepositories {
        &self.automerge_repositories
    }
}
