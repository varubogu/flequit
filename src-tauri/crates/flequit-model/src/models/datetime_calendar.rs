//! カレンダー日時管理モデル
//!
//! このモジュールはタスクやイベントの複雑な日時パターンを管理する構造体を定義します。
//!
//! ## 概要
//!
//! カレンダー日時管理では以下の主要構造体を提供：
//! - `DateCondition`: 特定日付に基づく条件
//! - `WeekdayCondition`: 曜日に基づく条件
//! - `RecurrenceAdjustment`: 繰り返し補正ルール
//! - `RecurrenceDetails`: 繰り返し詳細設定
//! - `RecurrenceRule`: 統合繰り返しルール

use super::{recurrence_association::{TaskRecurrence, SubtaskRecurrence}, ModelConverter};
use super::super::types::datetime_calendar_types::{
    AdjustmentDirection, AdjustmentTarget, DateRelation, DayOfWeek, RecurrenceUnit, WeekOfMonth,
};
use async_trait::async_trait;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

/// 日付に基づく条件を表現する構造体
///
/// 特定の基準日に対する相対的な関係性を定義し、
/// 繰り返しルールの適用条件や調整条件として使用されます。
///
/// # フィールド
///
/// * `id` - 条件の一意識別子
/// * `relation` - 基準日との関係性（前、後、同じ等）
/// * `reference_date` - 比較基準となる日付
///
/// # 使用例
///
/// ```rust,no_run
/// # use chrono::Utc;
/// # use flequit_model::models::datetime_calendar::DateCondition;
/// # use flequit_model::types::datetime_calendar_types::DateRelation;
///
/// // 特定日以降の条件
/// let after_condition = DateCondition {
///     id: "after_new_year".to_string(),
///     relation: DateRelation::After,
///     reference_date: "2024-01-01T00:00:00Z".parse().unwrap(),
/// };
/// ```
///
/// # 使用場面
///
/// - 期間限定タスクの適用条件
/// - 季節的なタスクの開始・終了条件
/// - 祝日回避などの調整条件
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DateCondition {
    /// 条件の一意識別子
    pub id: String,
    /// 基準日との関係性（前、後、同じ等）
    pub relation: DateRelation,
    /// 比較基準となる日付
    pub reference_date: DateTime<Utc>,
}

/// 曜日に基づく条件調整を表現する構造体
///
/// 指定された曜日に該当する場合の日付調整ルールを定義します。
/// ビジネス日への調整や曜日固定のタスク管理に使用されます。
///
/// # フィールド
///
/// * `id` - 条件の一意識別子
/// * `if_weekday` - 判定対象の曜日
/// * `then_direction` - 調整方向（前・後・最近等）
/// * `then_target` - 調整対象（平日・特定曜日・日数等）
/// * `then_weekday` - 調整先の曜日（target=特定曜日の場合）
/// * `then_days` - 調整日数（target=日数の場合）
///
/// # 使用例
///
/// ```rust,no_run
/// # use flequit_model::models::datetime_calendar::WeekdayCondition;
/// # use flequit_model::types::datetime_calendar_types::{DayOfWeek, AdjustmentDirection, AdjustmentTarget};
///
/// // 土曜日なら翌営業日（月曜日）に調整
/// let weekend_adjustment = WeekdayCondition {
///     id: "saturday_to_monday".to_string(),
///     if_weekday: DayOfWeek::Saturday,
///     then_direction: AdjustmentDirection::Next,
///     then_target: AdjustmentTarget::Weekday,
///     then_weekday: Some(DayOfWeek::Monday),
///     then_days: None,
/// };
/// ```
///
/// # 使用場面
///
/// - 営業日調整（土日祝日回避）
/// - 定期会議の曜日固定
/// - 月末処理の平日調整
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WeekdayCondition {
    /// 条件の一意識別子
    pub id: String,
    /// 判定対象の曜日
    pub if_weekday: DayOfWeek,
    /// 調整方向（前・後・最近等）
    pub then_direction: AdjustmentDirection,
    /// 調整対象（平日・特定曜日・日数等）
    pub then_target: AdjustmentTarget,
    /// 調整先の曜日（target=特定曜日の場合）
    pub then_weekday: Option<DayOfWeek>,
    /// 調整日数（target=日数の場合）
    pub then_days: Option<i32>,
}

