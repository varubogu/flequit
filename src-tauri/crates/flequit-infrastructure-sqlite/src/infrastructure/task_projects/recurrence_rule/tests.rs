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
        AdjustmentDirection, AdjustmentTarget, DateRelation, DayOfWeek, RecurrenceUnit, WeekOfMonth,
    },
    id_types::{
        DateConditionId, ProjectId, RecurrenceAdjustmentId, RecurrenceRuleId, UserId,
        WeekdayConditionId,
    },
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

    Ok((
        temp_dir,
        RecurrenceRuleLocalSqliteRepository::new(db_manager),
    ))
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
    repo.save(&project_id, &initial_rule, &user_id, &now)
        .await?;

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
    repo.save(&project_id, &updated_rule, &user_id, &now)
        .await?;

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
