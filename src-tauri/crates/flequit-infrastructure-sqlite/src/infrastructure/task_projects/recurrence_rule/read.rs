use super::*;

impl RecurrenceRuleLocalSqliteRepository {
    pub(super) async fn load_adjustment<C>(
        &self,
        txn: &C,
        project_id: &ProjectId,
        rule_id: &RecurrenceRuleId,
    ) -> Result<
        Option<flequit_model::models::task_projects::recurrence_adjustment::RecurrenceAdjustment>,
        RepositoryError,
    >
    where
        C: sea_orm::ConnectionTrait,
    {
        use flequit_model::models::task_projects::date_condition::DateCondition;
        use flequit_model::models::task_projects::weekday_condition::WeekdayCondition;
        use flequit_model::types::id_types::{
            DateConditionId, RecurrenceAdjustmentId, WeekdayConditionId,
        };

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
                .filter(
                    RecurrenceDateConditionColumn::RecurrenceAdjustmentId
                        .eq(Some(adjustment_id_str.clone())),
                )
                .all(txn)
                .await
                .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

            let date_conditions: Vec<DateCondition> = date_condition_models
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
                .collect();

            // 3. weekday_conditions を取得
            let weekday_condition_models = RecurrenceWeekdayConditionEntity::find()
                .filter(RecurrenceWeekdayConditionColumn::ProjectId.eq(&project_id_str))
                .filter(
                    RecurrenceWeekdayConditionColumn::RecurrenceAdjustmentId
                        .eq(adjustment_id_str.clone()),
                )
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
            Ok(Some(
                flequit_model::models::task_projects::recurrence_adjustment::RecurrenceAdjustment {
                    id: RecurrenceAdjustmentId::from(adj.id),
                    recurrence_rule_id: RecurrenceRuleId::from(adj.recurrence_rule_id),
                    date_conditions,
                    weekday_conditions,
                    created_at: adj.created_at,
                    updated_at: adj.updated_at,
                    deleted: adj.deleted,
                    updated_by: UserId::from(adj.updated_by),
                },
            ))
        } else {
            tracing::info!(
                "load_adjustment: no adjustment found for project_id={}, rule_id={}",
                project_id_str,
                rule_id_str
            );
            Ok(None)
        }
    }

    pub(super) async fn load_details<C>(
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

    pub(super) async fn load_days_of_week<C>(
        &self,
        txn: &C,
        project_id: &ProjectId,
        rule_id: &RecurrenceRuleId,
    ) -> Result<
        Option<Vec<flequit_model::types::datetime_calendar_types::DayOfWeek>>,
        RepositoryError,
    >
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

    pub async fn find_by_unit(&self, unit: &str) -> Result<Vec<RecurrenceRule>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(RepositoryError::from)?;

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

    pub async fn find_by_interval(
        &self,
        interval: i32,
    ) -> Result<Vec<RecurrenceRule>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(RepositoryError::from)?;

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

    pub async fn find_with_max_occurrences(&self) -> Result<Vec<RecurrenceRule>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(RepositoryError::from)?;

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
