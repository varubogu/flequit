//! RecurrenceRule用SQLiteリポジトリ

use super::super::database_manager::DatabaseManager;
use crate::errors::sqlite_error::SQLiteError;
use crate::models::task_projects::recurrence_rule::{
    ActiveModel as RecurrenceRuleActiveModel, Column, Entity as RecurrenceRuleEntity,
};
use crate::models::task_projects::recurrence_adjustment::{
    ActiveModel as RecurrenceAdjustmentActiveModel,
    Column as RecurrenceAdjustmentColumn,
    Entity as RecurrenceAdjustmentEntity,
};
use crate::models::task_projects::recurrence_detail::{
    ActiveModel as RecurrenceDetailActiveModel,
    Column as RecurrenceDetailColumn,
    Entity as RecurrenceDetailEntity,
};
use crate::models::task_projects::recurrence_date_condition::{
    ActiveModel as RecurrenceDateConditionActiveModel,
    Column as RecurrenceDateConditionColumn,
    Entity as RecurrenceDateConditionEntity,
};
use crate::models::task_projects::recurrence_weekday_condition::{
    ActiveModel as RecurrenceWeekdayConditionActiveModel,
    Column as RecurrenceWeekdayConditionColumn,
    Entity as RecurrenceWeekdayConditionEntity,
};
use crate::models::task_projects::recurrence_days_of_week::{
    ActiveModel as RecurrenceDaysOfWeekActiveModel,
    Column as RecurrenceDaysOfWeekColumn,
    Entity as RecurrenceDaysOfWeekEntity,
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
    ActiveModelTrait, ColumnTrait, EntityTrait, PaginatorTrait, QueryFilter, QueryOrder,
    TransactionTrait, Set,
};
use std::sync::Arc;
use tokio::sync::RwLock;

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

    /// 関連データを削除するヘルパーメソッド
    async fn delete_related_data<C>(
        &self,
        txn: &C,
        project_id: &ProjectId,
        rule_id: &RecurrenceRuleId,
    ) -> Result<(), RepositoryError>
    where
        C: sea_orm::ConnectionTrait,
    {
        let rule_id_str = rule_id.to_string();
        let project_id_str = project_id.to_string();

        // 1. adjustment に紐づく date_conditions と weekday_conditions を削除
        // まず adjustment を取得
        if let Some(adjustment) = RecurrenceAdjustmentEntity::find()
            .filter(RecurrenceAdjustmentColumn::ProjectId.eq(&project_id_str))
            .filter(RecurrenceAdjustmentColumn::RecurrenceRuleId.eq(&rule_id_str))
            .one(txn)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?
        {
            let adjustment_id = adjustment.id;

            // date_conditions を削除
            RecurrenceDateConditionEntity::delete_many()
                .filter(RecurrenceDateConditionColumn::ProjectId.eq(&project_id_str))
                .filter(RecurrenceDateConditionColumn::RecurrenceAdjustmentId.eq(Some(adjustment_id.clone())))
                .exec(txn)
                .await
                .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

            // weekday_conditions を削除
            RecurrenceWeekdayConditionEntity::delete_many()
                .filter(RecurrenceWeekdayConditionColumn::ProjectId.eq(&project_id_str))
                .filter(RecurrenceWeekdayConditionColumn::RecurrenceAdjustmentId.eq(adjustment_id))
                .exec(txn)
                .await
                .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;
        }

        // 2. adjustment を削除
        RecurrenceAdjustmentEntity::delete_many()
            .filter(RecurrenceAdjustmentColumn::ProjectId.eq(&project_id_str))
            .filter(RecurrenceAdjustmentColumn::RecurrenceRuleId.eq(&rule_id_str))
            .exec(txn)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        // 3. days_of_week を削除
        RecurrenceDaysOfWeekEntity::delete_many()
            .filter(RecurrenceDaysOfWeekColumn::ProjectId.eq(&project_id_str))
            .filter(RecurrenceDaysOfWeekColumn::RecurrenceRuleId.eq(&rule_id_str))
            .exec(txn)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        // 4. details に紐づく date_conditions を削除
        RecurrenceDateConditionEntity::delete_many()
            .filter(RecurrenceDateConditionColumn::ProjectId.eq(&project_id_str))
            .filter(RecurrenceDateConditionColumn::RecurrenceDetailId.eq(Some(rule_id_str.clone())))
            .exec(txn)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        // 5. details を削除
        RecurrenceDetailEntity::delete_many()
            .filter(RecurrenceDetailColumn::ProjectId.eq(&project_id_str))
            .filter(RecurrenceDetailColumn::RecurrenceRuleId.eq(&rule_id_str))
            .exec(txn)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        Ok(())
    }

    /// RecurrenceAdjustment を読み込むヘルパーメソッド
    async fn load_adjustment<C>(
        &self,
        txn: &C,
        project_id: &ProjectId,
        rule_id: &RecurrenceRuleId,
    ) -> Result<Option<flequit_model::models::task_projects::recurrence_adjustment::RecurrenceAdjustment>, RepositoryError>
    where
        C: sea_orm::ConnectionTrait,
    {
        use flequit_model::types::id_types::{
            DateConditionId, RecurrenceAdjustmentId, WeekdayConditionId,
        };
        use flequit_model::models::task_projects::date_condition::DateCondition;
        use flequit_model::models::task_projects::weekday_condition::WeekdayCondition;

        let rule_id_str = rule_id.to_string();
        let project_id_str = project_id.to_string();

        // 1. adjustment を取得
        tracing::info!(
            "load_adjustment: project_id={}, rule_id={}",
            project_id_str,
            rule_id_str
        );

        let adjustment_model = RecurrenceAdjustmentEntity::find()
            .filter(RecurrenceAdjustmentColumn::ProjectId.eq(&project_id_str))
            .filter(RecurrenceAdjustmentColumn::RecurrenceRuleId.eq(&rule_id_str))
            .one(txn)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        if let Some(adj) = adjustment_model {
            tracing::info!("load_adjustment: found adjustment with id={}", adj.id);
            let adjustment_id_str = adj.id.clone();

            // 2. date_conditions を取得
            let date_condition_models = RecurrenceDateConditionEntity::find()
                .filter(RecurrenceDateConditionColumn::ProjectId.eq(&project_id_str))
                .filter(RecurrenceDateConditionColumn::RecurrenceAdjustmentId.eq(Some(adjustment_id_str.clone())))
                .all(txn)
                .await
                .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

            let date_conditions: Vec<DateCondition> = date_condition_models
                .into_iter()
                .map(|dc| {
                    DateCondition {
                        id: DateConditionId::from(dc.id),
                        relation: string_to_date_relation(&dc.relation),
                        reference_date: dc.reference_date,
                        created_at: dc.created_at,
                        updated_at: dc.updated_at,
                        deleted: dc.deleted,
                        updated_by: UserId::from(dc.updated_by),
                    }
                })
                .collect();

            // 3. weekday_conditions を取得
            let weekday_condition_models = RecurrenceWeekdayConditionEntity::find()
                .filter(RecurrenceWeekdayConditionColumn::ProjectId.eq(&project_id_str))
                .filter(RecurrenceWeekdayConditionColumn::RecurrenceAdjustmentId.eq(adjustment_id_str.clone()))
                .all(txn)
                .await
                .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

            let weekday_conditions: Vec<WeekdayCondition> = weekday_condition_models
                .into_iter()
                .map(|wc| {
                    let if_weekday = string_to_day_of_week(&wc.if_weekday);
                    let then_direction = string_to_adjustment_direction(&wc.then_direction);
                    let then_target = string_to_adjustment_target(&wc.then_target);
                    let then_weekday = wc.then_weekday.as_ref().map(|s| string_to_day_of_week(s));

                    WeekdayCondition {
                        id: WeekdayConditionId::from(wc.id),
                        if_weekday,
                        then_direction,
                        then_target,
                        then_weekday,
                        then_days: wc.then_days,
                        created_at: wc.created_at,
                        updated_at: wc.updated_at,
                        deleted: wc.deleted,
                        updated_by: UserId::from(wc.updated_by),
                    }
                })
                .collect();

            // 4. RecurrenceAdjustment を構築
            Ok(Some(flequit_model::models::task_projects::recurrence_adjustment::RecurrenceAdjustment {
                id: RecurrenceAdjustmentId::from(adj.id),
                recurrence_rule_id: RecurrenceRuleId::from(adj.recurrence_rule_id),
                date_conditions,
                weekday_conditions,
                created_at: adj.created_at,
                updated_at: adj.updated_at,
                deleted: adj.deleted,
                updated_by: UserId::from(adj.updated_by),
            }))
        } else {
            tracing::info!(
                "load_adjustment: no adjustment found for project_id={}, rule_id={}",
                project_id_str,
                rule_id_str
            );
            Ok(None)
        }
    }

    /// RecurrenceAdjustment を保存するヘルパーメソッド
    async fn save_adjustment<C>(
        &self,
        txn: &C,
        project_id: &ProjectId,
        rule_id: &RecurrenceRuleId,
        adjustment: &flequit_model::models::task_projects::recurrence_adjustment::RecurrenceAdjustment,
    ) -> Result<(), RepositoryError>
    where
        C: sea_orm::ConnectionTrait,
    {
        // 1. adjustment レコードを作成
        let adjustment_active = RecurrenceAdjustmentActiveModel {
            project_id: Set(project_id.to_string()),
            id: Set(adjustment.id.to_string()),
            recurrence_rule_id: Set(rule_id.to_string()),
            created_at: Set(adjustment.created_at),
            updated_at: Set(adjustment.updated_at),
            updated_by: Set(adjustment.updated_by.to_string()),
            deleted: Set(adjustment.deleted),
        };

        adjustment_active
            .insert(txn)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        // 2. date_conditions を作成
        for date_condition in &adjustment.date_conditions {
            let date_condition_active = RecurrenceDateConditionActiveModel {
                project_id: Set(project_id.to_string()),
                id: Set(date_condition.id.to_string()),
                recurrence_adjustment_id: Set(Some(adjustment.id.to_string())),
                recurrence_detail_id: Set(None),
                relation: Set(date_relation_to_string(&date_condition.relation)),
                reference_date: Set(date_condition.reference_date),
                created_at: Set(date_condition.created_at),
                updated_at: Set(date_condition.updated_at),
                updated_by: Set(date_condition.updated_by.to_string()),
                deleted: Set(date_condition.deleted),
            };

            date_condition_active
                .insert(txn)
                .await
                .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;
        }

        // 3. weekday_conditions を作成
        for weekday_condition in &adjustment.weekday_conditions {
            let if_weekday_str = day_of_week_to_string(&weekday_condition.if_weekday);
            let then_direction_str = adjustment_direction_to_string(&weekday_condition.then_direction);
            let then_target_str = adjustment_target_to_string(&weekday_condition.then_target);
            let then_weekday_str = weekday_condition
                .then_weekday
                .as_ref()
                .map(|d| day_of_week_to_string(d));

            let weekday_condition_active = RecurrenceWeekdayConditionActiveModel {
                project_id: Set(project_id.to_string()),
                id: Set(weekday_condition.id.to_string()),
                recurrence_adjustment_id: Set(adjustment.id.to_string()),
                if_weekday: Set(if_weekday_str),
                then_direction: Set(then_direction_str),
                then_target: Set(then_target_str),
                then_weekday: Set(then_weekday_str),
                then_days: Set(weekday_condition.then_days),
                created_at: Set(weekday_condition.created_at),
                updated_at: Set(weekday_condition.updated_at),
                deleted: Set(weekday_condition.deleted),
                updated_by: Set(weekday_condition.updated_by.to_string()),
            };

            weekday_condition_active
                .insert(txn)
                .await
                .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;
        }

        Ok(())
    }

    /// RecurrenceDetails を読み込むヘルパーメソッド
    async fn load_details<C>(
        &self,
        txn: &C,
        project_id: &ProjectId,
        rule_id: &RecurrenceRuleId,
    ) -> Result<Option<RecurrenceDetails>, RepositoryError>
    where
        C: sea_orm::ConnectionTrait,
    {
        use flequit_model::models::task_projects::date_condition::DateCondition;
        use flequit_model::types::id_types::DateConditionId;

        let rule_id_str = rule_id.to_string();
        let project_id_str = project_id.to_string();

        let details_model = RecurrenceDetailEntity::find()
            .filter(RecurrenceDetailColumn::ProjectId.eq(&project_id_str))
            .filter(RecurrenceDetailColumn::RecurrenceRuleId.eq(&rule_id_str))
            .one(txn)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        if let Some(details) = details_model {
            let date_condition_models = RecurrenceDateConditionEntity::find()
                .filter(RecurrenceDateConditionColumn::ProjectId.eq(&project_id_str))
                .filter(RecurrenceDateConditionColumn::RecurrenceDetailId.eq(Some(rule_id_str)))
                .all(txn)
                .await
                .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

            let date_conditions = date_condition_models
                .into_iter()
                .map(|dc| DateCondition {
                    id: DateConditionId::from(dc.id),
                    relation: string_to_date_relation(&dc.relation),
                    reference_date: dc.reference_date,
                    created_at: dc.created_at,
                    updated_at: dc.updated_at,
                    deleted: dc.deleted,
                    updated_by: UserId::from(dc.updated_by),
                })
                .collect::<Vec<_>>();

            Ok(Some(RecurrenceDetails {
                specific_date: details.specific_date,
                week_of_period: details
                    .week_of_period
                    .as_ref()
                    .map(|v| string_to_week_of_month(v)),
                weekday_of_week: details
                    .weekday_of_week
                    .as_ref()
                    .map(|v| string_to_day_of_week(v)),
                date_conditions: if date_conditions.is_empty() {
                    None
                } else {
                    Some(date_conditions)
                },
                created_at: details.created_at,
                updated_at: details.updated_at,
                deleted: details.deleted,
                updated_by: UserId::from(details.updated_by),
            }))
        } else {
            Ok(None)
        }
    }

    /// RecurrenceDetails を保存するヘルパーメソッド
    async fn save_details<C>(
        &self,
        txn: &C,
        project_id: &ProjectId,
        rule_id: &RecurrenceRuleId,
        details: &RecurrenceDetails,
    ) -> Result<(), RepositoryError>
    where
        C: sea_orm::ConnectionTrait,
    {
        // 1. details レコードを作成
        let details_active = RecurrenceDetailActiveModel {
            project_id: Set(project_id.to_string()),
            recurrence_rule_id: Set(rule_id.to_string()),
            specific_date: Set(details.specific_date),
            week_of_period: Set(
                details
                    .week_of_period
                    .as_ref()
                    .map(week_of_month_to_string),
            ),
            weekday_of_week: Set(
                details
                    .weekday_of_week
                    .as_ref()
                    .map(day_of_week_to_string),
            ),
            created_at: Set(details.created_at),
            updated_at: Set(details.updated_at),
            deleted: Set(details.deleted),
            updated_by: Set(details.updated_by.to_string()),
        };

        details_active
            .insert(txn)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        // 2. details 配下の date_conditions を保存
        if let Some(date_conditions) = details.date_conditions.as_ref() {
            for date_condition in date_conditions {
                let date_condition_active = RecurrenceDateConditionActiveModel {
                    project_id: Set(project_id.to_string()),
                    id: Set(date_condition.id.to_string()),
                    recurrence_adjustment_id: Set(None),
                    recurrence_detail_id: Set(Some(rule_id.to_string())),
                    relation: Set(date_relation_to_string(&date_condition.relation)),
                    reference_date: Set(date_condition.reference_date),
                    created_at: Set(date_condition.created_at),
                    updated_at: Set(date_condition.updated_at),
                    updated_by: Set(date_condition.updated_by.to_string()),
                    deleted: Set(date_condition.deleted),
                };

                date_condition_active
                    .insert(txn)
                    .await
                    .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;
            }
        }

        Ok(())
    }

    /// days_of_week を読み込むヘルパーメソッド
    async fn load_days_of_week<C>(
        &self,
        txn: &C,
        project_id: &ProjectId,
        rule_id: &RecurrenceRuleId,
    ) -> Result<Option<Vec<flequit_model::types::datetime_calendar_types::DayOfWeek>>, RepositoryError>
    where
        C: sea_orm::ConnectionTrait,
    {
        let models = RecurrenceDaysOfWeekEntity::find()
            .filter(RecurrenceDaysOfWeekColumn::ProjectId.eq(project_id.to_string()))
            .filter(RecurrenceDaysOfWeekColumn::RecurrenceRuleId.eq(rule_id.to_string()))
            .all(txn)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        if models.is_empty() {
            Ok(None)
        } else {
            Ok(Some(
                models
                    .into_iter()
                    .map(|m| string_to_day_of_week(&m.day_of_week))
                    .collect(),
            ))
        }
    }

    /// days_of_week を保存するヘルパーメソッド
    async fn save_days_of_week<C>(
        &self,
        txn: &C,
        project_id: &ProjectId,
        rule: &RecurrenceRule,
    ) -> Result<(), RepositoryError>
    where
        C: sea_orm::ConnectionTrait,
    {
        if let Some(days_of_week) = rule.days_of_week.as_ref() {
            for day in days_of_week {
                let active = RecurrenceDaysOfWeekActiveModel {
                    project_id: Set(project_id.to_string()),
                    recurrence_rule_id: Set(rule.id.to_string()),
                    day_of_week: Set(day_of_week_to_string(day)),
                    created_at: Set(rule.created_at),
                    updated_at: Set(rule.updated_at),
                    updated_by: Set(rule.updated_by.to_string()),
                    deleted: Set(rule.deleted),
                };

                active
                    .insert(txn)
                    .await
                    .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;
            }
        }

        Ok(())
    }

    /// 名前でRecurrenceRuleを検索
    pub async fn find_by_unit(&self, unit: &str) -> Result<Vec<RecurrenceRule>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(|e| RepositoryError::from(e))?;

        let models = RecurrenceRuleEntity::find()
            .filter(Column::Unit.eq(unit))
            .order_by_asc(Column::CreatedAt)
            .all(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        let mut rules = Vec::new();
        for model in models {
            let rule = model
                .to_domain_model()
                .await
                .map_err(|e: String| RepositoryError::from(SQLiteError::ConversionError(e)))?;
            rules.push(rule);
        }

        Ok(rules)
    }

    /// 間隔でRecurrenceRuleを検索
    pub async fn find_by_interval(
        &self,
        interval: i32,
    ) -> Result<Vec<RecurrenceRule>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(|e| RepositoryError::from(e))?;

        let models = RecurrenceRuleEntity::find()
            .filter(Column::Interval.eq(interval))
            .order_by_asc(Column::CreatedAt)
            .all(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        let mut rules = Vec::new();
        for model in models {
            let rule = model
                .to_domain_model()
                .await
                .map_err(|e: String| RepositoryError::from(SQLiteError::ConversionError(e)))?;
            rules.push(rule);
        }

        Ok(rules)
    }

    /// 最大回数が設定されたRecurrenceRuleを検索
    pub async fn find_with_max_occurrences(&self) -> Result<Vec<RecurrenceRule>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(|e| RepositoryError::from(e))?;

        let models = RecurrenceRuleEntity::find()
            .filter(Column::MaxOccurrences.is_not_null())
            .order_by_asc(Column::CreatedAt)
            .all(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        let mut rules = Vec::new();
        for model in models {
            let rule = model
                .to_domain_model()
                .await
                .map_err(|e: String| RepositoryError::from(SQLiteError::ConversionError(e)))?;
            rules.push(rule);
        }

        Ok(rules)
    }
}

