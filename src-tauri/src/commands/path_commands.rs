use tauri::State;
use std::sync::{Arc, Mutex};
use std::path::PathBuf;
use crate::services::path_service::{PathService, PathConfig};
use crate::types::Result as AppResult;

type PathServiceState = Arc<Mutex<PathService>>;

#[tauri::command]
pub fn get_current_data_dir(
    path_service: State<PathServiceState>
) -> AppResult<PathBuf> {
    let service = path_service.lock().unwrap();
    match service.get_data_dir() {
        Ok(path) => Ok(path),
        Err(e) => Err(format!("データディレクトリの取得に失敗: {}", e)),
    }
}

#[tauri::command]
pub fn get_current_backup_dir(
    path_service: State<PathServiceState>
) -> AppResult<PathBuf> {
    let service = path_service.lock().unwrap();
    match service.get_backup_dir() {
        Ok(path) => Ok(path),
        Err(e) => Err(format!("バックアップディレクトリの取得に失敗: {}", e)),
    }
}

#[tauri::command]
pub fn get_current_export_dir(
    path_service: State<PathServiceState>
) -> AppResult<PathBuf> {
    let service = path_service.lock().unwrap();
    match service.get_export_dir() {
        Ok(path) => Ok(path),
        Err(e) => Err(format!("エクスポートディレクトリの取得に失敗: {}", e)),
    }
}

#[tauri::command]
pub fn get_system_default_data_dir() -> AppResult<PathBuf> {
    match PathService::get_default_data_dir() {
        Ok(path) => Ok(path),
        Err(e) => Err(format!("システムデフォルトパスの取得に失敗: {}", e)),
    }
}

#[tauri::command]
pub fn get_path_config(
    path_service: State<PathServiceState>
) -> AppResult<PathConfig> {
    let service = path_service.lock().unwrap();
    Ok(service.get_config().clone())
}

#[tauri::command]
pub fn update_path_config(
    path_service: State<PathServiceState>,
    new_config: PathConfig
) -> AppResult<()> {
    let mut service = path_service.lock().unwrap();
    match service.update_config(new_config) {
        Ok(_) => Ok(()),
        Err(e) => Err(format!("パス設定の更新に失敗: {}", e)),
    }
}

#[tauri::command]
pub fn set_custom_data_dir(
    path_service: State<PathServiceState>,
    path: PathBuf
) -> AppResult<()> {
    let mut service = path_service.lock().unwrap();
    match service.set_custom_data_dir(path) {
        Ok(_) => Ok(()),
        Err(e) => Err(format!("カスタムデータディレクトリの設定に失敗: {}", e)),
    }
}

#[tauri::command]
pub fn reset_to_system_default(
    path_service: State<PathServiceState>
) -> AppResult<()> {
    let mut service = path_service.lock().unwrap();
    match service.reset_to_system_default() {
        Ok(_) => Ok(()),
        Err(e) => Err(format!("システムデフォルトへのリセットに失敗: {}", e)),
    }
}

#[tauri::command]
pub fn validate_path(
    path_service: State<PathServiceState>,
    path: PathBuf
) -> AppResult<bool> {
    let service = path_service.lock().unwrap();
    match service.validate_path(&path) {
        Ok(is_valid) => Ok(is_valid),
        Err(e) => Err(format!("パスの検証に失敗: {}", e)),
    }
}

#[tauri::command]
pub fn ensure_directories(
    path_service: State<PathServiceState>
) -> AppResult<()> {
    let service = path_service.lock().unwrap();
    match service.ensure_directories() {
        Ok(_) => Ok(()),
        Err(e) => Err(format!("ディレクトリの作成に失敗: {}", e)),
    }
}