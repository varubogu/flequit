//! 繰り返しコマンドモデル
//!
//! このモジュールは繰り返し関連のコマンドモデルを定義します。
//! Tauriコマンドで使用されるデータ型を提供します。

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

/// 繰り返しルール作成コマンド
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RecurrenceRuleCommandModel {
    /// ルールID
    pub id: String,
    /// ルール名
    pub name: String,
    /// 繰り返しパターン（cron形式）
    pub pattern: String,
    /// 有効フラグ
    pub is_active: bool,
}

/// 繰り返し調整作成コマンド
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RecurrenceAdjustmentCommandModel {
    /// 調整ID
    pub id: String,
    /// 繰り返しルールID
    pub recurrence_rule_id: String,
    /// 調整日時
    pub adjustment_date: DateTime<Utc>,
    /// 調整種別（skip, reschedule等）
    pub adjustment_type: String,
    /// 調整理由
    pub reason: Option<String>,
}

/// 繰り返し詳細作成コマンド
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RecurrenceDetailsCommandModel {
    /// 詳細ID
    pub id: String,
    /// 繰り返しルールID
    pub recurrence_rule_id: String,
    /// 適用開始日
    pub start_date: DateTime<Utc>,
    /// 適用終了日
    pub end_date: Option<DateTime<Utc>>,
    /// 最大繰り返し回数
    pub max_occurrences: Option<i32>,
    /// 繰り返し間隔
    pub interval_value: i32,
    /// 間隔単位（days, weeks, months等）
    pub interval_unit: String,
}

/// タスク繰り返し関連付けコマンド
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TaskRecurrenceCommandModel {
    /// タスクID
    pub task_id: String,
    /// 繰り返しルールID
    pub recurrence_rule_id: String,
}

/// サブタスク繰り返し関連付けコマンド
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SubtaskRecurrenceCommandModel {
    /// サブタスクID
    pub subtask_id: String,
    /// 繰り返しルールID
    pub recurrence_rule_id: String,
}