impl RecurrenceRuleRepositoryTrait for RecurrenceRuleLocalSqliteRepository {}

#[async_trait]
impl ProjectRepository<RecurrenceRule, RecurrenceRuleId> for RecurrenceRuleLocalSqliteRepository {
    async fn save(
        &self,
        project_id: &ProjectId,
        rule: &RecurrenceRule,
        _user_id: &UserId,
        _timestamp: &DateTime<Utc>,
    ) -> Result<(), RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(|e| RepositoryError::from(e))?;

        // トランザクション開始
        let txn = db
            .begin()
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        // 1. メインレコードの保存
        let existing =
            RecurrenceRuleEntity::find_by_id((project_id.to_string(), rule.id.to_string()))
                .one(&txn)
                .await
                .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        if let Some(existing_model) = existing {
            // 更新
            let mut active_model: RecurrenceRuleActiveModel = existing_model.into();
            let mut new_active = rule
                .to_sqlite_model_with_project_id(project_id)
                .await
                .map_err(|e: String| RepositoryError::from(SQLiteError::ConversionError(e)))?;
            new_active.id = Set(rule.id.to_string());
            new_active.project_id = Set(project_id.to_string());

            active_model.unit = new_active.unit;
            active_model.interval = new_active.interval;
            active_model.end_date = new_active.end_date;
            active_model.max_occurrences = new_active.max_occurrences;
            active_model.updated_at = new_active.updated_at;

            active_model
                .update(&txn)
                .await
                .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;
        } else {
            // 新規作成
            let mut active_model = rule
                .to_sqlite_model_with_project_id(project_id)
                .await
                .map_err(|e: String| RepositoryError::from(SQLiteError::ConversionError(e)))?;
            active_model.id = Set(rule.id.to_string());
            active_model.project_id = Set(project_id.to_string());

            active_model
                .insert(&txn)
                .await
                .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;
        }

