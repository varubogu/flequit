use crate::errors::automerge_error::AutomergeError;
use automerge_repo::{DocumentId, Storage, StorageError};
use std::future::Future;
use std::path::{Path, PathBuf};
use std::pin::Pin;

/// ファイルシステムベースのAutomergeストレージ実装
pub struct FileStorage {
    base_path: PathBuf,
}

impl FileStorage {
    /// 新しいFileStorageを作成
    pub fn new<P: AsRef<Path>>(base_path: P) -> Result<Self, AutomergeError> {
        let base_path = base_path.as_ref().to_path_buf();

        // ベースディレクトリを作成
        if !base_path.exists() {
            std::fs::create_dir_all(&base_path).map_err(|e| {
                AutomergeError::IOError(format!("Failed to create directory: {}", e))
            })?;
        }

        Ok(Self { base_path })
    }

    /// ドキュメントのファイルパスを取得
    fn document_path(&self, id: &DocumentId) -> PathBuf {
        self.base_path.join(format!("{}.automerge", id))
    }
}

impl FileStorage {
    /// ドキュメントを取得
    pub async fn get(&self, id: DocumentId) -> Result<Option<Vec<u8>>, AutomergeError> {
        let path = self.document_path(&id);

        match std::fs::read(&path) {
            Ok(data) => {
                log::debug!("Successfully read document {} ({} bytes)", id.as_uuid_str(), data.len());
                Ok(Some(data))
            }
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => {
                log::debug!("Document {} not found", id.as_uuid_str());
                let msg = format!("Document {} not found", id.as_uuid_str());
                Err(AutomergeError::NotFound(msg))
            }
            Err(e) => {
                log::error!("Failed to read document {}: {}", id.as_uuid_str(), e);
                Err(AutomergeError::StorageError(format!(
                    "Failed to read document {}: {}",
                    id.as_uuid_str(),
                    e
                )))
            }
        }
    }

    /// 全ドキュメントIDをリスト
    pub async fn list_all(&self) -> Result<Vec<DocumentId>, AutomergeError> {
        let mut document_ids = Vec::new();

        match std::fs::read_dir(&self.base_path) {
            Ok(entries) => {
                for entry in entries.flatten() {
                    if let Some(file_name) = entry.file_name().to_str() {
                        if file_name.ends_with(".automerge") {
                            let id_str = file_name.strip_suffix(".automerge").unwrap();
                            if let Ok(document_id) = id_str.parse() {
                                document_ids.push(document_id);
                            } else {
                                log::warn!("Invalid automerge filename format: {}", file_name);
                            }
                        }
                    }
                }
                log::debug!("Found {} automerge documents", document_ids.len());
                Ok(document_ids)
            }
            Err(e) => {
                log::error!("Failed to list documents in directory {:?}: {}", self.base_path, e);
                Err(AutomergeError::StorageError(format!(
                    "Failed to list documents in directory {:?}: {}",
                    self.base_path,
                    e
                )))
            }
        }
    }

    /// ドキュメントに変更を追記
    pub async fn append(&self, id: DocumentId, changes: Vec<u8>) -> Result<(), AutomergeError> {
        let path = self.document_path(&id);

        match std::fs::OpenOptions::new()
            .create(true)
            .append(true)
            .open(&path)
        {
            Ok(mut file) => {
                use std::io::Write;
                match file.write_all(&changes) {
                    Ok(_) => {
                        log::debug!("Successfully appended {} bytes to document {}", changes.len(), id.as_uuid_str());
                        match file.flush() {
                            Ok(_) => Ok(()),
                            Err(e) => {
                                log::error!("Failed to flush document {}: {}", id.as_uuid_str(), e);
                                Err(AutomergeError::StorageError(format!(
                                    "Failed to flush document {}: {}",
                                    id.as_uuid_str(),
                                    e
                                )))
                            }
                        }
                    }
                    Err(e) => {
                        log::error!("Failed to write to document {}: {}", id.as_uuid_str(), e);
                        Err(AutomergeError::StorageError(format!(
                            "Failed to write to document {}: {}",
                            id.as_uuid_str(),
                            e
                        )))
                    }
                }
            }
            Err(e) => {
                log::error!("Failed to open document {} for append: {}", id.as_uuid_str(), e);
                Err(AutomergeError::StorageError(format!(
                    "Failed to open document {} for append: {}",
                    id.as_uuid_str(),
                    e
                )))
            }
        }
    }

