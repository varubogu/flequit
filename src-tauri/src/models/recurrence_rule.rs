//! 繰り返しルールコマンドモデル

use crate::models::CommandModelConverter;
use async_trait::async_trait;
use flequit_model::models::task_projects::recurrence_rule::RecurrenceRule;
use flequit_model::models::ModelConverter;
use flequit_model::types::datetime_calendar_types::{DayOfWeek, RecurrenceUnit};
use flequit_model::types::id_types::RecurrenceRuleId;
use serde::{Deserialize, Serialize};

/// Tauriコマンド用の繰り返しルール構造体（日時フィールドはString）
#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
pub struct RecurrenceRuleCommandModel {
    pub id: String,
    /// 繰り返し単位（"day", "week", "month", "year"等の文字列）
    pub unit: String,
    /// 繰り返し間隔
    pub interval: i32,
    /// 特定曜日のリスト（文字列形式："monday", "tuesday"等）
    pub days_of_week: Option<Vec<String>>,
    /// 詳細パターン設定（JSON文字列として保存）
    pub details: Option<String>,
    /// 補正条件（JSON文字列として保存）
    pub adjustment: Option<String>,
    /// 終了日（RFC3339文字列）
    pub end_date: Option<String>,
    /// 最大回数
    pub max_occurrences: Option<i32>,
}

#[async_trait]
impl ModelConverter<RecurrenceRule> for RecurrenceRuleCommandModel {
    /// コマンド引数用（RecurrenceRuleCommand）から内部モデル（RecurrenceRule）に変換
    async fn to_model(&self) -> Result<RecurrenceRule, String> {
        use chrono::{DateTime, Utc};

        // unit文字列をRecurrenceUnitに変換
        let unit = match self.unit.as_str() {
            "minute" => RecurrenceUnit::Minute,
            "hour" => RecurrenceUnit::Hour,
            "day" => RecurrenceUnit::Day,
            "week" => RecurrenceUnit::Week,
            "month" => RecurrenceUnit::Month,
            "quarter" => RecurrenceUnit::Quarter,
            "halfyear" => RecurrenceUnit::HalfYear,
            "year" => RecurrenceUnit::Year,
            _ => return Err(format!("Invalid recurrence unit: {}", self.unit)),
        };

        // days_of_week文字列をDayOfWeekに変換
        let days_of_week = if let Some(ref days) = self.days_of_week {
            let converted_days: Result<Vec<DayOfWeek>, String> = days
                .iter()
                .map(|day| match day.as_str() {
                    "monday" => Ok(DayOfWeek::Monday),
                    "tuesday" => Ok(DayOfWeek::Tuesday),
                    "wednesday" => Ok(DayOfWeek::Wednesday),
                    "thursday" => Ok(DayOfWeek::Thursday),
                    "friday" => Ok(DayOfWeek::Friday),
                    "saturday" => Ok(DayOfWeek::Saturday),
                    "sunday" => Ok(DayOfWeek::Sunday),
                    _ => Err(format!("Invalid day of week: {}", day)),
                })
                .collect();
            Some(converted_days?)
        } else {
            None
        };

        // 終了日の変換
        let end_date = if let Some(ref date_str) = self.end_date {
            Some(
                date_str
                    .parse::<DateTime<Utc>>()
                    .map_err(|e| format!("Invalid end_date format: {}", e))?,
            )
        } else {
            None
        };

        Ok(RecurrenceRule {
            id: RecurrenceRuleId::from(self.id.clone()),
            unit,
            interval: self.interval,
            days_of_week,
            // TODO: details と adjustment の実装は後で追加（JSON文字列からの変換が複雑なため）
            details: None,
            adjustment: None,
            end_date,
            max_occurrences: self.max_occurrences,
        })
    }
}

#[async_trait]
impl CommandModelConverter<RecurrenceRuleCommandModel> for RecurrenceRule {
    /// 内部モデル（RecurrenceRule）からコマンド用モデル（RecurrenceRuleCommand）に変換
    async fn to_command_model(&self) -> Result<RecurrenceRuleCommandModel, String> {
        // RecurrenceUnitを文字列に変換
        let unit = match self.unit {
            RecurrenceUnit::Minute => "minute".to_string(),
            RecurrenceUnit::Hour => "hour".to_string(),
            RecurrenceUnit::Day => "day".to_string(),
            RecurrenceUnit::Week => "week".to_string(),
            RecurrenceUnit::Month => "month".to_string(),
            RecurrenceUnit::Quarter => "quarter".to_string(),
            RecurrenceUnit::HalfYear => "halfyear".to_string(),
            RecurrenceUnit::Year => "year".to_string(),
        };

        // DayOfWeekを文字列に変換
        let days_of_week = if let Some(ref days) = self.days_of_week {
            let converted_days: Vec<String> = days
                .iter()
                .map(|day| match day {
                    DayOfWeek::Monday => "monday".to_string(),
                    DayOfWeek::Tuesday => "tuesday".to_string(),
                    DayOfWeek::Wednesday => "wednesday".to_string(),
                    DayOfWeek::Thursday => "thursday".to_string(),
                    DayOfWeek::Friday => "friday".to_string(),
                    DayOfWeek::Saturday => "saturday".to_string(),
                    DayOfWeek::Sunday => "sunday".to_string(),
                })
                .collect();
            Some(converted_days)
        } else {
            None
        };

        Ok(RecurrenceRuleCommandModel {
            id: self.id.to_string(),
            unit,
            interval: self.interval,
            days_of_week,
            details: None,    // TODO: JSON文字列変換実装
            adjustment: None, // TODO: JSON文字列変換実装
            end_date: self.end_date.as_ref().map(|d| d.to_rfc3339()),
            max_occurrences: self.max_occurrences,
        })
    }
}

/// Tauri コマンド引数用の PartialRecurrenceRule 構造体（部分更新用）
#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
pub struct PartialRecurrenceRuleCommandModel {
    pub unit: Option<String>,
    pub interval: Option<i32>,
    pub days_of_week: Option<Option<Vec<String>>>,
    pub details: Option<Option<String>>,
    pub adjustment: Option<Option<String>>,
    pub end_date: Option<Option<String>>,
    pub max_occurrences: Option<Option<i32>>,
}
