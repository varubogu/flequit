use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};
use async_trait::async_trait;
use super::recurrence_adjustment::RecurrenceAdjustment;
use super::recurrence_details::RecurrenceDetails;
use super::subtask_recurrence::SubTaskRecurrence;
use super::task_recurrence::TaskRecurrence;
use crate::models::ModelConverter;
use crate::types::datetime_calendar_types::{DayOfWeek, RecurrenceUnit};
use crate::types::id_types::RecurrenceRuleId;

/// 統合繰り返しルールを表現する構造体
///
/// タスクやイベントの完全な繰り返しパターンを定義するメイン構造体です。
/// 基本的な周期から複雑な調整条件まで、あらゆる繰り返しパターンを表現できます。
///
/// # フィールド
///
/// ## 基本繰り返し
/// * `unit` - 繰り返し単位（日・週・月・年等）
/// * `interval` - 繰り返し間隔（2週毎なら2）
/// * `days_of_week` - 特定曜日のリスト（週次繰り返し用）
///
/// ## 詳細設定
/// * `details` - 詳細パターン設定（月の特定日等）
/// * `adjustment` - 補正条件（営業日調整等）
///
/// ## 終了条件
/// * `end_date` - 終了日（指定日まで繰り返し）
/// * `max_occurrences` - 最大回数（指定回数まで繰り返し）
///
/// # 使用パターン
///
/// ## 毎週火・木
/// ```rust,no_run
/// # use flequit_model::models::recurrence_rule::RecurrenceRule;
/// # use flequit_model::types::datetime_calendar_types::{RecurrenceUnit, DayOfWeek};
///
/// let weekly_rule = RecurrenceRule {
///     unit: RecurrenceUnit::Week,
///     interval: 1,
///     days_of_week: Some(vec![DayOfWeek::Tuesday, DayOfWeek::Thursday]),
///     details: None,
///     adjustment: None,
///     end_date: None,
///     max_occurrences: None,
/// };
/// ```
///
/// ## 毎月最終営業日
/// ```rust,no_run
/// # use flequit_model::models::datetime_condition::WeekdayCondition;
/// # use flequit_model::models::recurrence_rule::RecurrenceRule;
/// # use flequit_model::models::recurrence::{RecurrenceDetails, RecurrenceAdjustment};
/// # use flequit_model::types::datetime_calendar_types::{RecurrenceUnit, WeekOfMonth, DayOfWeek, AdjustmentDirection, AdjustmentTarget};
///
/// let last_business_day = RecurrenceRule {
///     unit: RecurrenceUnit::Month,
///     interval: 1,
///     days_of_week: None,
///     details: Some(RecurrenceDetails {
///         specific_date: None,
///         week_of_period: Some(WeekOfMonth::Last),
///         weekday_of_week: Some(DayOfWeek::Friday),
///         date_conditions: None,
///     }),
///     adjustment: Some(RecurrenceAdjustment {
///         date_conditions: vec![],
///         weekday_conditions: vec![
///             WeekdayCondition {
///                 id: "weekend_adjustment".to_string(),
///                 if_weekday: DayOfWeek::Saturday,
///                 then_direction: AdjustmentDirection::Previous,
///                 then_target: AdjustmentTarget::Weekday,
///                 then_weekday: Some(DayOfWeek::Friday),
///                 then_days: None,
///             }
///         ],
///     }),
///     end_date: None,
///     max_occurrences: None,
/// };
/// ```
///
/// # 処理フロー
///
/// 1. `unit`と`interval`で基本周期を計算
/// 2. `days_of_week`で曜日フィルタリング
/// 3. `details`で詳細パターン適用
/// 4. `adjustment`で最終調整
/// 5. `end_date`または`max_occurrences`で終了判定
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecurrenceRule {
    /// 繰り返しルールの一意識別子
    pub id: RecurrenceRuleId,
    /// 繰り返し単位（日・週・月・年等）
    pub unit: RecurrenceUnit,
    /// 繰り返し間隔（2週毎なら2）
    pub interval: i32,
    /// 特定曜日のリスト（週次繰り返し用）
    pub days_of_week: Option<Vec<DayOfWeek>>,
    /// 詳細パターン設定（月の特定日等）
    pub details: Option<RecurrenceDetails>,
    /// 補正条件（営業日調整等）
    pub adjustment: Option<RecurrenceAdjustment>,
    /// 終了日（指定日まで繰り返し）
    pub end_date: Option<DateTime<Utc>>,
    /// 最大回数（指定回数まで繰り返し）
    pub max_occurrences: Option<i32>,
}

