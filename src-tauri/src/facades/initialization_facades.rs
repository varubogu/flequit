use crate::models::setting::LocalSettings;
use crate::models::account::Account;
use crate::models::project::ProjectTree;
use crate::services::initialization_service::InitializationService;
use crate::errors::service_error::ServiceError;

pub async fn load_local_settings() -> Result<Option<LocalSettings>, String> {
    let service = InitializationService;
    
    match service.load_local_settings().await {
        Ok(settings) => Ok(settings),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to load local settings: {:?}", e))
    }
}

pub async fn load_current_account() -> Result<Option<Account>, String> {
    let service = InitializationService;
    
    match service.load_current_account().await {
        Ok(account) => Ok(account),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to load current account: {:?}", e))
    }
}

pub async fn load_all_project_data() -> Result<Vec<ProjectTree>, String> {
    let service = InitializationService;
    
    match service.load_all_project_data().await {
        Ok(projects) => Ok(projects),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to load all project data: {:?}", e))
    }
}

pub async fn load_all_account() -> Result<Vec<Account>, String> {
    let service = InitializationService;
    
    match service.load_all_account().await {
        Ok(accounts) => Ok(accounts),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to load all accounts: {:?}", e))
    }
}