        // 2. 既存の関連データを削除
        self.delete_related_data(&txn, project_id, &rule.id)
            .await?;

        // 3. adjustment の保存
        tracing::info!(
            "save: project_id={}, rule_id={}, adjustment is_some={}",
            project_id,
            rule.id,
            rule.adjustment.is_some()
        );

        if let Some(ref adjustment) = rule.adjustment {
            tracing::info!(
                "save: saving adjustment with id={}, date_conditions={}, weekday_conditions={}",
                adjustment.id,
                adjustment.date_conditions.len(),
                adjustment.weekday_conditions.len()
            );
            self.save_adjustment(&txn, project_id, &rule.id, adjustment)
                .await?;
        } else {
            tracing::warn!(
                "save: adjustment is None for rule_id={}, skipping adjustment save",
                rule.id
            );
        }

        // 4. details の保存
        if let Some(ref details) = rule.details {
            self.save_details(&txn, project_id, &rule.id, details)
                .await?;
        }

        // 5. days_of_week の保存
        self.save_days_of_week(&txn, project_id, rule).await?;

        // コミット
        txn.commit()
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;
        Ok(())
    }

    async fn find_by_id(
        &self,
        project_id: &ProjectId,
        id: &RecurrenceRuleId,
    ) -> Result<Option<RecurrenceRule>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(|e| RepositoryError::from(e))?;

        if let Some(model) =
            RecurrenceRuleEntity::find_by_id((project_id.to_string(), id.to_string()))
                .one(db)
                .await
                .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?
        {
            // 1. ベースの RecurrenceRule を作成
            let mut rule = model
                .to_domain_model()
                .await
                .map_err(|e: String| RepositoryError::from(SQLiteError::ConversionError(e)))?;

            // 2. adjustment を読み込む
            rule.adjustment = self.load_adjustment(db, project_id, id).await?;

            // 3. details を読み込む
            rule.details = self.load_details(db, project_id, id).await?;

            // 4. days_of_week を読み込む
            rule.days_of_week = self.load_days_of_week(db, project_id, id).await?;

            Ok(Some(rule))
        } else {
            Ok(None)
        }
    }

    async fn find_all(
        &self,
        project_id: &ProjectId,
    ) -> Result<Vec<RecurrenceRule>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(|e| RepositoryError::from(e))?;

        let models = RecurrenceRuleEntity::find()
            .filter(Column::ProjectId.eq(project_id.to_string()))
            .order_by_asc(Column::CreatedAt)
            .all(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        let mut rules = Vec::new();
        for model in models {
            // 1. ベースの RecurrenceRule を作成
            let mut rule = model
                .to_domain_model()
                .await
                .map_err(|e: String| RepositoryError::from(SQLiteError::ConversionError(e)))?;

            // 2. adjustment を読み込む
            let rule_id = rule.id.clone();
            rule.adjustment = self.load_adjustment(db, project_id, &rule_id).await?;

            // 3. details を読み込む
            rule.details = self.load_details(db, project_id, &rule_id).await?;

            // 4. days_of_week を読み込む
            rule.days_of_week = self.load_days_of_week(db, project_id, &rule_id).await?;

            rules.push(rule);
        }

        Ok(rules)
    }

    async fn delete(
        &self,
        project_id: &ProjectId,
        id: &RecurrenceRuleId,
    ) -> Result<(), RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(|e| RepositoryError::from(e))?;

        RecurrenceRuleEntity::delete_by_id((project_id.to_string(), id.to_string()))
            .exec(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;
        Ok(())
    }

    async fn exists(
        &self,
        project_id: &ProjectId,
        id: &RecurrenceRuleId,
    ) -> Result<bool, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(|e| RepositoryError::from(e))?;
        let count = RecurrenceRuleEntity::find_by_id((project_id.to_string(), id.to_string()))
            .count(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;
        Ok(count > 0)
    }

    async fn count(&self, project_id: &ProjectId) -> Result<u64, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(|e| RepositoryError::from(e))?;
        let count = RecurrenceRuleEntity::find()
            .filter(Column::ProjectId.eq(project_id.to_string()))
            .count(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;
        Ok(count)
    }
}

