# Task (タスク) - tasks

## 概要

タスク管理システムの中核エンティティ。作業項目の詳細情報と状態を管理。

## フィールド定義

| 論理名         | 物理名          | Rustでの型            | 説明                     | PK  | UK  | NN  | デフォルト値 | 外部キー      | PostgreSQL型 | SQLite型 | TypeScript型   |
| -------------- | --------------- | --------------------- | ------------------------ | --- | --- | --- | ------------ | ------------- | ------------ | -------- | -------------- |
| タスクID       | id              | TaskId                | タスク一意識別子         | ✓   | -   | ✓   | -            | -             | UUID         | TEXT     | string         |
| プロジェクトID | project_id      | ProjectId             | 所属プロジェクトID       | -   | -   | ✓   | -            | projects.id   | UUID         | TEXT     | string         |
| タスクリストID | task_list_id    | Option<TaskListId>    | 所属タスクリストID       | -   | -   | -   | NULL         | task_lists.id | UUID         | TEXT     | string \| null |
| タスクタイトル | title           | String                | タスクタイトル           | -   | -   | ✓   | -            | -             | TEXT         | TEXT     | string         |
| 詳細説明       | description     | String                | 詳細説明                 | -   | -   | -   | NULL         | -             | TEXT         | TEXT     | string \| null |
| ステータス     | status          | String                | タスクステータス         | -   | -   | ✓   | "Todo"       | -             | TEXT         | TEXT     | string         |
| 優先度         | priority        | String                | 優先度                   | -   | -   | ✓   | "Medium"     | -             | TEXT         | TEXT     | string         |
| 重要度         | importance      | String                | 重要度                   | -   | -   | ✓   | "Medium"     | -             | TEXT         | TEXT     | string         |
| 期限日時       | due_date        | Option<DateTime<Utc>> | 期限日時（ISO 8601）     | -   | -   | -   | NULL         | -             | TIMESTAMPTZ  | TEXT     | string \| null |
| 予定開始日時   | plan_start_date | Option<DateTime<Utc>> | 予定開始日時（ISO 8601） | -   | -   | -   | NULL         | -             | TIMESTAMPTZ  | TEXT     | string \| null |
| 予定終了日時   | plan_end_date   | Option<DateTime<Utc>> | 予定終了日時（ISO 8601） | -   | -   | -   | NULL         | -             | TIMESTAMPTZ  | TEXT     | string \| null |
| 実開始日時     | do_start_date   | Option<DateTime<Utc>> | 実開始日時（ISO 8601）   | -   | -   | -   | NULL         | -             | TIMESTAMPTZ  | TEXT     | string \| null |
| 実終了日時     | do_end_date     | Option<DateTime<Utc>> | 実終了日時（ISO 8601）   | -   | -   | -   | NULL         | -             | TIMESTAMPTZ  | TEXT     | string \| null |
| 表示順序       | order_index     | i32                   | 表示順序                 | -   | -   | ✓   | 0            | -             | INTEGER      | INTEGER  | number         |
| アーカイブ状態 | is_archived     | bool                  | アーカイブ状態           | -   | -   | ✓   | false        | -             | BOOLEAN      | INTEGER  | boolean        |
| 作成日時       | created_at      | DateTime<Utc>         | 作成日時（ISO 8601）     | -   | -   | ✓   | -            | -             | TIMESTAMPTZ  | TEXT     | string         |
| 最終更新日時   | updated_at      | DateTime<Utc>         | 最終更新日時（ISO 8601） | -   | -   | ✓   | -            | -             | TIMESTAMPTZ  | TEXT     | string         |

## 制約

- PRIMARY KEY: id
- FOREIGN KEY: project_id → projects.id
- FOREIGN KEY: task_list_id → task_lists.id
- NOT NULL: id, project_id, title, status, priority, importance, order_index, is_archived, created_at, updated_at

## インデックス

```sql
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_task_list_id ON tasks(task_list_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_order_index ON tasks(order_index);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at);
```

## 関連テーブル

- projects: 所属プロジェクト
- task_lists: 所属タスクリスト（任意）
- subtasks: 子サブタスク
- task_assignments: タスク担当者関連付け
- task_tags: タスクタグ関連付け
- task_recurrences: タスク繰り返し関連付け

## 備考

タスクはプロジェクトに必須で所属するが、タスクリストへの所属は任意。日時管理では計画（plan）と実績（do）を分離管理。
