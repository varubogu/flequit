use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum DateTimeFormatGroup {
    Default,
    Preset,
    Custom,
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
