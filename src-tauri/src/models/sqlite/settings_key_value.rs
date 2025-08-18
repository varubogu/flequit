//! Settings Key-Value用SQLiteモデル

use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

/// Settings Key-ValueエンティティのModel
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "settings")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub key: String,
    pub value: String,
}

/// Settings Key-ValueエンティティのRelations
#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}