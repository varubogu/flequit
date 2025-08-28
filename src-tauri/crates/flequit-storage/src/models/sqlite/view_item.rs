//! ViewItem用SQLiteモデル

use async_trait::async_trait;
use flequit_model::models::setting::ViewItem;
use crate::models::sqlite::{DomainToSqliteConverter, SqliteModelConverter};
use sea_orm::{entity::prelude::*, Set};
use serde::{Deserialize, Serialize};

/// ViewItemエンティティのModel
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "view_items")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: String,
    pub label: String,
    pub icon: String,
    pub visible: bool,
    pub order: i32,
}

/// ViewItemエンティティのRelations
#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}

#[async_trait]
impl SqliteModelConverter<ViewItem> for Model {
    async fn to_domain_model(&self) -> Result<ViewItem, String> {
        Ok(ViewItem {
            id: self.id.clone(),
            label: self.label.clone(),
            icon: self.icon.clone(),
            visible: self.visible,
            order: self.order,
        })
    }
}

#[async_trait]
impl DomainToSqliteConverter<ActiveModel> for ViewItem {
    async fn to_sqlite_model(&self) -> Result<ActiveModel, String> {
        Ok(ActiveModel {
            id: Set(self.id.clone()),
            label: Set(self.label.clone()),
            icon: Set(self.icon.clone()),
            visible: Set(self.visible),
            order: Set(self.order),
        })
    }
}
