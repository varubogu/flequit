# Project (プロジェクト) - projects

## 概要
プロジェクト管理の基本エンティティ。タスクやメンバーの親コンテナとして機能。

## フィールド定義

| 論理名 | 物理名 | Rustでの型 | 説明 | PK | UK | NN | デフォルト値 | 外部キー | PostgreSQL型 | SQLite型 | TypeScript型 |
|--------|--------|-----------|------|----|----|----|-----------|---------|-----------|---------|-----------|
| プロジェクトID | id | ProjectId | プロジェクト一意識別子 | ✓ | - | ✓ | - | - | UUID | TEXT | string |
| プロジェクト名 | name | String | プロジェクト名 | - | - | ✓ | - | - | TEXT | TEXT | string |
| 説明 | description | String | プロジェクト説明 | - | - | - | NULL | - | TEXT | TEXT | string \| null |
| プロジェクトカラー | color | String | プロジェクトカラー | - | - | - | NULL | - | TEXT | TEXT | string \| null |
| 表示順序 | order_index | i32 | 表示順序 | - | - | ✓ | 0 | - | INTEGER | INTEGER | number |
| アーカイブ状態 | is_archived | bool | アーカイブ状態 | - | - | ✓ | false | - | BOOLEAN | INTEGER | boolean |
| ステータス | status | String | プロジェクトステータス | - | - | - | NULL | - | TEXT | TEXT | string \| null |
| オーナーID | owner_id | Option<UserId> | オーナーのユーザーID | - | - | - | NULL | users.id | UUID | TEXT | string \| null |
| 作成日時 | created_at | DateTime<Utc> | 作成日時（ISO 8601） | - | - | ✓ | - | - | TIMESTAMPTZ | TEXT | string |
| 最終更新日時 | updated_at | DateTime<Utc> | 最終更新日時（ISO 8601） | - | - | ✓ | - | - | TIMESTAMPTZ | TEXT | string |

## 制約
- PRIMARY KEY: id
- FOREIGN KEY: owner_id → users.id
- NOT NULL: id, name, order_index, is_archived, created_at, updated_at

## インデックス
```sql
CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_projects_order_index ON projects(order_index);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at);
```

## 関連テーブル
- task_lists: 所属タスクリスト
- tasks: 所属タスク
- tags: プロジェクト内タグ
- members: プロジェクトメンバー

## 備考
プロジェクトは全てのタスク管理活動の基本単位で、メンバーシップやアクセス制御の境界となる。