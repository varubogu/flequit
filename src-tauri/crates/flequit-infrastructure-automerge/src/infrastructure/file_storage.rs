use crate::errors::automerge_error::AutomergeError;
use automerge_repo::{DocumentId, Storage, StorageError};
use std::collections::HashMap;
use std::future::Future;
use std::path::{Path, PathBuf};
use std::pin::Pin;
use std::sync::{Arc, RwLock};

/// ファイル名マッピング（DocumentId ↔ ファイル名の双方向マッピング）
/// 起動時にファイルをスキャンして動的に構築され、メモリ内のみに保持される（永続化しない）
#[derive(Debug, Clone, Default)]
struct FileNameMapping {
    /// DocumentId (UUID文字列) -> ファイル名（拡張子なし）
    id_to_filename: HashMap<String, String>,
    /// ファイル名（拡張子なし） -> DocumentId (UUID文字列)
    filename_to_id: HashMap<String, String>,
}

impl FileNameMapping {
    fn new() -> Self {
        Self::default()
    }

    fn get_filename(&self, id: &DocumentId) -> String {
        self.id_to_filename
            .get(&id.to_string())
            .cloned()
            .unwrap_or_else(|| id.to_string())
    }

    fn set_mapping(&mut self, id: DocumentId, filename: String) {
        let id_str = id.to_string();
        self.id_to_filename.insert(id_str.clone(), filename.clone());
        self.filename_to_id.insert(filename, id_str);
    }

    fn get_id_by_filename(&self, filename: &str) -> Option<DocumentId> {
        let id_str = self.filename_to_id.get(filename)?;
        id_str.parse().ok()
    }
}

/// ファイルシステムベースのAutomergeストレージ実装
#[derive(Clone, Debug)]
pub struct FileStorage {
    base_path: PathBuf,
    /// メモリ内のマッピング（永続化しない）
    mapping: Arc<RwLock<FileNameMapping>>,
}

impl FileStorage {
    /// 新しいFileStorageを作成
    ///
    /// 起動時に既存の.automergeファイルをスキャンし、
    /// ファイル内容からDocumentIdを読み取ってメモリ内マッピングを構築する
    pub fn new<P: AsRef<Path>>(base_path: P) -> Result<Self, AutomergeError> {
        let base_path = base_path.as_ref().to_path_buf();

        // ベースディレクトリを作成
        if !base_path.exists() {
            std::fs::create_dir_all(&base_path).map_err(|e| {
                AutomergeError::IOError(format!("Failed to create directory: {}", e))
            })?;
        }

        let mut mapping = FileNameMapping::new();

        // 既存ファイルをスキャンしてマッピングを構築
        log::info!("Scanning automerge files in {:?}", base_path);
        if let Ok(entries) = std::fs::read_dir(&base_path) {
            let mut scanned_count = 0;
            let mut mapped_count = 0;
            for entry in entries.flatten() {
                let path = entry.path();
                
                // .deleted フォルダ内のファイルはスキップ
                if let Some(parent) = path.parent() {
                    if let Some(parent_name) = parent.file_name().and_then(|n| n.to_str()) {
                        if parent_name == ".deleted" {
                            continue;
                        }
                    }
                }
                
                // ディレクトリはスキップ（ファイルのみ処理）
                if !path.is_file() {
                    continue;
                }
                
                if let Some(filename) = path.file_name().and_then(|n| n.to_str()) {
                    if filename.ends_with(".automerge") {
                        scanned_count += 1;
                        log::debug!("Scanning file: {}", filename);
                        let filename_without_ext = filename.replace(".automerge", "");

                        // まずファイル内容からDocumentIdを抽出を試みる
                        let doc_id = match std::fs::read(&path) {
                            Ok(data) => {
                                if let Some(id) = Self::extract_document_id_from_file(&data) {
                                    log::info!("Extracted DocumentId from file content: {} -> {}", filename, id);
                                    id
                                } else {
                                    // ファイル内容から抽出失敗 → ファイル名から決定的に生成
                                    let generated_id = Self::generate_document_id_from_filename(&filename_without_ext);
                                    log::info!("Generated DocumentId from filename: {} -> {}", filename, generated_id);
                                    generated_id
                                }
                            }
                            Err(e) => {
                                log::error!("Failed to read file {}: {:?}", filename, e);
                                // ファイル読み込み失敗でもファイル名から生成
                                let generated_id = Self::generate_document_id_from_filename(&filename_without_ext);
                                log::info!("Generated DocumentId from filename (after read error): {} -> {}", filename, generated_id);
                                generated_id
                            }
                        };

                        mapping.set_mapping(doc_id, filename_without_ext);
                        mapped_count += 1;
                    }
                }
            }
            log::info!(
                "File scan complete: {} .automerge files found, {} successfully mapped",
                scanned_count,
                mapped_count
            );
        } else {
            log::warn!("Failed to read directory: {:?}", base_path);
        }

        log::info!("FileStorage initialized at {:?} with {} mappings", base_path, mapping.id_to_filename.len());

        Ok(Self {
            base_path,
            mapping: Arc::new(RwLock::new(mapping)),
        })
    }

