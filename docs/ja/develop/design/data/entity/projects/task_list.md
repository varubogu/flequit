# TaskList (タスクリスト) - task_lists

## 概要

プロジェクト内でタスクを分類・整理するためのリスト管理エンティティ。

## フィールド定義

| 論理名         | 物理名      | Rustでの型    | 説明                     | PK  | UK  | NN  | デフォルト値 | 外部キー    | PostgreSQL型 | SQLite型 | TypeScript型   |
| -------------- | ----------- | ------------- | ------------------------ | --- | --- | --- | ------------ | ----------- | ------------ | -------- | -------------- |
| タスクリストID | id          | TaskListId    | タスクリスト一意識別子   | ✓   | -   | ✓   | -            | -           | UUID         | TEXT     | string         |
| プロジェクトID | project_id  | ProjectId     | 所属プロジェクトID       | -   | -   | ✓   | -            | projects.id | UUID         | TEXT     | string         |
| タスクリスト名 | name        | String        | タスクリスト名           | -   | -   | ✓   | -            | -           | TEXT         | TEXT     | string         |
| 説明           | description | String        | 説明                     | -   | -   | -   | NULL         | -           | TEXT         | TEXT     | string \| null |
| 表示順序       | order_index | i32           | 表示順序                 | -   | -   | ✓   | 0            | -           | INTEGER      | INTEGER  | number         |
| アーカイブ状態 | is_archived | bool          | アーカイブ状態           | -   | -   | ✓   | false        | -           | BOOLEAN      | INTEGER  | boolean        |
| 作成日時       | created_at  | DateTime<Utc> | 作成日時（ISO 8601）     | -   | -   | ✓   | -            | -           | TIMESTAMPTZ  | TEXT     | string         |
| 最終更新日時   | updated_at  | DateTime<Utc> | 最終更新日時（ISO 8601） | -   | -   | ✓   | -            | -           | TIMESTAMPTZ  | TEXT     | string         |

## 制約

- PRIMARY KEY: id
- FOREIGN KEY: project_id → projects.id
- NOT NULL: id, project_id, name, order_index, is_archived, created_at, updated_at

## インデックス

```sql
CREATE INDEX IF NOT EXISTS idx_task_lists_project_id ON task_lists(project_id);
CREATE INDEX IF NOT EXISTS idx_task_lists_order_index ON task_lists(order_index);
CREATE INDEX IF NOT EXISTS idx_task_lists_created_at ON task_lists(created_at);
```

## 関連テーブル

- projects: 所属プロジェクト
- tasks: 所属タスク

## 備考

タスクリストは任意で、タスクは直接プロジェクトに属することも可能。カンバンボードのカラムやGTDリストなどの実装に使用。
