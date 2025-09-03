//! CustomDateFormat用SQLiteモデル

use crate::models::{DomainToSqliteConverter, SqliteModelConverter,
};
use async_trait::async_trait;
use flequit_model::models::app_settings::datetime_format::DateTimeFormat;
use sea_orm::{entity::prelude::*, Set};
use serde::{Deserialize, Serialize};

/// CustomDateFormatエンティティのModel
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "datetime_formats")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: String,
    pub name: String,
    pub format: String,
    pub group: String,
    pub order: i32,
}

/// CustomDateFormatエンティティのRelations
#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}

#[async_trait]
impl SqliteModelConverter<DateTimeFormat> for Model {
    async fn to_domain_model(&self) -> Result<DateTimeFormat, String> {
        Ok(DateTimeFormat {
            id: self.id.clone(),
            name: self.name.clone(),
            format: self.format.clone(),
            group: serde_json::from_str(&self.format).unwrap_or_default(),
            order: self.order.clone()
        })
    }
}

#[async_trait]
impl DomainToSqliteConverter<ActiveModel> for DateTimeFormat {
    async fn to_sqlite_model(&self) -> Result<ActiveModel, String> {
        Ok(ActiveModel {
            id: Set(self.id.clone()),
            name: Set(self.name.clone()),
            format: Set(self.format.clone()),
            group: Set(self.format.clone()),
            order: Set(self.order.clone())
        })
    }
}