/// 繰り返しルールとその関連情報を含むTree構造体
///
/// 繰り返しルール情報に加えて、このルールが適用されたタスクや
/// サブタスクの関連付け情報を階層構造で管理します。
/// フロントエンドで繰り返しタスクの管理や統計情報を表示する際に使用されます。
///
/// # フィールド
///
/// * `id` - 繰り返しルールの一意識別子（SQLiteで管理）
/// * `unit` - 繰り返し単位（日・週・月・年等）
/// * `interval` - 繰り返し間隔（2週毎なら2）
/// * `days_of_week` - 特定曜日のリスト（週次繰り返し用）
/// * `details` - 詳細パターン設定（月の特定日等）
/// * `adjustment` - 補正条件（営業日調整等）
/// * `end_date` - 終了日（指定日まで繰り返し）
/// * `max_occurrences` - 最大回数（指定回数まで繰り返し）
/// * `task_recurrences` - このルールが適用されたタスクとの関連付け情報一覧
/// * `subtask_recurrences` - このルールが適用されたサブタスクとの関連付け情報一覧
///
/// # 使用例
///
/// ```rust,no_run
/// # use chrono::Utc;
/// # use flequit_model::models::recurrence_rule::{RecurrenceRuleTree, RecurrenceRule};
/// # use flequit_model::models::recurrence_association::{TaskRecurrence, SubtaskRecurrence};
/// # use flequit_model::types::datetime_calendar_types::RecurrenceUnit;
/// # use flequit_model::types::id_types::{TaskId, SubTaskId};
///
/// let recurrence_tree = RecurrenceRuleTree {
///     id: "rule_123".to_string(),
///     unit: RecurrenceUnit::Week,
///     interval: 1,
///     days_of_week: None,
///     details: None,
///     adjustment: None,
///     end_date: None,
///     max_occurrences: Some(10),
///     task_recurrences: vec![
///         TaskRecurrence {
///             task_id: TaskId::from("task_456".to_string()),
///             recurrence_rule_id: "rule_123".to_string(),
///             created_at: Utc::now(),
///         }
///     ],
///     subtask_recurrences: vec![],
/// };
/// ```
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecurrenceRuleTree {
    /// 繰り返しルールの一意識別子
    pub id: RecurrenceRuleId,
    /// 繰り返し単位（日・週・月・年等）
    pub unit: RecurrenceUnit,
    /// 繰り返し間隔（2週毎なら2）
    pub interval: i32,
    /// 特定曜日のリスト（週次繰り返し用）
    pub days_of_week: Option<Vec<DayOfWeek>>,
    /// 詳細パターン設定（月の特定日等）
    pub details: Option<RecurrenceDetails>,
    /// 補正条件（営業日調整等）
    pub adjustment: Option<RecurrenceAdjustment>,
    /// 終了日（指定日まで繰り返し）
    pub end_date: Option<DateTime<Utc>>,
    /// 最大回数（指定回数まで繰り返し）
    pub max_occurrences: Option<i32>,
    /// このルールが適用されたタスクとの関連付け情報一覧
    pub task_recurrences: Vec<TaskRecurrence>,
    /// このルールが適用されたサブタスクとの関連付け情報一覧
    pub subtask_recurrences: Vec<SubTaskRecurrence>,
}

#[async_trait]
impl ModelConverter<RecurrenceRule> for RecurrenceRuleTree {
    async fn to_model(&self) -> Result<RecurrenceRule, String> {
        // RecurrenceRuleTreeからRecurrenceRule基本構造体に変換（関連データのtask_recurrences, subtask_recurrencesは除く）
        Ok(RecurrenceRule {
            id: self.id.clone(),
            unit: self.unit.clone(),
            interval: self.interval,
            days_of_week: self.days_of_week.clone(),
            details: self.details.clone(),
            adjustment: self.adjustment.clone(),
            end_date: self.end_date,
            max_occurrences: self.max_occurrences,
        })
    }
}
