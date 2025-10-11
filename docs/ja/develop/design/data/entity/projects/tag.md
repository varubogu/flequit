# Tag (タグ) - tags

## 概要
プロジェクト内でタスクやサブタスクを分類するためのラベル管理エンティティ。

## フィールド定義

| 論理名 | 物理名 | Rustでの型 | 説明 | PK | UK | NN | デフォルト値 | 外部キー | PostgreSQL型 | SQLite型 | TypeScript型 |
|--------|--------|-----------|------|----|----|----|-----------|---------|-----------|---------|-----------|-----|
| タグID | id | TagId | タグ一意識別子 | ✓ | - | ✓ | - | - | UUID | TEXT | string |
| プロジェクトID | project_id | ProjectId | 所属プロジェクトID | - | - | ✓ | - | projects.id | UUID | TEXT | string |
| タグ名 | name | String | タグ名 | - | - | ✓ | - | - | TEXT | TEXT | string |
| 背景色 | color | String | 背景色（HEXカラー） | - | - | ✓ | "#808080" | - | TEXT | TEXT | string |
| 文字色 | text_color | String | 文字色（HEXカラー） | - | - | ✓ | "#FFFFFF" | - | TEXT | TEXT | string |
| 表示順序 | order_index | i32 | 表示順序 | - | - | ✓ | 0 | - | INTEGER | INTEGER | number |
| 作成日時 | created_at | DateTime<Utc> | 作成日時（ISO 8601） | - | - | ✓ | - | - | TIMESTAMPTZ | TEXT | string |
| 最終更新日時 | updated_at | DateTime<Utc> | 最終更新日時（ISO 8601） | - | - | ✓ | - | - | TIMESTAMPTZ | TEXT | string |

## 制約
- PRIMARY KEY: id
- FOREIGN KEY: project_id → projects.id
- NOT NULL: id, project_id, name, color, text_color, order_index, created_at, updated_at

## インデックス
```sql
CREATE INDEX IF NOT EXISTS idx_tags_project_id ON tags(project_id);
CREATE INDEX IF NOT EXISTS idx_tags_order_index ON tags(order_index);
CREATE INDEX IF NOT EXISTS idx_tags_created_at ON tags(created_at);
```

## 関連テーブル
- projects: 所属プロジェクト
- task_tags: タスクタグ関連付け
- subtask_tags: サブタスクタグ関連付け

## 備考
タグはプロジェクトに属し、色情報を持つことでUI上で視覚的な分類が可能。