/// DayOfWeek enum を文字列に変換
fn day_of_week_to_string(day: &flequit_model::types::datetime_calendar_types::DayOfWeek) -> String {
    use flequit_model::types::datetime_calendar_types::DayOfWeek;
    match day {
        DayOfWeek::Monday => "monday",
        DayOfWeek::Tuesday => "tuesday",
        DayOfWeek::Wednesday => "wednesday",
        DayOfWeek::Thursday => "thursday",
        DayOfWeek::Friday => "friday",
        DayOfWeek::Saturday => "saturday",
        DayOfWeek::Sunday => "sunday",
    }
    .to_string()
}

/// WeekOfMonth enum を文字列に変換
fn week_of_month_to_string(
    week: &flequit_model::types::datetime_calendar_types::WeekOfMonth,
) -> String {
    use flequit_model::types::datetime_calendar_types::WeekOfMonth;
    match week {
        WeekOfMonth::First => "first",
        WeekOfMonth::Second => "second",
        WeekOfMonth::Third => "third",
        WeekOfMonth::Fourth => "fourth",
        WeekOfMonth::Last => "last",
    }
    .to_string()
}

/// DateRelation enum を文字列に変換
fn date_relation_to_string(
    relation: &flequit_model::types::datetime_calendar_types::DateRelation,
) -> String {
    use flequit_model::types::datetime_calendar_types::DateRelation;
    match relation {
        DateRelation::Before => "before",
        DateRelation::OnOrBefore => "on_or_before",
        DateRelation::Same => "same",
        DateRelation::OnOrAfter => "on_or_after",
        DateRelation::After => "after",
    }
    .to_string()
}