    /// ドキュメントを圧縮
    pub async fn compact(&self, id: DocumentId, full_doc: Vec<u8>) -> Result<(), AutomergeError> {
        let path = self.document_path(&id);

        match std::fs::write(&path, &full_doc) {
            Ok(_) => {
                log::debug!("Successfully compacted document {} ({} bytes)", id.as_uuid_str(), full_doc.len());
                Ok(())
            }
            Err(e) => {
                log::error!("Failed to compact document {}: {}", id.as_uuid_str(), e);
                Err(AutomergeError::StorageError(format!(
                    "Failed to compact document {}: {}",
                    id.as_uuid_str(),
                    e
                )))
            }
        }
    }
}

/// automerge-repo::Storage trait implementation for compatibility
impl Storage for FileStorage {
    fn get(
        &self,
        id: DocumentId,
    ) -> Pin<Box<dyn Future<Output = Result<Option<Vec<u8>>, StorageError>> + Send + 'static>> {
        let path = self.document_path(&id);
        Box::pin(async move {
            match std::fs::read(&path) {
                Ok(data) => {
                    log::debug!("Successfully read document {} ({} bytes)", id.as_uuid_str(), data.len());
                    Ok(Some(data))
                }
                Err(e) if e.kind() == std::io::ErrorKind::NotFound => {
                    log::debug!("Document {} not found", id.as_uuid_str());
                    Err(StorageError::Error)
                }
                Err(e) => {
                    log::error!("Failed to read document {}: {}", id.as_uuid_str(), e);
                    // StorageError::Error しか返せないが、ログで詳細記録
                    Err(StorageError::Error)
                }
            }
        })
    }

    fn list_all(
        &self,
    ) -> Pin<Box<dyn Future<Output = Result<Vec<DocumentId>, StorageError>> + Send + 'static>> {
        let base_path = self.base_path.clone();
        Box::pin(async move {
            let mut document_ids = Vec::new();

            match std::fs::read_dir(&base_path) {
                Ok(entries) => {
                    for entry in entries.flatten() {
                        if let Some(file_name) = entry.file_name().to_str() {
                            if file_name.ends_with(".automerge") {
                                let id_str = file_name.strip_suffix(".automerge").unwrap();
                                if let Ok(document_id) = id_str.parse() {
                                    document_ids.push(document_id);
                                } else {
                                    log::warn!("Invalid automerge filename format: {}", file_name);
                                }
                            }
                        }
                    }
                    log::debug!("Found {} automerge documents", document_ids.len());
                    Ok(document_ids)
                }
                Err(e) => {
                    log::error!("Failed to list documents in directory {:?}: {}", base_path, e);
                    Err(StorageError::Error)
                }
            }
        })
    }

    fn append(
        &self,
        id: DocumentId,
        changes: Vec<u8>,
    ) -> Pin<Box<dyn Future<Output = Result<(), StorageError>> + Send + 'static>> {
        let path = self.document_path(&id);
        Box::pin(async move {
            match std::fs::OpenOptions::new()
                .create(true)
                .append(true)
                .open(&path)
            {
                Ok(mut file) => {
                    use std::io::Write;
                    match file.write_all(&changes) {
                        Ok(_) => {
                            log::debug!("Successfully appended {} bytes to document {}", changes.len(), id.as_uuid_str());
                            match file.flush() {
                                Ok(_) => Ok(()),
                                Err(e) => {
                                    log::error!("Failed to flush document {}: {}", id.as_uuid_str(), e);
                                    Err(StorageError::Error)
                                }
                            }
                        }
                        Err(e) => {
                            log::error!("Failed to write to document {}: {}", id.as_uuid_str(), e);
                            Err(StorageError::Error)
                        }
                    }
                }
                Err(e) => {
                    log::error!("Failed to open document {} for append: {}", id.as_uuid_str(), e);
                    Err(StorageError::Error)
                }
            }
        })
    }

    fn compact(
        &self,
        id: DocumentId,
        full_doc: Vec<u8>,
    ) -> Pin<Box<dyn Future<Output = Result<(), StorageError>> + Send + 'static>> {
        let path = self.document_path(&id);
        Box::pin(async move {
            match std::fs::write(&path, &full_doc) {
                Ok(_) => {
                    log::debug!("Successfully compacted document {} ({} bytes)", id.as_uuid_str(), full_doc.len());
                    Ok(())
                }
                Err(e) => {
                    log::error!("Failed to compact document {}: {}", id.as_uuid_str(), e);
                    Err(StorageError::Error)
                }
            }
        })
    }
}
