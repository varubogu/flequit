use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "PascalCase")]
pub enum DateTimeFormatGroup {
    #[serde(rename = "デフォルト")]
    Default,
    #[serde(rename = "プリセット")]  
    Preset,
    #[serde(rename = "カスタム")]
    Custom,
    #[serde(rename = "カスタムフォーマット")]
    CustomFormat,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DateTimeFormat {
    pub id: String, // UUIDまたは負の整数の文字列表現
    pub name: String,
    pub format: String,
    pub group: DateTimeFormatGroup,
    pub order: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppPresetFormat {
    pub id: i32, // 負の整数
    pub name: String,
    pub format: String,
    pub group: DateTimeFormatGroup,
    pub order: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CustomDateTimeFormat {
    pub id: String, // UUID
    pub name: String,
    pub format: String,
    pub group: DateTimeFormatGroup, // 常に CustomFormat
    pub order: i32,
}