/// AdjustmentDirection enum を文字列に変換
fn adjustment_direction_to_string(
    direction: &flequit_model::types::datetime_calendar_types::AdjustmentDirection,
) -> String {
    use flequit_model::types::datetime_calendar_types::AdjustmentDirection;
    match direction {
        AdjustmentDirection::Previous => "previous",
        AdjustmentDirection::Next => "next",
        AdjustmentDirection::Nearest => "nearest",
    }
    .to_string()
}

/// AdjustmentTarget enum を文字列に変換
fn adjustment_target_to_string(
    target: &flequit_model::types::datetime_calendar_types::AdjustmentTarget,
) -> String {
    use flequit_model::types::datetime_calendar_types::AdjustmentTarget;
    match target {
        AdjustmentTarget::Weekday => "weekday",
        AdjustmentTarget::Weekend => "weekend",
        AdjustmentTarget::Holiday => "holiday",
        AdjustmentTarget::NonHoliday => "non_holiday",
        AdjustmentTarget::WeekendOnly => "weekend_only",
        AdjustmentTarget::NonWeekend => "non_weekend",
        AdjustmentTarget::WeekendHoliday => "weekend_holiday",
        AdjustmentTarget::NonWeekendHoliday => "non_weekend_holiday",
        AdjustmentTarget::SpecificWeekday => "specific_weekday",
        AdjustmentTarget::Days => "days",
    }
    .to_string()
}

