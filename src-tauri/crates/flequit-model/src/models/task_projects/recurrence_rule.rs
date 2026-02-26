use super::recurrence_adjustment::RecurrenceAdjustment;
use super::recurrence_details::RecurrenceDetails;
use super::subtask_recurrence::SubTaskRecurrence;
use super::task_recurrence::TaskRecurrence;
use crate::models::ModelConverter;
use crate::traits::Trackable;
use crate::types::datetime_calendar_types::{DayOfWeek, RecurrenceUnit};
use crate::types::id_types::{RecurrenceRuleId, UserId};
use async_trait::async_trait;
use chrono::{DateTime, Utc};
use partially::Partial;
use serde::{Deserialize, Serialize};

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
/// # use chrono::Utc;
/// # use flequit_model::models::task_projects::recurrence_rule::RecurrenceRule;
/// # use flequit_model::types::datetime_calendar_types::{RecurrenceUnit, DayOfWeek};
/// # use flequit_model::types::id_types::{RecurrenceRuleId, UserId};
///
/// let weekly_rule = RecurrenceRule {
///     id: RecurrenceRuleId::new(),
///     unit: RecurrenceUnit::Week,
///     interval: 1,
///     days_of_week: Some(vec![DayOfWeek::Tuesday, DayOfWeek::Thursday]),
///     details: None,
///     adjustment: None,
///     end_date: None,
///     max_occurrences: None,
///     created_at: Utc::now(),
///     updated_at: Utc::now(),
///     deleted: false,
///     updated_by: UserId::new(),
/// };
/// ```
///
/// ## 毎月最終営業日
/// ```rust,no_run
/// # use chrono::Utc;
/// # use flequit_model::models::task_projects::weekday_condition::WeekdayCondition;
/// # use flequit_model::models::task_projects::recurrence_rule::RecurrenceRule;
/// # use flequit_model::models::task_projects::recurrence_details::RecurrenceDetails;
/// # use flequit_model::models::task_projects::recurrence_adjustment::RecurrenceAdjustment;
/// # use flequit_model::types::datetime_calendar_types::{RecurrenceUnit, WeekOfMonth, DayOfWeek, AdjustmentDirection, AdjustmentTarget};
/// # use flequit_model::types::id_types::{RecurrenceAdjustmentId, RecurrenceRuleId, UserId, WeekdayConditionId};
///
/// let last_business_day = RecurrenceRule {
///     id: RecurrenceRuleId::new(),
///     unit: RecurrenceUnit::Month,
///     interval: 1,
///     days_of_week: None,
///     details: Some(RecurrenceDetails {
///         specific_date: None,
///         week_of_period: Some(WeekOfMonth::Last),
///         weekday_of_week: Some(DayOfWeek::Friday),
///         date_conditions: None,
///         created_at: Utc::now(),
///         updated_at: Utc::now(),
///         deleted: false,
///         updated_by: UserId::new(),
///     }),
///     adjustment: Some(RecurrenceAdjustment {
///         id: RecurrenceAdjustmentId::new(),
///         recurrence_rule_id: RecurrenceRuleId::new(),
///         date_conditions: vec![],
///         weekday_conditions: vec![
///             WeekdayCondition {
///                 id: WeekdayConditionId::new(),
///                 if_weekday: DayOfWeek::Saturday,
///                 then_direction: AdjustmentDirection::Previous,
///                 then_target: AdjustmentTarget::Weekday,
///                 then_weekday: Some(DayOfWeek::Friday),
///                 then_days: None,
///                 created_at: Utc::now(),
///                 updated_at: Utc::now(),
///                 deleted: false,
///                 updated_by: UserId::new(),
///             }
///         ],
///         created_at: Utc::now(),
///         updated_at: Utc::now(),
///         deleted: false,
///         updated_by: UserId::new(),
///     }),
///     end_date: None,
///     max_occurrences: None,
///     created_at: Utc::now(),
///     updated_at: Utc::now(),
///     deleted: false,
///     updated_by: UserId::new(),
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
#[derive(Debug, Clone, Serialize, Deserialize, Partial)]
#[partially(derive(Debug, Clone, Serialize, Deserialize))]
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
    /// 繰り返しルール作成日時
    pub created_at: DateTime<Utc>,
    /// 最終更新日時
    pub updated_at: DateTime<Utc>,
    /// 論理削除フラグ（Automerge同期用）
    pub deleted: bool,
    /// 最終更新者のユーザーID（必須、作成・更新・削除・復元すべての操作で記録）
    pub updated_by: UserId,
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
/// # use flequit_model::models::task_projects::recurrence_rule::RecurrenceRuleTree;
/// # use flequit_model::models::task_projects::task_recurrence::TaskRecurrence;
/// # use flequit_model::types::datetime_calendar_types::RecurrenceUnit;
/// # use flequit_model::types::id_types::{RecurrenceRuleId, TaskId, UserId};
///
/// let rule_id = RecurrenceRuleId::new();
/// let recurrence_tree = RecurrenceRuleTree {
///     id: rule_id,
///     unit: RecurrenceUnit::Week,
///     interval: 1,
///     days_of_week: None,
///     details: None,
///     adjustment: None,
///     end_date: None,
///     max_occurrences: Some(10),
///     created_at: Utc::now(),
///     updated_at: Utc::now(),
///     deleted: false,
///     updated_by: UserId::new(),
///     task_recurrences: vec![
///         TaskRecurrence {
///             task_id: TaskId::from("task_456".to_string()),
///             recurrence_rule_id: rule_id,
///             created_at: Utc::now(),
///             updated_at: Utc::now(),
///             deleted: false,
///             updated_by: UserId::new(),
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
    /// 繰り返しルール作成日時
    pub created_at: DateTime<Utc>,
    /// 最終更新日時
    pub updated_at: DateTime<Utc>,
    /// 論理削除フラグ（Automerge同期用）
    pub deleted: bool,
    /// 最終更新者のユーザーID（必須、作成・更新・削除・復元すべての操作で記録）
    pub updated_by: UserId,
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
            id: self.id,
            unit: self.unit.clone(),
            interval: self.interval,
            days_of_week: self.days_of_week.clone(),
            details: self.details.clone(),
            adjustment: self.adjustment.clone(),
            end_date: self.end_date,
            max_occurrences: self.max_occurrences,
            created_at: self.created_at,
            updated_at: self.updated_at,
            deleted: self.deleted,
            updated_by: self.updated_by,
        })
    }
}

