use super::*;

impl RecurrenceRuleLocalSqliteRepository {
    pub(super) async fn delete_related_data<C>(
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
                .filter(
                    RecurrenceDateConditionColumn::RecurrenceAdjustmentId
                        .eq(Some(adjustment_id.clone())),
                )
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

    pub(super) async fn save_adjustment<C>(
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
            let then_direction_str =
                adjustment_direction_to_string(&weekday_condition.then_direction);
            let then_target_str = adjustment_target_to_string(&weekday_condition.then_target);
            let then_weekday_str = weekday_condition
                .then_weekday
                .as_ref()
                .map(day_of_week_to_string);

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

    pub(super) async fn save_details<C>(
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
            week_of_period: Set(details.week_of_period.as_ref().map(week_of_month_to_string)),
            weekday_of_week: Set(details.weekday_of_week.as_ref().map(day_of_week_to_string)),
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

    pub(super) async fn save_days_of_week<C>(
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
}
