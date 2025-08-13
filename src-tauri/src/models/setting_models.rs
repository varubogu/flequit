use serde::{Serialize, Deserialize};

// Initialization command types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LocalSettings {
    pub theme: String,
    pub language: String,
}

// Setting command types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Setting {
    pub id: String,
    pub key: String,
    pub value: String,
    pub data_type: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SettingResponse {
    pub success: bool,
    pub data: Option<Setting>,
    pub message: Option<String>,
}