    /// ファイルの内容からDocumentIdを抽出
    ///
    /// automerge-repoのファイルフォーマットから DocumentId を読み取る
    /// ファイル全体をスキャンして UUID パターン (8-4-4-4-12) を検索する
    fn extract_document_id_from_file(data: &[u8]) -> Option<DocumentId> {
        log::debug!("Extracting DocumentId from file data (size: {} bytes)", data.len());

        if data.len() < 36 {
            log::warn!("File data too short to contain DocumentId: {} bytes", data.len());
            return None;
        }

        // ファイル全体をUTF-8として解釈し、UUID パターンを検索
        let data_str = String::from_utf8_lossy(data);

        // UUID パターン検索: 8-4-4-4-12 形式 (例: "5f3f5aa2-d34d-465b-928f-d6eec69340cb")
        for window in data_str.as_bytes().windows(36) {
            if let Ok(s) = std::str::from_utf8(window) {
                // UUID形式チェック: ハイフンが4つあり、正しい位置にあるか
                if s.chars().filter(|c| *c == '-').count() == 4 {
                    let parts: Vec<&str> = s.split('-').collect();
                    if parts.len() == 5
                        && parts[0].len() == 8
                        && parts[1].len() == 4
                        && parts[2].len() == 4
                        && parts[3].len() == 4
                        && parts[4].len() == 12
                        && parts.iter().all(|p| p.chars().all(|c| c.is_ascii_hexdigit()))
                    {
                        // DocumentId としてパース
                        match s.parse::<DocumentId>() {
                            Ok(doc_id) => {
                                log::info!("Successfully extracted DocumentId from file: {}", doc_id);
                                return Some(doc_id);
                            }
                            Err(e) => {
                                log::debug!("Found UUID-like string '{}' but failed to parse as DocumentId: {:?}", s, e);
                            }
                        }
                    }
                }
            }
        }

        log::warn!("Failed to find valid DocumentId in file data");
        log::debug!("First 100 bytes (hex): {:02x?}", &data[..data.len().min(100)]);
        None
    }

    /// ファイル名から決定的にDocumentIdを生成
    ///
    /// UUID v5 (名前ベースUUID) を使用してファイル名から常に同じDocumentIdを生成
    /// これにより、ファイル内容が変わってもファイル名が同じなら同じDocumentIdが得られる
    fn generate_document_id_from_filename(filename: &str) -> DocumentId {
        // UUID v5 の名前空間として OID 名前空間を使用
        // ファイル名から決定的なUUIDを生成
        let namespace = uuid::Uuid::NAMESPACE_OID;
        let uuid = uuid::Uuid::new_v5(&namespace, filename.as_bytes());

        // UUIDをDocumentIdに変換
        // DocumentIdは内部的にUUID文字列を持つので、to_string()で変換
        uuid.to_string()
            .parse()
            .expect("Generated UUID should always be valid DocumentId")
    }

    /// ドキュメントのファイルパスを取得
    pub fn document_path(&self, id: &DocumentId) -> PathBuf {
        let mapping = self.mapping.read().unwrap();
        let filename = mapping.get_filename(id);
        self.base_path.join(format!("{}.automerge", filename))
    }

    /// DocumentIdとファイル名のマッピングを設定（メモリ内のみ）
    pub fn set_mapping(&self, id: DocumentId, filename: String) {
        log::info!("Setting mapping: {} -> {}", id, filename);
        let mut mapping = self.mapping.write().unwrap();
        mapping.set_mapping(id, filename);
        log::debug!("Mapping updated. Current mappings count: {}", mapping.id_to_filename.len());
    }

    /// ファイルパスからファイル名を抽出してマッピングを確保
    /// append/compact時に呼ばれ、ファイル書き込み後もマッピングが維持されるようにする
    fn ensure_mapping_from_path(&self, path: &PathBuf, id: DocumentId) {
        if let Some(filename) = path.file_name().and_then(|n| n.to_str()) {
            let filename_without_ext = filename.replace(".automerge", "");

            // 既存のマッピングをチェック
            let mapping = self.mapping.read().unwrap();
            if mapping.get_id_by_filename(&filename_without_ext).is_some() {
                // 既にマッピングが存在する場合はスキップ
                return;
            }
            drop(mapping);

            // マッピングが存在しない場合は追加
            log::info!("Ensuring mapping for file write: {} -> {}", filename_without_ext, id);
            self.set_mapping(id, filename_without_ext);
        }
    }

