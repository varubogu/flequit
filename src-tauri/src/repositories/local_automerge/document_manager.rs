use super::file_storage::FileStorage;
use crate::errors::RepositoryError;
use automerge::{transaction::Transactable, ObjType, ReadDoc, ScalarValue};
use automerge_repo::{DocHandle, RepoHandle};
use std::path::{Path, PathBuf};

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
#[derive(Debug)]
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
    pub async fn get_or_create_document(
        &mut self,
        doc_type: &DocumentType,
    ) -> Result<DocHandle, RepositoryError> {
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

        doc_handle.with_doc(|doc| match doc.get(automerge::ROOT, key) {
            Ok(Some((value, obj_id))) => {
                let json_value = self.value_to_json_value_with_objid(doc, &value, &obj_id);
                if json_value == serde_json::Value::Null {
                    return Ok(None);
                }
                let result: T = serde_json::from_value(json_value)
                    .map_err(|e| RepositoryError::SerializationError(e.to_string()))?;
                Ok(Some(result))
            }
            Ok(None) => Ok(None),
            Err(_) => Ok(None),
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
            serde_json::Value::Array(arr) => {
                let nested_list_id = tx.insert_object(list_obj, index, ObjType::List)?;
                for (i, item) in arr.iter().enumerate() {
                    self.put_json_value_at_index(tx, &nested_list_id, i, item)?;
                }
            }
            serde_json::Value::Object(map) => {
                let nested_map_id = tx.insert_object(list_obj, index, ObjType::Map)?;
                for (k, v) in map.iter() {
                    self.put_json_value(tx, &nested_map_id, k, v)?;
                }
            }
        }
        Ok(())
    }

    /// ValueをJSON Valueに変換するヘルパー（オブジェクトID付き版）
    fn value_to_json_value_with_objid<D: ReadDoc>(
        &self,
        doc: &D,
        value: &automerge::Value,
        obj_id: &automerge::ObjId,
    ) -> serde_json::Value {
        match value {
            automerge::Value::Scalar(scalar) => self.scalar_to_json_value(scalar),
            automerge::Value::Object(obj_type) => match obj_type {
                automerge::ObjType::Map | automerge::ObjType::Table => {
                    self.read_map_object(doc, obj_id)
                }
                automerge::ObjType::List => self.read_list_object(doc, obj_id),
                automerge::ObjType::Text => self.read_text_object(doc, obj_id),
            },
        }
    }

    /// Mapオブジェクトからデータを読み取る
    fn read_map_object<D: ReadDoc>(&self, doc: &D, obj_id: &automerge::ObjId) -> serde_json::Value {
        let mut map = serde_json::Map::new();

        // Mapのすべてのキーと値を取得
        for key in doc.keys(obj_id.clone()) {
            if let Ok(Some((value, nested_obj_id))) = doc.get(obj_id, &key) {
                let json_value = self.value_to_json_value_with_objid(doc, &value, &nested_obj_id);
                map.insert(key, json_value);
            }
        }

        serde_json::Value::Object(map)
    }

    /// Listオブジェクトからデータを読み取る
    fn read_list_object<D: ReadDoc>(
        &self,
        doc: &D,
        obj_id: &automerge::ObjId,
    ) -> serde_json::Value {
        let mut array = Vec::new();

        // Listの長さを取得
        let length = doc.length(obj_id.clone());

        // 各インデックスの値を取得
        for i in 0..length {
            if let Ok(Some((value, nested_obj_id))) = doc.get(obj_id, i) {
                let json_value = self.value_to_json_value_with_objid(doc, &value, &nested_obj_id);
                array.push(json_value);
            }
        }

        serde_json::Value::Array(array)
    }

    /// Textオブジェクトからデータを読み取る
    fn read_text_object<D: ReadDoc>(
        &self,
        doc: &D,
        obj_id: &automerge::ObjId,
    ) -> serde_json::Value {
        // Textオブジェクトをstringとして読み取る
        match doc.text(obj_id.clone()) {
            Ok(text) => serde_json::Value::String(text),
            Err(_) => serde_json::Value::String("".to_string()),
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
    use serde_json::json;
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

    #[tokio::test]
    async fn test_save_and_load_simple_data() {
        let temp_dir = TempDir::new().unwrap();
        let mut manager = DocumentManager::new(temp_dir.path()).unwrap();

        let doc_type = DocumentType::Settings;
        let test_value = "test_value";

        // データを保存
        manager
            .save_data(&doc_type, "test_key", &test_value)
            .await
            .unwrap();

        // データを読み込み
        let loaded_value: Option<String> = manager.load_data(&doc_type, "test_key").await.unwrap();
        assert_eq!(loaded_value, Some(test_value.to_string()));
    }

    #[tokio::test]
    async fn test_save_and_load_nested_object() {
        let temp_dir = TempDir::new().unwrap();
        let mut manager = DocumentManager::new(temp_dir.path()).unwrap();

        let doc_type = DocumentType::Settings;

        // ネストしたオブジェクトを作成
        let test_data = json!({
            "user": {
                "name": "テストユーザー",
                "age": 30,
                "preferences": {
                    "theme": "dark",
                    "language": "ja"
                }
            },
            "settings": {
                "notifications": true,
                "auto_save": false
            }
        });

        // データを保存
        manager
            .save_data(&doc_type, "user_config", &test_data)
            .await
            .unwrap();

        // データを読み込み
        let loaded_data: Option<serde_json::Value> =
            manager.load_data(&doc_type, "user_config").await.unwrap();

        assert!(loaded_data.is_some());
        let loaded = loaded_data.unwrap();

        // ネストしたデータが正しく読み込まれることを確認
        assert_eq!(loaded["user"]["name"], "テストユーザー");
        assert_eq!(loaded["user"]["age"], 30);
        assert_eq!(loaded["user"]["preferences"]["theme"], "dark");
        assert_eq!(loaded["user"]["preferences"]["language"], "ja");
        assert_eq!(loaded["settings"]["notifications"], true);
        assert_eq!(loaded["settings"]["auto_save"], false);
    }

    #[tokio::test]
    async fn test_save_and_load_array() {
        let temp_dir = TempDir::new().unwrap();
        let mut manager = DocumentManager::new(temp_dir.path()).unwrap();

        let doc_type = DocumentType::Settings;

        // 配列データを作成
        let test_array = json!([
            {"id": 1, "name": "項目1"},
            {"id": 2, "name": "項目2"},
            {"id": 3, "name": "項目3"}
        ]);

        // データを保存
        manager
            .save_data(&doc_type, "items", &test_array)
            .await
            .unwrap();

        // データを読み込み
        let loaded_array: Option<serde_json::Value> =
            manager.load_data(&doc_type, "items").await.unwrap();

        assert!(loaded_array.is_some());
        let loaded = loaded_array.unwrap();

        // 配列データが正しく読み込まれることを確認
        assert!(loaded.is_array());
        let arr = loaded.as_array().unwrap();
        assert_eq!(arr.len(), 3);
        assert_eq!(arr[0]["id"], 1);
        assert_eq!(arr[0]["name"], "項目1");
        assert_eq!(arr[1]["id"], 2);
        assert_eq!(arr[1]["name"], "項目2");
        assert_eq!(arr[2]["id"], 3);
        assert_eq!(arr[2]["name"], "項目3");
    }

    #[tokio::test]
    async fn test_load_nonexistent_data() {
        let temp_dir = TempDir::new().unwrap();
        let mut manager = DocumentManager::new(temp_dir.path()).unwrap();

        let doc_type = DocumentType::Settings;

        // 存在しないキーを読み込み
        let loaded_value: Option<String> = manager
            .load_data(&doc_type, "nonexistent_key")
            .await
            .unwrap();
        assert_eq!(loaded_value, None);
    }
}