/// 繰り返しルール補正条件を表現する構造体
///
/// 日付条件と曜日条件を組み合わせて、繰り返しパターンの微調整を行います。
/// 複雑なビジネスルールや特殊な繰り返しパターンに対応します。
///
/// # フィールド
///
/// * `date_conditions` - 日付に基づく条件のリスト
/// * `weekday_conditions` - 曜日に基づく条件のリスト
///
/// # 処理順序
///
/// 1. 基本繰り返しルールでベース日付を計算
/// 2. 日付条件で適用可否を判定
/// 3. 曜日条件で最終調整を実行
///
/// # 使用例
///
/// ```rust,no_run
/// # use flequit_model::models::datetime_calendar::{RecurrenceAdjustment, DateCondition, WeekdayCondition};
/// # use flequit_model::types::datetime_calendar_types::{DateRelation, DayOfWeek, AdjustmentDirection, AdjustmentTarget};
/// # use chrono::Utc;
///
/// let business_adjustment = RecurrenceAdjustment {
///     date_conditions: vec![
///         // 祝日回避条件
///         DateCondition {
///             id: "holiday_avoidance".to_string(),
///             relation: DateRelation::OnOrAfter,
///             reference_date: Utc::now(),
///         }
///     ],
///     weekday_conditions: vec![
///         // 土日は翌営業日に調整
///         WeekdayCondition {
///             id: "weekend_to_weekday".to_string(),
///             if_weekday: DayOfWeek::Saturday,
///             then_direction: AdjustmentDirection::Next,
///             then_target: AdjustmentTarget::Weekday,
///             then_weekday: Some(DayOfWeek::Monday),
///             then_days: None,
///         }
///     ],
/// };
/// ```
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecurrenceAdjustment {
    /// 日付に基づく条件のリスト
    pub date_conditions: Vec<DateCondition>,
    /// 曜日に基づく条件のリスト
    pub weekday_conditions: Vec<WeekdayCondition>,
}

/// 繰り返しパターンの詳細設定を表現する構造体
///
/// 基本的な繰り返し周期に加えて、より具体的な発生パターンを定義します。
/// 月の特定日、特定週の特定曜日など、複雑な繰り返しパターンに対応します。
///
/// # フィールド
///
/// * `specific_date` - 月の特定日（1-31、月次繰り返し時）
/// * `week_of_period` - 期間内の特定週（第1週、最終週等）
/// * `weekday_of_week` - 週の特定曜日
/// * `date_conditions` - 追加の日付条件
///
/// # パターン例
///
/// ## 毎月第2火曜日
/// ```rust,no_run
/// # use flequit_model::models::datetime_calendar::RecurrenceDetails;
/// # use flequit_model::types::datetime_calendar_types::{WeekOfMonth, DayOfWeek};
///
/// let second_tuesday = RecurrenceDetails {
///     specific_date: None,
///     week_of_period: Some(WeekOfMonth::Second),
///     weekday_of_week: Some(DayOfWeek::Tuesday),
///     date_conditions: None,
/// };
/// ```
///
/// ## 毎月15日
/// ```rust,no_run
/// # use flequit_model::models::datetime_calendar::RecurrenceDetails;
///
/// let fifteenth_day = RecurrenceDetails {
///     specific_date: Some(15),
///     week_of_period: None,
///     weekday_of_week: None,
///     date_conditions: None,
/// };
/// ```
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecurrenceDetails {
    /// 月の特定日（1-31、月次繰り返し時）
    pub specific_date: Option<i32>,
    /// 期間内の特定週（第1週、最終週等）
    pub week_of_period: Option<WeekOfMonth>,
    /// 週の特定曜日
    pub weekday_of_week: Option<DayOfWeek>,
    /// 追加の日付条件
    pub date_conditions: Option<Vec<DateCondition>>,
}

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
/// # use flequit_model::models::datetime_calendar::RecurrenceRule;
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
/// # use flequit_model::models::datetime_calendar::{RecurrenceRule, RecurrenceDetails, RecurrenceAdjustment, WeekdayCondition};
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
/// # use flequit_model::models::datetime_calendar::{RecurrenceRuleTree, RecurrenceRule};
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
    /// 繰り返しルールの一意識別子（SQLiteで管理）
    pub id: String,
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
    pub subtask_recurrences: Vec<SubtaskRecurrence>,
}

#[async_trait]
impl ModelConverter<RecurrenceRule> for RecurrenceRuleTree {
    async fn to_model(&self) -> Result<RecurrenceRule, String> {
        // RecurrenceRuleTreeからRecurrenceRule基本構造体に変換（関連データのtask_recurrences, subtask_recurrencesは除く）
        Ok(RecurrenceRule {
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
