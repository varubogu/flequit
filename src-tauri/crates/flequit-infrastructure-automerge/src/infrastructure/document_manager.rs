use super::file_storage::FileStorage;
use crate::{errors::automerge_error::AutomergeError, infrastructure::document::Document};
use automerge_repo::RepoHandle;
use flequit_model::types::id_types::ProjectId;
use std::{collections::HashMap, path::{Path, PathBuf}};

/// Automergeドキュメントタイプ（設計仕様準拠の4つ）
#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub enum DocumentType {
    /// 設定・プロジェクト一覧ドキュメント (settings.automerge)
    /// - プロジェクト一覧
    /// - アプリケーション設定
    /// - UI設定項目
    Settings,

    /// アカウント情報ドキュメント (account.automerge)
    /// - 認証情報
    /// - アカウント設定
    Account,

    /// ユーザー情報ドキュメント (user.automerge)
    /// - ユーザープロフィール
    /// - 個人設定
    User,

    /// プロジェクト別ドキュメント (project_{project_id}.automerge)
    /// - プロジェクト詳細
    /// - タスクリスト、タスク、サブタスク
    /// - タグ、メンバー
    Project(ProjectId), // project_id
}

impl DocumentType {
    /// ファイル名を生成
    pub fn filename(&self) -> String {
        match self {
            DocumentType::Settings => "settings.automerge".to_string(),
            DocumentType::Account => "account.automerge".to_string(),
            DocumentType::User => "user.automerge".to_string(),
            DocumentType::Project(id) => format!("project_{}.automerge", id),
        }
    }

    /// プロジェクトIDを取得（Project型の場合のみ）
    pub fn project_id(&self) -> Option<ProjectId> {
        match self {
            DocumentType::Project(id) => Some(id.clone()),
            _ => None,
        }
    }
}

/// Automerge-Repoドキュメントの管理を行うマネージャー
#[derive(Debug)]
pub struct DocumentManager {
    base_path: PathBuf,
    repo_handle: RepoHandle,
    documents: HashMap<DocumentType, Document>,
}

impl DocumentManager {
    /// 新しいDocumentManagerを作成
    pub fn new<P: AsRef<Path>>(base_path: P) -> Result<Self, AutomergeError> {
        let base_path = base_path.as_ref().to_path_buf();

        // ベースディレクトリを作成
        if !base_path.exists() {
            std::fs::create_dir_all(&base_path)
                .map_err(|e| AutomergeError::IOError(e.to_string()))?;
        }

        // FileStorageを使用してAutomerge-Repoを初期化
        let file_storage = FileStorage::new(base_path.clone())?;
        let repo = automerge_repo::Repo::new(None, Box::new(file_storage));
        let repo_handle = repo.run();

        Ok(Self {
            base_path,
            repo_handle,
            documents: HashMap::new(),
        })
    }

    /// ドキュメントファイルのフルパスを取得（将来の機能で使用予定）
    fn _document_path(&self, doc_type: &DocumentType) -> PathBuf {
        self.base_path.join(doc_type.filename())
    }

    /// ドキュメントを取得または作成
    pub async fn get_or_create(
        &mut self,
        doc_type: &DocumentType,
    ) -> Result<Document, AutomergeError> {
        if let Some(doc) = self.documents.get(&doc_type) {
            Ok(doc.clone())
        } else {
            // 新しいドキュメントを作成
            let doc_handle = self.repo_handle.new_document();
            let doc = Document::new(self.base_path.clone(), doc_type.clone(), doc_handle);
            self.documents.insert(doc_type.clone(), doc.clone());
            Ok(doc)
        }
    }

    /// ドキュメントからデータをロード
    pub async fn load_document<T: serde::de::DeserializeOwned + serde::Serialize>(
        &mut self,
        doc_type: &DocumentType,
    ) -> Result<Option<T>, AutomergeError> {
        let doc = self.get_or_create(doc_type).await?;
        doc.load_data("root").await
    }

    /// ドキュメントにデータを保存
    pub async fn save_document<T: serde::Serialize>(
        &mut self,
        doc_type: &DocumentType,
        data: &T,
    ) -> Result<(), AutomergeError> {
        let doc = self.get_or_create(doc_type).await?;
        doc.save_data("root", data).await
    }

    /// ドキュメントから指定されたキーのデータを読み込み
    pub async fn load_data<T: serde::de::DeserializeOwned + serde::Serialize>(
        &mut self,
        doc_type: &DocumentType,
        key: &str,
    ) -> Result<Option<T>, AutomergeError> {
        let doc = self.get_or_create(doc_type).await?;
        doc.load_data(key).await
    }

    /// ドキュメントに指定されたキーでデータを保存
    pub async fn save_data<T: serde::Serialize>(
        &mut self,
        doc_type: &DocumentType,
        key: &str,
        data: &T,
    ) -> Result<(), AutomergeError> {
        let doc = self.get_or_create(doc_type).await?;
        doc.save_data(key, data).await
    }

