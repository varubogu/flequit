//! TimeLabel用SQLiteモデル

use async_trait::async_trait;
use flequit_model::models::setting::TimeLabel;
use crate::models::sqlite::{DomainToSqliteConverter, SqliteModelConverter};
use sea_orm::{entity::prelude::*, Set};
use serde::{Deserialize, Serialize};

/// TimeLabelエンティティのModel
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "time_labels")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: String,
    pub name: String,
    pub time: String,
}

/// TimeLabelエンティティのRelations
#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}

#[async_trait]
impl SqliteModelConverter<TimeLabel> for Model {
    async fn to_domain_model(&self) -> Result<TimeLabel, String> {
        Ok(TimeLabel {
            id: self.id.clone(),
            name: self.name.clone(),
            time: self.time.clone(),
        })
    }
}

#[async_trait]
impl DomainToSqliteConverter<ActiveModel> for TimeLabel {
    async fn to_sqlite_model(&self) -> Result<ActiveModel, String> {
        Ok(ActiveModel {
            id: Set(self.id.clone()),
            name: Set(self.name.clone()),
            time: Set(self.time.clone()),
        })
    }
}
