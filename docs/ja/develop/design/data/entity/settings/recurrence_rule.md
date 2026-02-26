# RecurrenceRule (繰り返しルール) - recurrence_rules

## 概要

タスクやサブタスクの繰り返し実行パターンを定義するルールエンティティ。

## フィールド定義

| 論理名           | 物理名         | Rustでの型            | 説明                       | PK  | UK  | NN  | デフォルト値 | 外部キー | PostgreSQL型 | SQLite型 | TypeScript型   |
| ---------------- | -------------- | --------------------- | -------------------------- | --- | --- | --- | ------------ | -------- | ------------ | -------- | -------------- |
| 繰り返しルールID | id             | String                | 繰り返しルールID           | ✓   | -   | ✓   | -            | -        | UUID         | TEXT     | string         |
| 繰り返し単位     | unit           | String                | 繰り返し単位               | -   | -   | ✓   | -            | -        | TEXT         | TEXT     | string         |
| 繰り返し間隔     | interval_value | i32                   | 繰り返し間隔               | -   | -   | ✓   | 1            | -        | INTEGER      | INTEGER  | number         |
| 終了日時         | end_date       | Option<DateTime<Utc>> | 終了日時（ISO 8601）       | -   | -   | -   | NULL         | -        | TIMESTAMPTZ  | TEXT     | string \| null |
| 繰り返し回数     | count          | Option<i32>           | 繰り返し回数               | -   | -   | -   | NULL         | -        | INTEGER      | INTEGER  | number \| null |
| 曜日指定         | by_weekday     | Option<String>        | 曜日指定（カンマ区切り）   | -   | -   | -   | NULL         | -        | TEXT         | TEXT     | string \| null |
| 月内日指定       | by_monthday    | Option<String>        | 月内日指定（カンマ区切り） | -   | -   | -   | NULL         | -        | TEXT         | TEXT     | string \| null |
| 年内日指定       | by_yearday     | Option<String>        | 年内日指定（カンマ区切り） | -   | -   | -   | NULL         | -        | TEXT         | TEXT     | string \| null |
| 月指定           | by_month       | Option<String>        | 月指定（カンマ区切り）     | -   | -   | -   | NULL         | -        | TEXT         | TEXT     | string \| null |
| 作成日時         | created_at     | DateTime<Utc>         | 作成日時（ISO 8601）       | -   | -   | ✓   | -            | -        | TIMESTAMPTZ  | TEXT     | string         |
| 最終更新日時     | updated_at     | DateTime<Utc>         | 最終更新日時（ISO 8601）   | -   | -   | ✓   | -            | -        | TIMESTAMPTZ  | TEXT     | string         |

## 制約

- PRIMARY KEY: id
- NOT NULL: id, unit, interval_value, created_at, updated_at

## インデックス

```sql
CREATE INDEX IF NOT EXISTS idx_recurrence_rules_unit ON recurrence_rules(unit);
CREATE INDEX IF NOT EXISTS idx_recurrence_rules_created_at ON recurrence_rules(created_at);
```

## 関連テーブル

- task_recurrences: タスク繰り返し関連付け
- subtask_recurrences: サブタスク繰り返し関連付け

## 備考

RFC5545（iCalendar）準拠の繰り返しルール定義。複数のタスクやサブタスクから参照可能な共有ルール。
