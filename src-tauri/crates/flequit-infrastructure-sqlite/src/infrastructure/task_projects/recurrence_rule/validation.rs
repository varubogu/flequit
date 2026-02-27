pub(super) fn day_of_week_to_string(
    day: &flequit_model::types::datetime_calendar_types::DayOfWeek,
) -> String {
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

/// WeekOfMonth enum を文字列に変換
pub(super) fn week_of_month_to_string(
    week: &flequit_model::types::datetime_calendar_types::WeekOfMonth,
) -> String {
    use flequit_model::types::datetime_calendar_types::WeekOfMonth;
    match week {
        WeekOfMonth::First => "first",
        WeekOfMonth::Second => "second",
        WeekOfMonth::Third => "third",
        WeekOfMonth::Fourth => "fourth",
        WeekOfMonth::Last => "last",
    }
    .to_string()
}

/// DateRelation enum を文字列に変換
pub(super) fn date_relation_to_string(
    relation: &flequit_model::types::datetime_calendar_types::DateRelation,
) -> String {
    use flequit_model::types::datetime_calendar_types::DateRelation;
    match relation {
        DateRelation::Before => "before",
        DateRelation::OnOrBefore => "on_or_before",
        DateRelation::Same => "same",
        DateRelation::OnOrAfter => "on_or_after",
        DateRelation::After => "after",
    }
    .to_string()
}

/// AdjustmentDirection enum を文字列に変換
pub(super) fn adjustment_direction_to_string(
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
pub(super) fn adjustment_target_to_string(
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
pub(super) fn string_to_day_of_week(
    s: &str,
) -> flequit_model::types::datetime_calendar_types::DayOfWeek {
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

/// 文字列を WeekOfMonth enum に変換
pub(super) fn string_to_week_of_month(
    s: &str,
) -> flequit_model::types::datetime_calendar_types::WeekOfMonth {
    use flequit_model::types::datetime_calendar_types::WeekOfMonth;
    match s {
        "first" => WeekOfMonth::First,
        "second" => WeekOfMonth::Second,
        "third" => WeekOfMonth::Third,
        "fourth" => WeekOfMonth::Fourth,
        "last" => WeekOfMonth::Last,
        _ => WeekOfMonth::First,
    }
}

/// 文字列を DateRelation enum に変換
pub(super) fn string_to_date_relation(
    s: &str,
) -> flequit_model::types::datetime_calendar_types::DateRelation {
    use flequit_model::types::datetime_calendar_types::DateRelation;
    match s {
        "before" => DateRelation::Before,
        "on_or_before" => DateRelation::OnOrBefore,
        "same" => DateRelation::Same,
        "on_or_after" => DateRelation::OnOrAfter,
        "after" => DateRelation::After,
        _ => DateRelation::Same,
    }
}

/// 文字列を AdjustmentDirection enum に変換
pub(super) fn string_to_adjustment_direction(
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
pub(super) fn string_to_adjustment_target(
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
