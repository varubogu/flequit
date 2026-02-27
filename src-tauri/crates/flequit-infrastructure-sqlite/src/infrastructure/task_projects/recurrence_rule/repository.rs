use super::*;

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
            .map_err(RepositoryError::from)?;

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
        self.delete_related_data(&txn, project_id, &rule.id).await?;

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
            .map_err(RepositoryError::from)?;

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
            .map_err(RepositoryError::from)?;

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
            let rule_id = rule.id;
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
            .map_err(RepositoryError::from)?;

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
            .map_err(RepositoryError::from)?;
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
            .map_err(RepositoryError::from)?;
        let count = RecurrenceRuleEntity::find()
            .filter(Column::ProjectId.eq(project_id.to_string()))
            .count(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;
        Ok(count)
    }
}