    /// ファイル名からDocumentIdを取得（逆引き）
    pub fn get_document_id_by_filename(&self, filename: &str) -> Result<DocumentId, AutomergeError> {
        log::debug!("Looking up DocumentId for filename: {}", filename);
        let mapping = self.mapping.read().unwrap();
        let filename_without_ext = filename.replace(".automerge", "");

        log::debug!("Available mappings: {:?}", mapping.filename_to_id.keys().collect::<Vec<_>>());

        mapping
            .get_id_by_filename(&filename_without_ext)
            .ok_or_else(|| {
                log::error!(
                    "DocumentId not found in memory mapping for filename: {}. Available files: {:?}",
                    filename,
                    mapping.filename_to_id.keys().collect::<Vec<_>>()
                );
                AutomergeError::NotFound(format!(
                    "DocumentId not found in memory mapping for filename: {}",
                    filename
                ))
            })
    }
}

impl FileStorage {
    /// ドキュメントを取得
    pub async fn get(&self, id: DocumentId) -> Result<Option<Vec<u8>>, AutomergeError> {
        let path = self.document_path(&id);

        match std::fs::read(&path) {
            Ok(data) => {
                log::debug!(
                    "Successfully read document {} ({} bytes)",
                    id.as_uuid_str(),
                    data.len()
                );
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
                log::error!(
                    "Failed to list documents in directory {:?}: {}",
                    self.base_path,
                    e
                );
                Err(AutomergeError::StorageError(format!(
                    "Failed to list documents in directory {:?}: {}",
                    self.base_path, e
                )))
            }
        }
    }

    /// ドキュメントに変更を追記
    pub async fn append(&self, id: DocumentId, changes: Vec<u8>) -> Result<(), AutomergeError> {
        let path = self.document_path(&id);
        log::debug!("Appending {} bytes to document {} at path {:?}", changes.len(), id, path);

        // ファイル名からマッピングを確保（ファイル書き込み時に必ずマッピングを保持）
        self.ensure_mapping_from_path(&path, id.clone());

        match std::fs::OpenOptions::new()
            .create(true)
            .append(true)
            .open(&path)
        {
            Ok(mut file) => {
                use std::io::Write;
                match file.write_all(&changes) {
                    Ok(_) => {
                        log::debug!(
                            "Successfully appended {} bytes to document {}",
                            changes.len(),
                            id.as_uuid_str()
                        );
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
                log::error!(
                    "Failed to open document {} for append: {}",
                    id.as_uuid_str(),
                    e
                );
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
        log::debug!("Compacting document {} ({} bytes) to path {:?}", id, full_doc.len(), path);

        // ファイル名からマッピングを確保（ファイル書き込み時に必ずマッピングを保持）
        self.ensure_mapping_from_path(&path, id.clone());

        match std::fs::write(&path, &full_doc) {
            Ok(_) => {
                log::debug!(
                    "Successfully compacted document {} ({} bytes)",
                    id.as_uuid_str(),
                    full_doc.len()
                );
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
                    log::debug!(
                        "Successfully read document {} ({} bytes)",
                        id.as_uuid_str(),
                        data.len()
                    );
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
                    log::error!(
                        "Failed to list documents in directory {:?}: {}",
                        base_path,
                        e
                    );
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
        let file_storage = self.clone();
        Box::pin(async move {
            // ファイル名からマッピングを確保
            file_storage.ensure_mapping_from_path(&path, id.clone());

            match std::fs::OpenOptions::new()
                .create(true)
                .append(true)
                .open(&path)
            {
                Ok(mut file) => {
                    use std::io::Write;
                    match file.write_all(&changes) {
                        Ok(_) => {
                            log::debug!(
                                "Successfully appended {} bytes to document {}",
                                changes.len(),
                                id.as_uuid_str()
                            );
                            match file.flush() {
                                Ok(_) => Ok(()),
                                Err(e) => {
                                    log::error!(
                                        "Failed to flush document {}: {}",
                                        id.as_uuid_str(),
                                        e
                                    );
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
                    log::error!(
                        "Failed to open document {} for append: {}",
                        id.as_uuid_str(),
                        e
                    );
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
        let file_storage = self.clone();
        Box::pin(async move {
            // ファイル名からマッピングを確保
            file_storage.ensure_mapping_from_path(&path, id.clone());

            match std::fs::write(&path, &full_doc) {
                Ok(_) => {
                    log::debug!(
                        "Successfully compacted document {} ({} bytes)",
                        id.as_uuid_str(),
                        full_doc.len()
                    );
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
