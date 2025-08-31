# TaskAssignment (タスク担当者関連付け) - task_assignments

## 概要
タスクと担当ユーザーの関連付けを管理するエンティティ。

## フィールド定義

| 論理名 | 物理名 | Rustでの型 | 説明 | PK | UK | NN | デフォルト値 | 外部キー | PostgreSQL型 | SQLite型 | TypeScript型 |
|--------|--------|-----------|------|----|----|----|-----------|---------|-----------|---------|-----------|-----|
| タスクID | task_id | TaskId | 担当タスクID | ✓ | - | ✓ | - | tasks.id | UUID | TEXT | string |
| ユーザーID | user_id | UserId | 担当ユーザーID | ✓ | - | ✓ | - | users.id | UUID | TEXT | string |
| 関連付け作成日時 | created_at | DateTime<Utc> | 関連付け作成日時（ISO 8601） | - | - | ✓ | - | - | TIMESTAMPTZ | TEXT | string |

## 制約
- PRIMARY KEY: (task_id, user_id)
- FOREIGN KEY: task_id → tasks.id
- FOREIGN KEY: user_id → users.id
- NOT NULL: task_id, user_id, created_at

## インデックス
```sql
CREATE INDEX IF NOT EXISTS idx_task_assignments_task_id ON task_assignments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_assignments_user_id ON task_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_task_assignments_created_at ON task_assignments(created_at);
```

## 関連テーブル
- tasks: 担当タスク
- users: 担当ユーザー

## 備考
タスクとユーザーの多対多関係を管理。複合主キーで重複を防止。