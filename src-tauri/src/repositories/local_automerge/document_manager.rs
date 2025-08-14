use std::path::{Path, PathBuf};
use automerge_repo::{RepoHandle, DocHandle};
use automerge::{ObjType, ScalarValue, transaction::Transactable, ReadDoc};
use crate::errors::RepositoryError;
use super::file_storage::FileStorage;

/// Automergeドキュメントタイプ
#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub enum DocumentType {
    Settings,
    Account,
    Project(String), // project_id
}

impl DocumentType {
    /// ファイル名を生成
    pub fn filename(&self) -> String {
        match self {
            DocumentType::Settings => "settings.automerge".to_string(),
            DocumentType::Account => "account.automerge".to_string(),
            DocumentType::Project(id) => format!("project_{}.automerge", id),
        }
    }
}

/// Automerge-Repoドキュメントの管理を行うマネージャー
pub struct DocumentManager {
    _base_path: PathBuf, // 将来のバックアップ機能で使用予定
    repo_handle: RepoHandle,
    documents: std::collections::HashMap<DocumentType, DocHandle>,
}

impl DocumentManager {
    /// 新しいDocumentManagerを作成
    pub fn new<P: AsRef<Path>>(base_path: P) -> Result<Self, RepositoryError> {
        let base_path = base_path.as_ref().to_path_buf();
        
        // ベースディレクトリを作成
        if !base_path.exists() {
            std::fs::create_dir_all(&base_path)
                .map_err(|e| RepositoryError::IOError(e.to_string()))?;
        }

        // FileStorageを使用してAutomerge-Repoを初期化
        let file_storage = FileStorage::new(base_path.clone())?;
        let repo = automerge_repo::Repo::new(None, Box::new(file_storage));
        let repo_handle = repo.run();

        Ok(Self {
            _base_path: base_path,
            repo_handle,
            documents: std::collections::HashMap::new(),
        })
    }

    /// ドキュメントファイルのフルパスを取得（将来の機能で使用予定）
    fn _document_path(&self, doc_type: &DocumentType) -> PathBuf {
        self._base_path.join(doc_type.filename())
    }

    /// ドキュメントハンドルを取得または作成
    pub async fn get_or_create_document(&mut self, doc_type: &DocumentType) -> Result<DocHandle, RepositoryError> {
        if let Some(doc_handle) = self.documents.get(doc_type) {
            Ok(doc_handle.clone())
        } else {
            // 新しいドキュメントを作成
            let doc_handle = self.repo_handle.new_document();
            self.documents.insert(doc_type.clone(), doc_handle.clone());
            Ok(doc_handle)
        }
    }

    /// ドキュメントを削除
    pub fn delete_document(&mut self, doc_type: DocumentType) -> Result<(), RepositoryError> {
        self.documents.remove(&doc_type);
        Ok(())
    }

    /// 既存のドキュメントが存在するかチェック
    pub fn document_exists(&self, doc_type: &DocumentType) -> bool {
        self.documents.contains_key(doc_type)
    }

    /// 全ドキュメントタイプのリストを取得
    pub fn list_document_types(&self) -> Result<Vec<DocumentType>, RepositoryError> {
        Ok(self.documents.keys().cloned().collect())
    }

    /// メモリ内のドキュメントをクリア
    pub fn clear_cache(&mut self) -> Result<(), RepositoryError> {
        self.documents.clear();
        Ok(())
    }

    /// ドキュメントにデータを保存
    pub async fn save_data<T: serde::Serialize>(
        &mut self,
        doc_type: &DocumentType,
        key: &str,
        value: &T,
    ) -> Result<(), RepositoryError> {
        let doc_handle = self.get_or_create_document(doc_type).await?;

        // JSON形式でシリアライズしてから保存
        let json_value = serde_json::to_value(value)
            .map_err(|e| RepositoryError::SerializationError(e.to_string()))?;

        doc_handle.with_doc_mut(|doc| {
            let mut tx = doc.transaction();
            self.put_json_value(&mut tx, &automerge::ROOT, key, &json_value)
                .map_err(|e| RepositoryError::AutomergeError(e.to_string()))?;
            tx.commit();
            Ok(())
        })
    }

    /// ドキュメントからデータを読み込み
    pub async fn load_data<T: serde::de::DeserializeOwned>(
        &mut self,
        doc_type: &DocumentType,
        key: &str,
    ) -> Result<Option<T>, RepositoryError> {
        let doc_handle = self.get_or_create_document(doc_type).await?;

        doc_handle.with_doc(|doc| {
            match doc.get(automerge::ROOT, key) {
                Ok(Some((value, _))) => {
                    let json_value = self.value_to_json_value(&value);
                    if json_value == serde_json::Value::Null {
                        return Ok(None);
                    }
                    let result: T = serde_json::from_value(json_value)
                        .map_err(|e| RepositoryError::SerializationError(e.to_string()))?;
                    Ok(Some(result))
                }
                Ok(None) => Ok(None),
                Err(_) => Ok(None),
            }
        })
    }

    /// 特定のキーの値を更新
    pub async fn update_value(
        &mut self,
        doc_type: &DocumentType,
        key: &str,
        value: &str,
    ) -> Result<(), RepositoryError> {
        let doc_handle = self.get_or_create_document(doc_type).await?;

        doc_handle.with_doc_mut(|doc| {
            let mut tx = doc.transaction();

            // シンプルなルートレベルキーのみサポート（ネストは後で実装）
            tx.put(automerge::ROOT, key, value)
                .map_err(|e| RepositoryError::AutomergeError(e.to_string()))?;
            tx.commit();
            Ok(())
        })
    }

