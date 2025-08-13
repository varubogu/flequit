use crate::models::setting_models::LocalSettings;
use crate::models::account_models::Account;
use crate::models::project_models::ProjectTree;

pub async fn load_local_settings() -> Result<Option<LocalSettings>, String> {
    // 実際にはローカルファイルから設定を読み込む実装が必要
    Ok(Some(LocalSettings {
        theme: "system".to_string(),
        language: "ja".to_string(),
    }))
}

pub async fn load_current_account() -> Result<Option<Account>, String> {
    // 実際にはデータベースからアカウント情報を取得する実装が必要
    Ok(None)
}

pub async fn load_all_project_data() -> Result<Vec<ProjectTree>, String> {
    // 実際にはデータベースから全プロジェクトデータを取得する実装が必要
    Ok(vec![])
}

pub async fn load_all_account() -> Result<Vec<Account>, String> {
    // 実際にはデータベースから全アカウント情報を取得する実装が必要
    Ok(vec![])
}