/// 文字列を DayOfWeek enum に変換
fn string_to_day_of_week(s: &str) -> flequit_model::types::datetime_calendar_types::DayOfWeek {
    use flequit_model::types::datetime_calendar_types::DayOfWeek;
    match s {
        "monday" => DayOfWeek::Monday,
        "tuesday" => DayOfWeek::Tuesday,
        "wednesday" => DayOfWeek::Wednesday,
        "thursday" => DayOfWeek::Thursday,
        "friday" => DayOfWeek::Friday,
        "saturday" => DayOfWeek::Saturday,
        "sunday" => DayOfWeek::Sunday,
        _ => DayOfWeek::Monday, // デフォルト
    }
}

/// 文字列を WeekOfMonth enum に変換
fn string_to_week_of_month(
    s: &str,
) -> flequit_model::types::datetime_calendar_types::WeekOfMonth {
    use flequit_model::types::datetime_calendar_types::WeekOfMonth;
    match s {
        "first" => WeekOfMonth::First,
        "second" => WeekOfMonth::Second,
        "third" => WeekOfMonth::Third,
        "fourth" => WeekOfMonth::Fourth,
        "last" => WeekOfMonth::Last,
        _ => WeekOfMonth::First,
    }
}

/// 文字列を DateRelation enum に変換
fn string_to_date_relation(
    s: &str,
) -> flequit_model::types::datetime_calendar_types::DateRelation {
    use flequit_model::types::datetime_calendar_types::DateRelation;
    match s {
        "before" => DateRelation::Before,
        "on_or_before" => DateRelation::OnOrBefore,
        "same" => DateRelation::Same,
        "on_or_after" => DateRelation::OnOrAfter,
        "after" => DateRelation::After,
        _ => DateRelation::Same,
    }
}

/// 文字列を AdjustmentDirection enum に変換
fn string_to_adjustment_direction(
    s: &str,
) -> flequit_model::types::datetime_calendar_types::AdjustmentDirection {
    use flequit_model::types::datetime_calendar_types::AdjustmentDirection;
    match s {
        "previous" => AdjustmentDirection::Previous,
        "next" => AdjustmentDirection::Next,
        "nearest" => AdjustmentDirection::Nearest,
        _ => AdjustmentDirection::Next, // デフォルト
    }
}

