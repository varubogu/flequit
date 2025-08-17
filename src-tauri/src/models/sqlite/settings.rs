//! Settings用SQLiteモデル

use crate::models::{
    setting::Settings,
    sqlite::{DomainToSqliteConverter, SqliteModelConverter},
};
use chrono::Utc;
use sea_orm::{entity::prelude::*, Set};
use serde::{Deserialize, Serialize};

/// SettingsエンティティのModel
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "settings")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: i32,
    pub settings_json: String,
    pub updated_at: String,
}

/// SettingsエンティティのRelations
#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}

impl SqliteModelConverter<Settings> for Model {
    async fn to_domain_model(&self) -> Result<Settings, String> {
        serde_json::from_str(&self.settings_json)
            .map_err(|e| format!("Failed to parse settings JSON: {}", e))
    }
}

impl DomainToSqliteConverter<ActiveModel> for Settings {
    async fn to_sqlite_model(&self) -> Result<ActiveModel, String> {
        let json_string = serde_json::to_string(self)
            .map_err(|e| format!("Failed to serialize settings: {}", e))?;
        
        let now = Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();

        Ok(ActiveModel {
            id: Set(0), // Will be auto-incremented
            settings_json: Set(json_string),
            updated_at: Set(now),
        })
    }
}