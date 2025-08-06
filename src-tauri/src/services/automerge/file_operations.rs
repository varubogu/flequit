use std::fs;
use std::path::{Path, PathBuf};
use crate::types::{task_types::ProjectTree, import_project_data};
use super::core::AutomergeManager;

impl AutomergeManager {
    pub fn save_to_file(&self, file_path: Option<&str>) -> Result<(), Box<dyn std::error::Error>> {
        let path = if let Some(custom_path) = file_path {
            PathBuf::from(custom_path)
        } else {
            self.path_service.get_main_data_file()?
        };
        
        let data = self.get_document_state();
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent)?;
        }
        fs::write(&path, data)?;
        log::info!("Saved data to: {:?}", path);
        Ok(())
    }

    pub fn load_from_file(&self, file_path: Option<&str>) -> Result<(), Box<dyn std::error::Error>> {
        let path = if let Some(custom_path) = file_path {
            PathBuf::from(custom_path)
        } else {
            self.path_service.get_main_data_file()?
        };
        
        if path.exists() {
            let data = fs::read(&path)?;
            self.load_document_state(&data)?;
            log::info!("Loaded data from: {:?}", path);
        }
        Ok(())
    }

    // JSON形式でのエクスポート
    pub fn export_to_json(&self, file_path: Option<&str>) -> Result<(), Box<dyn std::error::Error>> {
        let path = if let Some(custom_path) = file_path {
            PathBuf::from(custom_path)
        } else {
            self.path_service.get_export_dir()?.join("flequit_export.json")
        };
        
        let projects = self.get_project_trees()?;
        let json_data = serde_json::to_string_pretty(&projects)?;
        
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent)?;
        }
        fs::write(&path, json_data)?;
        log::info!("Exported data to: {:?}", path);
        Ok(())
    }

    // JSON形式でのインポート
    pub fn import_from_json(&self, file_path: &str) -> Result<(), Box<dyn std::error::Error>> {
        let path = PathBuf::from(file_path);
        let json_data = fs::read_to_string(&path)?;
        let projects: Vec<ProjectTree> = serde_json::from_str(&json_data)?;
        
        // 既存データをクリアして新しいデータを設定
        self.clear_all_data()?;
        self.import_project_trees(projects)?;
        log::info!("Imported data from: {:?}", path);
        
        Ok(())
    }

    // バックアップ作成
    pub fn create_backup(&self) -> Result<PathBuf, Box<dyn std::error::Error>> {
        let timestamp = chrono::Utc::now().format("%Y%m%d_%H%M%S").to_string();
        let backup_filename = format!("flequit_backup_{}.automerge", timestamp);
        let backup_path = self.path_service.get_backup_dir()?.join(backup_filename);
        
        let data = self.get_document_state();
        if let Some(parent) = backup_path.parent() {
            fs::create_dir_all(parent)?;
        }
        fs::write(&backup_path, data)?;
        log::info!("Created backup: {:?}", backup_path);
        
        Ok(backup_path)
    }

    // バックアップから復元
    pub fn restore_from_backup(&self, backup_path: &str) -> Result<(), Box<dyn std::error::Error>> {
        let path = PathBuf::from(backup_path);
        if path.exists() {
            let data = fs::read(&path)?;
            self.load_document_state(&data)?;
            log::info!("Restored from backup: {:?}", path);
        } else {
            return Err(format!("Backup file not found: {:?}", path).into());
        }
        Ok(())
    }

    // バックアップ一覧取得
    pub fn list_backups(&self) -> Result<Vec<PathBuf>, Box<dyn std::error::Error>> {
        let backup_dir = self.path_service.get_backup_dir()?;
        let mut backups = Vec::new();
        
        if backup_dir.exists() {
            for entry in fs::read_dir(backup_dir)? {
                let entry = entry?;
                let path = entry.path();
                if path.is_file() && path.extension().and_then(|s| s.to_str()) == Some("automerge") {
                    backups.push(path);
                }
            }
        }
        
        // 新しい順にソート
        backups.sort_by(|a, b| b.file_name().cmp(&a.file_name()));
        Ok(backups)
    }

    // 内部ヘルパーメソッド
    fn clear_all_data(&self) -> Result<(), automerge::AutomergeError> {
        let mut doc = self.doc.lock().unwrap();
        
        // 全データをクリアして新しいドキュメントを作成
        *doc = automerge::Automerge::new();
        
        Ok(())
    }

    fn import_project_trees(&self, projects: Vec<ProjectTree>) -> Result<(), automerge::AutomergeError> {
        let mut doc = self.doc.lock().unwrap();
        import_project_data(&mut doc, projects)
    }
}