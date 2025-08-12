use serde::{Deserialize, Serialize};
use super::super::types::datetime_format_types::DateTimeFormatGroup;

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