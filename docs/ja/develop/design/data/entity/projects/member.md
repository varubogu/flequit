# Member (メンバー) - members

## 概要
プロジェクトへのユーザー参加状態と権限を管理する関連エンティティ。

## フィールド定義

| 論理名 | 物理名 | Rustでの型 | 説明 | PK | UK | NN | デフォルト値 | 外部キー | PostgreSQL型 | SQLite型 | TypeScript型 |
|--------|--------|-----------|------|----|----|----|-----------|---------|-----------|---------|-----------|-----|
| プロジェクトID | project_id | ProjectId | プロジェクトID | ✓ | - | ✓ | - | projects.id | UUID | TEXT | string |
| ユーザーID | user_id | UserId | メンバーのユーザーID | ✓ | - | ✓ | - | users.id | UUID | TEXT | string |
| 権限役割 | role | String | 権限役割 | - | - | ✓ | "Member" | - | TEXT | TEXT | string |
| 参加日時 | joined_at | DateTime<Utc> | 参加日時（ISO 8601） | - | - | ✓ | - | - | TIMESTAMPTZ | TEXT | string |
| 最終更新日時 | updated_at | DateTime<Utc> | 最終更新日時（ISO 8601） | - | - | ✓ | - | - | TIMESTAMPTZ | TEXT | string |

## 制約
- PRIMARY KEY: (project_id, user_id)
- FOREIGN KEY: project_id → projects.id
- FOREIGN KEY: user_id → users.id
- NOT NULL: project_id, user_id, role, joined_at, updated_at

## インデックス
```sql
CREATE INDEX IF NOT EXISTS idx_members_project_id ON members(project_id);
CREATE INDEX IF NOT EXISTS idx_members_user_id ON members(user_id);
CREATE INDEX IF NOT EXISTS idx_members_role ON members(role);
CREATE INDEX IF NOT EXISTS idx_members_joined_at ON members(joined_at);
```

## 関連テーブル
- projects: 所属プロジェクト
- users: メンバーユーザー

## 備考
プロジェクトとユーザーの多対多関係を管理。複合主キーで一意性を保証。