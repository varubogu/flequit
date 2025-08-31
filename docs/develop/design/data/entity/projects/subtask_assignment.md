# SubtaskAssignment (サブタスク担当者関連付け) - subtask_assignments

## 概要
サブタスクと担当ユーザーの関連付けを管理するエンティティ。

## フィールド定義

| 論理名 | 物理名 | Rustでの型 | 説明 | PK | UK | NN | デフォルト値 | 外部キー | PostgreSQL型 | SQLite型 | TypeScript型 |
|--------|--------|-----------|------|----|----|----|-----------|---------|-----------|---------|-----------|-----|
| サブタスクID | subtask_id | SubTaskId | 担当サブタスクID | ✓ | - | ✓ | - | subtasks.id | UUID | TEXT | string |
| ユーザーID | user_id | UserId | 担当ユーザーID | ✓ | - | ✓ | - | users.id | UUID | TEXT | string |
| 関連付け作成日時 | created_at | DateTime<Utc> | 関連付け作成日時（ISO 8601） | - | - | ✓ | - | - | TIMESTAMPTZ | TEXT | string |

## 制約
- PRIMARY KEY: (subtask_id, user_id)
- FOREIGN KEY: subtask_id → subtasks.id
- FOREIGN KEY: user_id → users.id
- NOT NULL: subtask_id, user_id, created_at

## インデックス
```sql
CREATE INDEX IF NOT EXISTS idx_subtask_assignments_subtask_id ON subtask_assignments(subtask_id);
CREATE INDEX IF NOT EXISTS idx_subtask_assignments_user_id ON subtask_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_subtask_assignments_created_at ON subtask_assignments(created_at);
```

## 関連テーブル
- subtasks: 担当サブタスク
- users: 担当ユーザー

## 備考
サブタスクとユーザーの多対多関係を管理。複合主キーで重複を防止。