    /// JSON ValueをAutomergeに変換するヘルパー
    fn put_json_value(
        &self,
        tx: &mut automerge::transaction::Transaction,
        obj: &automerge::ObjId,
        key: &str,
        value: &serde_json::Value,
    ) -> Result<(), automerge::AutomergeError> {
        match value {
            serde_json::Value::Null => {
                tx.put(obj, key, ScalarValue::Null)?;
                Ok(())
            }
            serde_json::Value::Bool(b) => {
                tx.put(obj, key, *b)?;
                Ok(())
            }
            serde_json::Value::Number(n) => {
                if let Some(i) = n.as_i64() {
                    tx.put(obj, key, i)?;
                } else if let Some(f) = n.as_f64() {
                    tx.put(obj, key, f)?;
                } else {
                    return Err(automerge::AutomergeError::InvalidOp(ObjType::Map));
                }
                Ok(())
            }
            serde_json::Value::String(s) => {
                tx.put(obj, key, s.as_str())?;
                Ok(())
            }
            serde_json::Value::Array(arr) => {
                let list_id = tx.put_object(obj, key, ObjType::List)?;
                for (i, item) in arr.iter().enumerate() {
                    self.put_json_value_at_index(tx, &list_id, i, item)?;
                }
                Ok(())
            }
            serde_json::Value::Object(map) => {
                let map_id = tx.put_object(obj, key, ObjType::Map)?;
                for (k, v) in map.iter() {
                    self.put_json_value(tx, &map_id, k, v)?;
                }
                Ok(())
            }
        }
    }

    /// 配列インデックスに値を設定するヘルパー
    fn put_json_value_at_index(
        &self,
        tx: &mut automerge::transaction::Transaction,
        list_obj: &automerge::ObjId,
        index: usize,
        value: &serde_json::Value,
    ) -> Result<(), automerge::AutomergeError> {
        match value {
            serde_json::Value::Null => {
                tx.insert(list_obj, index, ScalarValue::Null)?;
            }
            serde_json::Value::Bool(b) => {
                tx.insert(list_obj, index, *b)?;
            }
            serde_json::Value::Number(n) => {
                if let Some(i) = n.as_i64() {
                    tx.insert(list_obj, index, i)?;
                } else if let Some(f) = n.as_f64() {
                    tx.insert(list_obj, index, f)?;
                } else {
                    return Err(automerge::AutomergeError::InvalidOp(ObjType::Map));
                }
            }
            serde_json::Value::String(s) => {
                tx.insert(list_obj, index, s.as_str())?;
            }
            serde_json::Value::Array(_) | serde_json::Value::Object(_) => {
                // 複雑な型は現在サポートしない（必要に応じて実装）
                tx.insert(list_obj, index, "[complex_object]")?;
            }
        }
        Ok(())
    }

    /// ValueをJSON Valueに変換するヘルパー
    fn value_to_json_value(&self, value: &automerge::Value) -> serde_json::Value {
        match value {
            automerge::Value::Scalar(scalar) => self.scalar_to_json_value(scalar),
            automerge::Value::Object(obj_type) => {
                // Object型の場合、Nullではなく空のObjectを返す（作業用）
                match obj_type {
                    automerge::ObjType::Map => serde_json::Value::Object(serde_json::Map::new()),
                    automerge::ObjType::List => serde_json::Value::Array(vec![]),
                    automerge::ObjType::Text => serde_json::Value::String("".to_string()),
                    automerge::ObjType::Table => serde_json::Value::Object(serde_json::Map::new()),
                }
            }
            // 他の型は現在サポートしていないためNullを返す
            // 将来的にはオブジェクトIDを使った実際のデータ取得を実装
        }
    }

    /// ScalarValueをJSON Valueに変換するヘルパー
    fn scalar_to_json_value(&self, value: &ScalarValue) -> serde_json::Value {
        match value {
            ScalarValue::Null => serde_json::Value::Null,
            ScalarValue::Boolean(b) => serde_json::Value::Bool(*b),
            ScalarValue::Int(i) => serde_json::Value::Number((*i).into()),
            ScalarValue::F64(f) => serde_json::Value::Number(
                serde_json::Number::from_f64(*f).unwrap_or_else(|| serde_json::Number::from(0)),
            ),
            ScalarValue::Str(s) => serde_json::Value::String(s.to_string()),
            ScalarValue::Bytes(b) => {
                // バイト列は文字列として表現
                serde_json::Value::String(format!("bytes[{}]", b.len()))
            }
            ScalarValue::Timestamp(ts) => serde_json::Value::Number((*ts).into()),
            ScalarValue::Counter(_c) => serde_json::Value::Number(0.into()), // Counterの値は直接取得できないため0とする
            ScalarValue::Uint(u) => serde_json::Value::Number((*u).into()),
            ScalarValue::Unknown { .. } => serde_json::Value::Null, // 未知の型はNullとする
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    #[tokio::test]
    async fn test_document_manager() {
        let temp_dir = TempDir::new().unwrap();
        let mut manager = DocumentManager::new(temp_dir.path()).unwrap();

        // 基本的なドキュメント作成テスト
        let doc_type = DocumentType::Settings;
        let _doc_handle = manager.get_or_create_document(&doc_type).await.unwrap();

        // ドキュメントが作成されたことを確認
        assert!(manager.document_exists(&doc_type));
    }
}