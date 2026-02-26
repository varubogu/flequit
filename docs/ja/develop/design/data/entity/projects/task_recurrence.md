# TaskRecurrence (タスク繰り返し関連付け) - task_recurrences

## 概要

タスクと繰り返しルールの関連付けを管理するエンティティ。

## フィールド定義

| 論理名           | 物理名             | Rustでの型    | 説明                         | PK  | UK  | NN  | デフォルト値 | 外部キー            | PostgreSQL型 | SQLite型 | TypeScript型 |
| ---------------- | ------------------ | ------------- | ---------------------------- | --- | --- | --- | ------------ | ------------------- | ------------ | -------- | ------------ |
| タスクID         | task_id            | TaskId        | 繰り返しタスクID             | ✓   | -   | ✓   | -            | tasks.id            | UUID         | TEXT     | string       |
| 繰り返しルールID | recurrence_rule_id | String        | 繰り返しルールID             | ✓   | -   | ✓   | -            | recurrence_rules.id | UUID         | TEXT     | string       |
| 関連付け作成日時 | created_at         | DateTime<Utc> | 関連付け作成日時（ISO 8601） | -   | -   | ✓   | -            | -                   | TIMESTAMPTZ  | TEXT     | string       |

## 制約

- PRIMARY KEY: (task_id, recurrence_rule_id)
- FOREIGN KEY: task_id → tasks.id
- FOREIGN KEY: recurrence_rule_id → recurrence_rules.id
- NOT NULL: task_id, recurrence_rule_id, created_at

## インデックス

```sql
CREATE INDEX IF NOT EXISTS idx_task_recurrences_task_id ON task_recurrences(task_id);
CREATE INDEX IF NOT EXISTS idx_task_recurrences_recurrence_rule_id ON task_recurrences(recurrence_rule_id);
CREATE INDEX IF NOT EXISTS idx_task_recurrences_created_at ON task_recurrences(created_at);
```

## 関連テーブル

- tasks: 繰り返し対象タスク
- recurrence_rules: 適用繰り返しルール

## 備考

タスクと繰り返しルールの多対多関係を管理。複合主キーで重複を防止。
