# TaskTag (タスクタグ関連付け) - task_tags

## 概要
タスクとタグの関連付けを管理するエンティティ。

## フィールド定義

| 論理名 | 物理名 | Rustでの型 | 説明 | PK | UK | NN | デフォルト値 | 外部キー | PostgreSQL型 | SQLite型 | TypeScript型 |
|--------|--------|-----------|------|----|----|----|-----------|---------|-----------|---------|-----------|
| タスクID | task_id | TaskId | タグ付きタスクID | ✓ | - | ✓ | - | tasks.id | UUID | TEXT | string |
| タグID | tag_id | TagId | 適用タグID | ✓ | - | ✓ | - | tags.id | UUID | TEXT | string |
| 関連付け作成日時 | created_at | DateTime<Utc> | 関連付け作成日時（ISO 8601） | - | - | ✓ | - | - | TIMESTAMPTZ | TEXT | string |

## 制約
- PRIMARY KEY: (task_id, tag_id)
- FOREIGN KEY: task_id → tasks.id
- FOREIGN KEY: tag_id → tags.id
- NOT NULL: task_id, tag_id, created_at

## インデックス
```sql
CREATE INDEX IF NOT EXISTS idx_task_tags_task_id ON task_tags(task_id);
CREATE INDEX IF NOT EXISTS idx_task_tags_tag_id ON task_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_task_tags_created_at ON task_tags(created_at);
```

## 関連テーブル
- tasks: タグ付きタスク
- tags: 適用タグ

## 備考
タスクとタグの多対多関係を管理。複合主キーで重複を防止。