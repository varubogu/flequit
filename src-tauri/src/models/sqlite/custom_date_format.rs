//! CustomDateFormat用SQLiteモデル

use crate::models::{
    setting::CustomDateFormat,
    sqlite::{DomainToSqliteConverter, SqliteModelConverter},
};
use sea_orm::{entity::prelude::*, Set};
use serde::{Deserialize, Serialize};

/// CustomDateFormatエンティティのModel
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "custom_date_formats")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: String,
    pub name: String,
    pub format: String,
}

/// CustomDateFormatエンティティのRelations
#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}

impl SqliteModelConverter<CustomDateFormat> for Model {
    async fn to_domain_model(&self) -> Result<CustomDateFormat, String> {
        Ok(CustomDateFormat {
            id: self.id.clone(),
            name: self.name.clone(),
            format: self.format.clone(),
        })
    }
}

impl DomainToSqliteConverter<ActiveModel> for CustomDateFormat {
    async fn to_sqlite_model(&self) -> Result<ActiveModel, String> {
        Ok(ActiveModel {
            id: Set(self.id.clone()),
            name: Set(self.name.clone()),
            format: Set(self.format.clone()),
        })
    }
}