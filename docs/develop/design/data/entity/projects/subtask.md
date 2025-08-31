# SubTask (サブタスク) - subtasks

## 概要
タスクを細分化した作業項目。親タスクに従属する子エンティティ。

## フィールド定義

| 論理名 | 物理名 | Rustでの型 | 説明 | PK | UK | NN | デフォルト値 | 外部キー | PostgreSQL型 | SQLite型 | TypeScript型 |
|--------|--------|-----------|------|----|----|----|-----------|---------|-----------|---------|-----------|
| サブタスクID | id | SubTaskId | サブタスク一意識別子 | ✓ | - | ✓ | - | - | UUID | TEXT | string |
| タスクID | task_id | TaskId | 親タスクID | - | - | ✓ | - | tasks.id | UUID | TEXT | string |
| サブタスクタイトル | title | String | サブタスクタイトル | - | - | ✓ | - | - | TEXT | TEXT | string |
| 説明 | description | String | 説明 | - | - | - | NULL | - | TEXT | TEXT | string \| null |
| ステータス | status | String | ステータス | - | - | ✓ | "not_started" | - | TEXT | TEXT | string |
| 優先度 | priority | Option<i32> | 優先度 | - | - | - | NULL | - | INTEGER | INTEGER | number \| null |
| 予定開始日時 | plan_start_date | Option<DateTime<Utc>> | 予定開始日時（ISO 8601） | - | - | - | NULL | - | TIMESTAMPTZ | TEXT | string \| null |
| 予定終了日時 | plan_end_date | Option<DateTime<Utc>> | 予定終了日時（ISO 8601） | - | - | - | NULL | - | TIMESTAMPTZ | TEXT | string \| null |
| 実開始日時 | do_start_date | Option<DateTime<Utc>> | 実開始日時（ISO 8601） | - | - | - | NULL | - | TIMESTAMPTZ | TEXT | string \| null |
| 実終了日時 | do_end_date | Option<DateTime<Utc>> | 実終了日時（ISO 8601） | - | - | - | NULL | - | TIMESTAMPTZ | TEXT | string \| null |
| 期間指定フラグ | is_range_date | Option<bool> | 期間指定フラグ | - | - | - | NULL | - | BOOLEAN | INTEGER | boolean \| null |
| 表示順序 | order_index | i32 | 表示順序 | - | - | ✓ | 0 | - | INTEGER | INTEGER | number |
| 完了状態 | completed | bool | 完了状態 | - | - | ✓ | false | - | BOOLEAN | INTEGER | boolean |
| 作成日時 | created_at | DateTime<Utc> | 作成日時（ISO 8601） | - | - | ✓ | - | - | TIMESTAMPTZ | TEXT | string |
| 最終更新日時 | updated_at | DateTime<Utc> | 最終更新日時（ISO 8601） | - | - | ✓ | - | - | TIMESTAMPTZ | TEXT | string |

## 制約
- PRIMARY KEY: id
- FOREIGN KEY: task_id → tasks.id
- NOT NULL: id, task_id, title, status, order_index, completed, created_at, updated_at

## インデックス
```sql
CREATE INDEX IF NOT EXISTS idx_subtasks_task_id ON subtasks(task_id);
CREATE INDEX IF NOT EXISTS idx_subtasks_status ON subtasks(status);
CREATE INDEX IF NOT EXISTS idx_subtasks_order_index ON subtasks(order_index);
CREATE INDEX IF NOT EXISTS idx_subtasks_completed ON subtasks(completed);
CREATE INDEX IF NOT EXISTS idx_subtasks_created_at ON subtasks(created_at);
```

## 関連テーブル
- tasks: 親タスク
- subtask_assignments: サブタスク担当者関連付け
- subtask_tags: サブタスクタグ関連付け
- subtask_recurrences: サブタスク繰り返し関連付け

## 備考
サブタスクはタスクの詳細分解に使用。独立した完了状態とステータスを持ち、親タスクとは別に管理される。