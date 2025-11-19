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
    Column as RecurrenceDaysOfWeekColumn,
    Entity as RecurrenceDaysOfWeekEntity,
};
use crate::models::{DomainToSqliteConverterWithProjectId, SqliteModelConverter};
use async_trait::async_trait;
use chrono::{DateTime, Utc};
use flequit_model::models::task_projects::recurrence_rule::RecurrenceRule;
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

        // TODO: Phase 2.2 で details と関連する date_conditions の削除を追加

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
        use flequit_model::types::datetime_calendar_types::DateRelation;
        use flequit_model::types::id_types::{
            DateConditionId, RecurrenceAdjustmentId, WeekdayConditionId,
        };
        use flequit_model::models::task_projects::date_condition::DateCondition;
        use flequit_model::models::task_projects::weekday_condition::WeekdayCondition;

        let rule_id_str = rule_id.to_string();
        let project_id_str = project_id.to_string();

        // 1. adjustment を取得
        let adjustment_model = RecurrenceAdjustmentEntity::find()
            .filter(RecurrenceAdjustmentColumn::ProjectId.eq(&project_id_str))
            .filter(RecurrenceAdjustmentColumn::RecurrenceRuleId.eq(&rule_id_str))
            .one(txn)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        if let Some(adj) = adjustment_model {
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
                    let relation = match dc.relation.as_str() {
                        "before" => DateRelation::Before,
                        "on_or_before" => DateRelation::OnOrBefore,
                        "same" => DateRelation::Same,
                        "on_or_after" => DateRelation::OnOrAfter,
                        "after" => DateRelation::After,
                        _ => DateRelation::Same,
                    };

                    DateCondition {
                        id: DateConditionId::from(dc.id),
                        relation,
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
        use flequit_model::types::datetime_calendar_types::DateRelation;

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
            let relation_str = match date_condition.relation {
                DateRelation::Before => "before",
                DateRelation::OnOrBefore => "on_or_before",
                DateRelation::Same => "same",
                DateRelation::OnOrAfter => "on_or_after",
                DateRelation::After => "after",
            };

            let date_condition_active = RecurrenceDateConditionActiveModel {
                project_id: Set(project_id.to_string()),
                id: Set(date_condition.id.to_string()),
                recurrence_adjustment_id: Set(Some(adjustment.id.to_string())),
                recurrence_detail_id: Set(None),
                relation: Set(relation_str.to_string()),
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
        if let Some(ref adjustment) = rule.adjustment {
            self.save_adjustment(&txn, project_id, &rule.id, adjustment)
                .await?;
        }

        // 4. details の保存（未実装のためスキップ）
        // TODO: Phase 2.2 で実装

        // 5. days_of_week の保存（未実装のためスキップ）
        // TODO: Phase 2.3 で実装

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

            // TODO: Phase 2.2 で details を読み込む
            // TODO: Phase 2.3 で days_of_week を読み込む

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
            let rule_id = &rule.id.clone();
            rule.adjustment = self.load_adjustment(db, project_id, rule_id).await?;

            // TODO: Phase 2.2 で details を読み込む
            // TODO: Phase 2.3 で days_of_week を読み込む

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
