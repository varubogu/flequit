//! RecurrenceRule用SQLiteリポジトリ

use super::super::database_manager::DatabaseManager;
use crate::errors::sqlite_error::SQLiteError;
use crate::models::task_projects::recurrence_adjustment::{
    ActiveModel as RecurrenceAdjustmentActiveModel, Column as RecurrenceAdjustmentColumn,
    Entity as RecurrenceAdjustmentEntity,
};
use crate::models::task_projects::recurrence_date_condition::{
    ActiveModel as RecurrenceDateConditionActiveModel, Column as RecurrenceDateConditionColumn,
    Entity as RecurrenceDateConditionEntity,
};
use crate::models::task_projects::recurrence_days_of_week::{
    ActiveModel as RecurrenceDaysOfWeekActiveModel, Column as RecurrenceDaysOfWeekColumn,
    Entity as RecurrenceDaysOfWeekEntity,
};
use crate::models::task_projects::recurrence_detail::{
    ActiveModel as RecurrenceDetailActiveModel, Column as RecurrenceDetailColumn,
    Entity as RecurrenceDetailEntity,
};
use crate::models::task_projects::recurrence_rule::{
    ActiveModel as RecurrenceRuleActiveModel, Column, Entity as RecurrenceRuleEntity,
};
use crate::models::task_projects::recurrence_weekday_condition::{
    ActiveModel as RecurrenceWeekdayConditionActiveModel,
    Column as RecurrenceWeekdayConditionColumn, Entity as RecurrenceWeekdayConditionEntity,
};
use crate::models::{DomainToSqliteConverterWithProjectId, SqliteModelConverter};
use async_trait::async_trait;
use chrono::{DateTime, Utc};
use flequit_model::models::task_projects::{
    recurrence_details::RecurrenceDetails, recurrence_rule::RecurrenceRule,
};
use flequit_model::types::id_types::{ProjectId, RecurrenceRuleId, UserId};
use flequit_repository::repositories::project_repository_trait::ProjectRepository;
use flequit_repository::repositories::task_projects::recurrence_rule_repository_trait::RecurrenceRuleRepositoryTrait;
use flequit_types::errors::repository_error::RepositoryError;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, EntityTrait, PaginatorTrait, QueryFilter, QueryOrder, Set,
    TransactionTrait,
};
use std::sync::Arc;
use tokio::sync::RwLock;

mod read;
mod repository;
mod validation;
mod write;

use validation::{
    adjustment_direction_to_string, adjustment_target_to_string, date_relation_to_string,
    day_of_week_to_string, string_to_adjustment_direction, string_to_adjustment_target,
    string_to_date_relation, string_to_day_of_week, string_to_week_of_month,
    week_of_month_to_string,
};

/// SQLite実装のRecurrenceRuleリポジトリ
///
/// `RecurrenceRuleRepositoryTrait`を実装し、
/// SQLiteデータベースを使用したRecurrenceRule管理を提供する。
///
/// # 特徴
///
/// - **SQLiteベース**: リレーショナルデータベースによる高速検索
/// - **トランザクション**: ACID特性による一貫性保証
/// - **インデックス**: 主要フィールドでの高速検索
/// - **リレーション**: 関連データとの整合性管理
/// - **ID管理**: RecurrenceRuleはプロジェクトに依存しないグローバルなリソース
#[derive(Debug)]
pub struct RecurrenceRuleLocalSqliteRepository {
    db_manager: Arc<RwLock<DatabaseManager>>,
}

impl RecurrenceRuleLocalSqliteRepository {
    /// 新しいRecurrenceRuleRepositoryを作成
    pub fn new(db_manager: Arc<RwLock<DatabaseManager>>) -> Self {
        Self { db_manager }
    }
}

#[cfg(test)]
mod tests;