    /// ドキュメントを削除
    pub fn delete(&mut self, doc_type: DocumentType) -> Result<(), AutomergeError> {
        self.documents.remove(&doc_type);
        Ok(())
    }

    /// 既存のドキュメントが存在するかチェック
    pub fn exists(&self, doc_type: &DocumentType) -> bool {
        self.documents.contains_key(doc_type)
    }

    /// 全ドキュメントタイプのリストを取得
    pub fn list_document_types(&self) -> Result<Vec<DocumentType>, AutomergeError> {
        Ok(self.documents.keys().cloned().collect())
    }

    /// メモリ内のドキュメントをクリア
    pub fn clear_cache(&mut self) -> Result<(), AutomergeError> {
        self.documents.clear();
        Ok(())
    }

    /// 全てのドキュメントをJSONファイルに出力
    pub async fn export_all_documents_to_directory<P: AsRef<Path>>(
        &mut self,
        output_dir: P,
        description: Option<&str>,
    ) -> Result<(), AutomergeError> {
        let output_dir = output_dir.as_ref();

        // 出力ディレクトリを作成
        if !output_dir.exists() {
            std::fs::create_dir_all(output_dir)
                .map_err(|e| AutomergeError::IOError(e.to_string()))?;
        }

        let document_types = self.list_document_types()?;
        // let total_documents = document_types.len();

        for doc_type in &document_types {
            let filename = format!("{}.json", doc_type.filename().replace(".automerge", ""));
            let output_path = output_dir.join(filename);
            if let Some(doc) = self.documents.get(doc_type) {
                doc.export_json(output_path, description)
                    .await?;
            }

        }

        // // サマリーファイルを作成
        // let summary = serde_json::json!({
        //     "export_metadata": {
        //         "exported_at": chrono::Utc::now().to_rfc3339(),
        //         "description": description.unwrap_or("Batch document export"),
        //         "total_documents": total_documents
        //     },
        //     "documents": document_types.iter().map(|dt| {
        //         serde_json::json!({
        //             "type": format!("{:?}", dt),
        //             "filename": dt.filename(),
        //             "json_file": format!("{}.json", dt.filename().replace(".automerge", ""))
        //         })
        //     }).collect::<Vec<_>>()
        // });

        // let summary_path = output_dir.join("export_summary.json");
        // let summary_string = serde_json::to_string_pretty(&summary)
        //     .map_err(|e| AutomergeError::SerializationError(e.to_string()))?;

        // std::fs::write(summary_path, summary_string)
        //     .map_err(|e| AutomergeError::IOError(e.to_string()))?;

        Ok(())
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
        let _doc_handle = manager.get_or_create(&doc_type).await.unwrap();

        // ドキュメントが作成されたことを確認
        assert!(manager.exists(&doc_type));
    }

        #[tokio::test]
    async fn test_save_and_load_simple_data() {
        let temp_dir = TempDir::new().unwrap();
        let mut manager = DocumentManager::new(temp_dir.path()).unwrap();

        let doc_type = DocumentType::Settings;
        let test_key = "test_key";
        let test_value = "test_value";
        let doc = manager
            .get_or_create(&doc_type)
            .await.ok().unwrap();

        // データを保存
        doc
            .save_data(test_key, &test_value)
            .await
            .unwrap();

        // データを読み込み
        let loaded_value: Option<String> = doc.load_data(test_key).await.unwrap();
        assert_eq!(loaded_value, Some(test_value.to_string()));
    }

    #[tokio::test]
    async fn test_save_and_load_nested_object() {
        let temp_dir = TempDir::new().unwrap();
        let mut manager = DocumentManager::new(temp_dir.path()).unwrap();

        let doc_type = DocumentType::Settings;

        let test_key = "user_config";
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

        let doc = manager
            .get_or_create(&doc_type)
            .await.ok().unwrap();

        // データを保存
        doc
            .save_data(test_key, &test_data)
            .await
            .unwrap();

        // データを読み込み
        let loaded_data: Option<serde_json::Value> =
            doc.load_data(test_key).await.unwrap();

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

        let doc = manager
            .get_or_create(&doc_type)
            .await.ok().unwrap();

        // 配列データを作成
        let test_array = json!([
            {"id": 1, "name": "項目1"},
            {"id": 2, "name": "項目2"},
            {"id": 3, "name": "項目3"}
        ]);

        // データを保存
        doc
            .save_data("items", &test_array)
            .await
            .unwrap();

        // データを読み込み
        let loaded_array: Option<serde_json::Value> =
            doc.load_data("items").await.unwrap();

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
        let doc = manager
            .get_or_create(&doc_type)
            .await.ok().unwrap();

        // 存在しないキーを読み込み
        let loaded_value: Option<String> = doc
            .load_data("nonexistent_key")
            .await
            .unwrap();
        assert_eq!(loaded_value, None);
    }
}