/// 文字列を AdjustmentTarget enum に変換
fn string_to_adjustment_target(
    s: &str,
) -> flequit_model::types::datetime_calendar_types::AdjustmentTarget {
    use flequit_model::types::datetime_calendar_types::AdjustmentTarget;
    match s {
        "weekday" => AdjustmentTarget::Weekday,
        "weekend" => AdjustmentTarget::Weekend,
        "holiday" => AdjustmentTarget::Holiday,
        "non_holiday" => AdjustmentTarget::NonHoliday,
        "weekend_only" => AdjustmentTarget::WeekendOnly,
        "non_weekend" => AdjustmentTarget::NonWeekend,
        "weekend_holiday" => AdjustmentTarget::WeekendHoliday,
        "non_weekend_holiday" => AdjustmentTarget::NonWeekendHoliday,
        "specific_weekday" => AdjustmentTarget::SpecificWeekday,
        "days" => AdjustmentTarget::Days,
        _ => AdjustmentTarget::Weekday, // デフォルト
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::task_projects::recurrence_adjustment::{
        Column as RecurrenceAdjustmentColumn, Entity as RecurrenceAdjustmentEntity,
    };
    use crate::models::task_projects::recurrence_date_condition::{
        Column as RecurrenceDateConditionColumn, Entity as RecurrenceDateConditionEntity,
    };
    use crate::models::task_projects::recurrence_days_of_week::{
        Column as RecurrenceDaysOfWeekColumn, Entity as RecurrenceDaysOfWeekEntity,
    };
    use crate::models::task_projects::recurrence_detail::{
        Column as RecurrenceDetailColumn, Entity as RecurrenceDetailEntity,
    };
    use chrono::Duration;
    use flequit_model::models::task_projects::{
        date_condition::DateCondition, recurrence_adjustment::RecurrenceAdjustment,
        recurrence_details::RecurrenceDetails, recurrence_rule::RecurrenceRule,
        weekday_condition::WeekdayCondition,
    };
    use flequit_model::types::{
        datetime_calendar_types::{
            AdjustmentDirection, AdjustmentTarget, DateRelation, DayOfWeek, RecurrenceUnit,
            WeekOfMonth,
        },
        id_types::{DateConditionId, ProjectId, RecurrenceAdjustmentId, RecurrenceRuleId, UserId, WeekdayConditionId},
    };
    use sea_orm::{
        ConnectionTrait, DatabaseBackend, EntityTrait, PaginatorTrait, QueryFilter, Statement,
    };
    use tempfile::TempDir;

    async fn create_test_repository(
    ) -> Result<(TempDir, RecurrenceRuleLocalSqliteRepository), Box<dyn std::error::Error>> {
        let temp_dir = tempfile::tempdir()?;
        let db_path = temp_dir.path().join("recurrence_rule_test.sqlite");
        let db_manager = Arc::new(RwLock::new(DatabaseManager::new_for_test(
            db_path.to_string_lossy().to_string(),
        )));

        {
            let db_manager_ref = db_manager.read().await;
            db_manager_ref.get_connection().await?;
        }

        Ok((temp_dir, RecurrenceRuleLocalSqliteRepository::new(db_manager)))
    }

    async fn seed_user_and_project(
        repo: &RecurrenceRuleLocalSqliteRepository,
        project_id: &ProjectId,
        user_id: &UserId,
        now: DateTime<Utc>,
    ) -> Result<(), Box<dyn std::error::Error>> {
        let db_manager = repo.db_manager.read().await;
        let db = db_manager.get_connection().await?;
        let user_id_str = user_id.to_string();
        let project_id_str = project_id.to_string();
        let username = format!("test_user_{}", user_id_str);

        db.execute(Statement::from_sql_and_values(
            DatabaseBackend::Sqlite,
            r#"
            INSERT INTO users (
                id, handle_id, display_name, email, avatar_url,
                bio, timezone, is_active, created_at, updated_at, deleted, updated_by
            ) VALUES (?, ?, ?, NULL, NULL, NULL, NULL, TRUE, ?, ?, FALSE, ?)
            "#,
            vec![
                user_id_str.clone().into(),
                username.into(),
                "Test User".into(),
                now.into(),
                now.into(),
                user_id_str.clone().into(),
            ],
        ))
        .await?;

        db.execute(Statement::from_sql_and_values(
            DatabaseBackend::Sqlite,
            r#"
            INSERT INTO projects (
                id, name, description, color, order_index, is_archived,
                status, owner_id, created_at, updated_at, deleted, updated_by
            ) VALUES (?, ?, NULL, NULL, 0, FALSE, NULL, ?, ?, ?, FALSE, ?)
            "#,
            vec![
                project_id_str.into(),
                "Test Project".into(),
                user_id_str.clone().into(),
                now.into(),
                now.into(),
                user_id_str.into(),
            ],
        ))
        .await?;

        Ok(())
    }

    fn build_full_rule(
        rule_id: RecurrenceRuleId,
        user_id: UserId,
        now: DateTime<Utc>,
    ) -> RecurrenceRule {
        let adjustment_date_condition = DateCondition {
            id: DateConditionId::new(),
            relation: DateRelation::OnOrAfter,
            reference_date: now + Duration::days(10),
            created_at: now,
            updated_at: now,
            deleted: false,
            updated_by: user_id,
        };

        let detail_date_condition = DateCondition {
            id: DateConditionId::new(),
            relation: DateRelation::Before,
            reference_date: now + Duration::days(30),
            created_at: now,
            updated_at: now,
            deleted: false,
            updated_by: user_id,
        };

        let weekday_condition = WeekdayCondition {
            id: WeekdayConditionId::new(),
            if_weekday: DayOfWeek::Saturday,
            then_direction: AdjustmentDirection::Next,
            then_target: AdjustmentTarget::Weekday,
            then_weekday: Some(DayOfWeek::Monday),
            then_days: None,
            created_at: now,
            updated_at: now,
            deleted: false,
            updated_by: user_id,
        };

        let adjustment = RecurrenceAdjustment {
            id: RecurrenceAdjustmentId::new(),
            recurrence_rule_id: rule_id,
            date_conditions: vec![adjustment_date_condition],
            weekday_conditions: vec![weekday_condition],
            created_at: now,
            updated_at: now,
            deleted: false,
            updated_by: user_id,
        };

        let details = RecurrenceDetails {
            specific_date: Some(15),
            week_of_period: Some(WeekOfMonth::Second),
            weekday_of_week: Some(DayOfWeek::Tuesday),
            date_conditions: Some(vec![detail_date_condition]),
            created_at: now,
            updated_at: now,
            deleted: false,
            updated_by: user_id,
        };

        RecurrenceRule {
            id: rule_id,
            unit: RecurrenceUnit::Month,
            interval: 1,
            days_of_week: Some(vec![DayOfWeek::Monday, DayOfWeek::Friday]),
            details: Some(details),
            adjustment: Some(adjustment),
            end_date: Some(now + Duration::days(90)),
            max_occurrences: Some(6),
            created_at: now,
            updated_at: now,
            deleted: false,
            updated_by: user_id,
        }
    }

    fn sorted_day_strings(days: Option<Vec<DayOfWeek>>) -> Vec<String> {
        let mut values = days
            .unwrap_or_default()
            .into_iter()
            .map(|d| day_of_week_to_string(&d))
            .collect::<Vec<_>>();
        values.sort();
        values
    }

    #[test]
    fn test_conversion_helpers_roundtrip() {
        assert_eq!(
            week_of_month_to_string(&WeekOfMonth::Fourth),
            "fourth".to_string()
        );
        assert!(matches!(
            string_to_week_of_month("fourth"),
            WeekOfMonth::Fourth
        ));

        assert_eq!(
            date_relation_to_string(&DateRelation::OnOrBefore),
            "on_or_before".to_string()
        );
        assert!(matches!(
            string_to_date_relation("on_or_before"),
            DateRelation::OnOrBefore
        ));
    }

    #[tokio::test]
    async fn test_save_and_find_by_id_with_related_data() -> Result<(), Box<dyn std::error::Error>> {
        let (_temp_dir, repo) = create_test_repository().await?;

        let project_id = ProjectId::new();
        let user_id = UserId::new();
        let now = Utc::now();
        let rule_id = RecurrenceRuleId::new();
        let rule = build_full_rule(rule_id, user_id, now);
        seed_user_and_project(&repo, &project_id, &user_id, now).await?;

        repo.save(&project_id, &rule, &user_id, &now).await?;

        let loaded = repo.find_by_id(&project_id, &rule_id).await?;
        let loaded = loaded.expect("rule should exist");

        assert_eq!(loaded.interval, 1);
        assert!(matches!(loaded.unit, RecurrenceUnit::Month));

        assert_eq!(
            sorted_day_strings(loaded.days_of_week),
            vec!["friday".to_string(), "monday".to_string()]
        );

        let loaded_details = loaded.details.expect("details should be loaded");
        assert_eq!(loaded_details.specific_date, Some(15));
        assert!(matches!(
            loaded_details.week_of_period,
            Some(WeekOfMonth::Second)
        ));
        assert!(matches!(
            loaded_details.weekday_of_week,
            Some(DayOfWeek::Tuesday)
        ));
        assert_eq!(
            loaded_details
                .date_conditions
                .as_ref()
                .map(|v| v.len())
                .unwrap_or_default(),
            1
        );

        let loaded_adjustment = loaded.adjustment.expect("adjustment should be loaded");
        assert_eq!(loaded_adjustment.date_conditions.len(), 1);
        assert_eq!(loaded_adjustment.weekday_conditions.len(), 1);
        assert!(matches!(
            loaded_adjustment.weekday_conditions[0].if_weekday,
            DayOfWeek::Saturday
        ));

        Ok(())
    }

    #[tokio::test]
    async fn test_update_replaces_related_data() -> Result<(), Box<dyn std::error::Error>> {
        let (_temp_dir, repo) = create_test_repository().await?;

        let project_id = ProjectId::new();
        let user_id = UserId::new();
        let now = Utc::now();
        let rule_id = RecurrenceRuleId::new();
        seed_user_and_project(&repo, &project_id, &user_id, now).await?;

        // 初回は関連データありで保存
        let initial_rule = build_full_rule(rule_id, user_id, now);
        repo.save(&project_id, &initial_rule, &user_id, &now).await?;

        // 2回目は関連データを外して保存（削除再作成戦略を検証）
        let updated_rule = RecurrenceRule {
            id: rule_id,
            unit: RecurrenceUnit::Week,
            interval: 2,
            days_of_week: None,
            details: None,
            adjustment: None,
            end_date: None,
            max_occurrences: Some(3),
            created_at: initial_rule.created_at,
            updated_at: now + Duration::minutes(1),
            deleted: false,
            updated_by: user_id,
        };
        repo.save(&project_id, &updated_rule, &user_id, &now).await?;

        let loaded = repo
            .find_by_id(&project_id, &rule_id)
            .await?
            .expect("rule should exist");
        assert!(matches!(loaded.unit, RecurrenceUnit::Week));
        assert_eq!(loaded.interval, 2);
        assert!(loaded.adjustment.is_none());
        assert!(loaded.details.is_none());
        assert!(loaded.days_of_week.is_none());

        // 関連テーブルの実レコードも削除されていることを確認
        let db_manager = repo.db_manager.read().await;
        let db = db_manager.get_connection().await?;

        let adjustment_count = RecurrenceAdjustmentEntity::find()
            .filter(RecurrenceAdjustmentColumn::ProjectId.eq(project_id.to_string()))
            .filter(RecurrenceAdjustmentColumn::RecurrenceRuleId.eq(rule_id.to_string()))
            .count(db)
            .await?;
        assert_eq!(adjustment_count, 0);

        let detail_count = RecurrenceDetailEntity::find()
            .filter(RecurrenceDetailColumn::ProjectId.eq(project_id.to_string()))
            .filter(RecurrenceDetailColumn::RecurrenceRuleId.eq(rule_id.to_string()))
            .count(db)
            .await?;
        assert_eq!(detail_count, 0);

        let day_count = RecurrenceDaysOfWeekEntity::find()
            .filter(RecurrenceDaysOfWeekColumn::ProjectId.eq(project_id.to_string()))
            .filter(RecurrenceDaysOfWeekColumn::RecurrenceRuleId.eq(rule_id.to_string()))
            .count(db)
            .await?;
        assert_eq!(day_count, 0);

        let date_condition_count = RecurrenceDateConditionEntity::find()
            .filter(RecurrenceDateConditionColumn::ProjectId.eq(project_id.to_string()))
            .count(db)
            .await?;
        assert_eq!(date_condition_count, 0);

        Ok(())
    }
}
