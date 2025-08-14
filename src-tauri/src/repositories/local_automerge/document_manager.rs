// TODO: 実装をautomerge-repoベースに変更する必要があります
// 現在の実装は一時的にコメントアウトしています

use std::path::{Path, PathBuf};
use crate::errors::RepositoryError;

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
    base_path: PathBuf,
    // TODO: automerge-repo::RepoHandle を使用
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

        Ok(Self {
            base_path,
        })
    }

    /// ドキュメントファイルのフルパスを取得
    fn _document_path(&self, doc_type: &DocumentType) -> PathBuf {
        self.base_path.join(doc_type.filename())
    }

    /// ドキュメントを保存
    pub fn save_document(&mut self, _doc_type: &DocumentType) -> Result<(), RepositoryError> {
        // TODO: automerge-repoを使用した実装
        Ok(())
    }

    /// ドキュメントを削除
    pub fn delete_document(&mut self, _doc_type: DocumentType) -> Result<(), RepositoryError> {
        // TODO: automerge-repoを使用した実装
        Ok(())
    }

    /// 既存のドキュメントが存在するかチェック
    pub fn document_exists(&self, _doc_type: &DocumentType) -> bool {
        // TODO: automerge-repoを使用した実装
        false
    }

    /// 全ドキュメントタイプのリストを取得
    pub fn list_document_types(&self) -> Result<Vec<DocumentType>, RepositoryError> {
        // TODO: automerge-repoを使用した実装
        Ok(vec![DocumentType::Settings, DocumentType::Account])
    }

    /// メモリ内のドキュメントをクリア
    pub fn clear_cache(&mut self) -> Result<(), RepositoryError> {
        // TODO: automerge-repoを使用した実装
        Ok(())
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

        // 基本的な作成テスト
        let doc_type = DocumentType::Settings;
        manager.save_document(&doc_type).unwrap();

        // TODO: 実装完了後にテストを有効化
        // assert!(manager.document_exists(&doc_type));
    }
}