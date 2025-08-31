# SubtaskTag (サブタスクタグ関連付け) - subtask_tags

## 概要
サブタスクとタグの関連付けを管理するエンティティ。

## フィールド定義

| 論理名 | 物理名 | Rustでの型 | 説明 | PK | UK | NN | デフォルト値 | 外部キー | PostgreSQL型 | SQLite型 | TypeScript型 |
|--------|--------|-----------|------|----|----|----|-----------|---------|-----------|---------|-----------|
| サブタスクID | subtask_id | SubTaskId | タグ付きサブタスクID | ✓ | - | ✓ | - | subtasks.id | UUID | TEXT | string |
| タグID | tag_id | TagId | 適用タグID | ✓ | - | ✓ | - | tags.id | UUID | TEXT | string |
| 関連付け作成日時 | created_at | DateTime<Utc> | 関連付け作成日時（ISO 8601） | - | - | ✓ | - | - | TIMESTAMPTZ | TEXT | string |

## 制約
- PRIMARY KEY: (subtask_id, tag_id)
- FOREIGN KEY: subtask_id → subtasks.id
- FOREIGN KEY: tag_id → tags.id
- NOT NULL: subtask_id, tag_id, created_at

## インデックス
```sql
CREATE INDEX IF NOT EXISTS idx_subtask_tags_subtask_id ON subtask_tags(subtask_id);
CREATE INDEX IF NOT EXISTS idx_subtask_tags_tag_id ON subtask_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_subtask_tags_created_at ON subtask_tags(created_at);
```

## 関連テーブル
- subtasks: タグ付きサブタスク
- tags: 適用タグ

## 備考
サブタスクとタグの多対多関係を管理。複合主キーで重複を防止。