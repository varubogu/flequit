# User (ユーザー) - users

## 概要

公開ユーザー情報を管理するテーブル。他者から参照可能な公開識別子を持つ。

## フィールド定義

| 論理名         | 物理名       | Rustでの型    | 説明                                   | PK  | UK  | NN  | デフォルト値 | 外部キー | PostgreSQL型 | SQLite型 | TypeScript型   |
| -------------- | ------------ | ------------- | -------------------------------------- | --- | --- | --- | ------------ | -------- | ------------ | -------- | -------------- |
| ユーザーID     | id           | UserId        | 公開ユーザー識別子（他者から参照可能） | ✓   | -   | ✓   | -            | -        | UUID         | TEXT     | string         |
| ユーザー名     | username     | String        | ユーザー名                             | -   | ✓   | ✓   | -            | -        | TEXT         | TEXT     | string         |
| 表示名         | display_name | String        | 表示名                                 | -   | -   | -   | NULL         | -        | TEXT         | TEXT     | string \| null |
| メールアドレス | email        | String        | メールアドレス                         | -   | -   | -   | NULL         | -        | TEXT         | TEXT     | string \| null |
| アバターURL    | avatar_url   | String        | アバターURL                            | -   | -   | -   | NULL         | -        | TEXT         | TEXT     | string \| null |
| 自己紹介       | bio          | String        | 自己紹介                               | -   | -   | -   | NULL         | -        | TEXT         | TEXT     | string \| null |
| タイムゾーン   | timezone     | String        | タイムゾーン                           | -   | -   | -   | NULL         | -        | TEXT         | TEXT     | string \| null |
| アクティブ状態 | is_active    | bool          | アクティブ状態                         | -   | -   | ✓   | true         | -        | BOOLEAN      | INTEGER  | boolean        |
| 作成日時       | created_at   | DateTime<Utc> | 作成日時（ISO 8601）                   | -   | -   | ✓   | -            | -        | TIMESTAMPTZ  | TEXT     | string         |
| 最終更新日時   | updated_at   | DateTime<Utc> | 最終更新日時（ISO 8601）               | -   | -   | ✓   | -            | -        | TIMESTAMPTZ  | TEXT     | string         |

## 制約

- PRIMARY KEY: id
- UNIQUE: username
- NOT NULL: id, username, is_active, created_at, updated_at

## インデックス

```sql
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
```

## 関連テーブル

- accounts: アカウント内部管理情報
- members: プロジェクトメンバーシップ
- task_assignments: タスク担当者関連付け
- subtask_assignments: サブタスク担当者関連付け

## 備考

公開ユーザー識別子（UserId）は他者からの参照が可能で、プロジェクトメンバーやタスク担当者として使用される。