impl Trackable for RecurrenceRule {
    fn mark_created(&mut self, user_id: crate::types::id_types::UserId, timestamp: DateTime<Utc>) {
        self.created_at = timestamp;
        self.updated_at = timestamp;
        self.updated_by = user_id;
        self.deleted = false;
    }

    fn mark_updated(&mut self, user_id: crate::types::id_types::UserId, timestamp: DateTime<Utc>) {
        self.updated_at = timestamp;
        self.updated_by = user_id;
    }

    fn mark_deleted(&mut self, user_id: crate::types::id_types::UserId, timestamp: DateTime<Utc>) {
        self.deleted = true;
        self.updated_at = timestamp;
        self.updated_by = user_id;
    }

    fn mark_restored(&mut self, user_id: crate::types::id_types::UserId, timestamp: DateTime<Utc>) {
        self.deleted = false;
        self.updated_at = timestamp;
        self.updated_by = user_id;
    }

    fn is_deleted(&self) -> bool {
        self.deleted
    }

    fn get_updated_by(&self) -> crate::types::id_types::UserId {
        self.updated_by
    }

    fn get_created_at(&self) -> DateTime<Utc> {
        self.created_at
    }

    fn get_updated_at(&self) -> DateTime<Utc> {
        self.updated_at
    }
}

impl Trackable for RecurrenceRuleTree {
    fn mark_created(&mut self, user_id: crate::types::id_types::UserId, timestamp: DateTime<Utc>) {
        self.created_at = timestamp;
        self.updated_at = timestamp;
        self.updated_by = user_id;
        self.deleted = false;
    }

    fn mark_updated(&mut self, user_id: crate::types::id_types::UserId, timestamp: DateTime<Utc>) {
        self.updated_at = timestamp;
        self.updated_by = user_id;
    }

    fn mark_deleted(&mut self, user_id: crate::types::id_types::UserId, timestamp: DateTime<Utc>) {
        self.deleted = true;
        self.updated_at = timestamp;
        self.updated_by = user_id;
    }

    fn mark_restored(&mut self, user_id: crate::types::id_types::UserId, timestamp: DateTime<Utc>) {
        self.deleted = false;
        self.updated_at = timestamp;
        self.updated_by = user_id;
    }

    fn is_deleted(&self) -> bool {
        self.deleted
    }

    fn get_updated_by(&self) -> crate::types::id_types::UserId {
        self.updated_by
    }

    fn get_created_at(&self) -> DateTime<Utc> {
        self.created_at
    }

    fn get_updated_at(&self) -> DateTime<Utc> {
        self.updated_at
    }
}
