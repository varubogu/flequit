# Account (アカウント) - accounts

## 概要

アカウント内部識別子と認証プロバイダー情報を管理するテーブル。ユーザーIDとは分離された内部管理用エンティティ。

## フィールド定義

| 論理名         | 物理名       | Rustでの型    | 説明                                   | PK  | UK  | NN  | デフォルト値 | 外部キー | PostgreSQL型 | SQLite型 | TypeScript型   |
| -------------- | ------------ | ------------- | -------------------------------------- | --- | --- | --- | ------------ | -------- | ------------ | -------- | -------------- |
| アカウントID   | id           | AccountId     | アカウント内部識別子（非公開）         | ✓   | -   | ✓   | -            | -        | UUID         | TEXT     | string         |
| ユーザーID     | user_id      | UserId        | 公開ユーザー識別子（他者から参照可能） | -   | -   | ✓   | -            | users.id | UUID         | TEXT     | string         |
| メールアドレス | email        | String        | メールアドレス                         | -   | -   | -   | NULL         | -        | TEXT         | TEXT     | string \| null |
| 表示名         | display_name | String        | プロバイダー提供の表示名               | -   | -   | -   | NULL         | -        | TEXT         | TEXT     | string \| null |
| アバターURL    | avatar_url   | String        | プロフィール画像URL                    | -   | -   | -   | NULL         | -        | TEXT         | TEXT     | string \| null |
| プロバイダー   | provider     | String        | 認証プロバイダー名                     | -   | -   | ✓   | -            | -        | TEXT         | TEXT     | string         |
| プロバイダーID | provider_id  | String        | プロバイダー側ユーザーID               | -   | -   | -   | NULL         | -        | TEXT         | TEXT     | string \| null |
| アクティブ状態 | is_active    | bool          | アカウント有効状態                     | -   | -   | ✓   | true         | -        | BOOLEAN      | INTEGER  | boolean        |
| 作成日時       | created_at   | DateTime<Utc> | 作成日時（ISO 8601）                   | -   | -   | ✓   | -            | -        | TIMESTAMPTZ  | TEXT     | string         |
| 最終更新日時   | updated_at   | DateTime<Utc> | 最終更新日時（ISO 8601）               | -   | -   | ✓   | -            | -        | TIMESTAMPTZ  | TEXT     | string         |

## 制約

- PRIMARY KEY: id
- FOREIGN KEY: user_id → users.id
- NOT NULL: id, user_id, provider, is_active, created_at, updated_at

## インデックス

```sql
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_provider ON accounts(provider);
CREATE INDEX IF NOT EXISTS idx_accounts_created_at ON accounts(created_at);
```

## 関連テーブル

- users: 公開ユーザー情報との関連付け

## 備考

アカウント内部識別子（AccountId）は他者から参照不可能な内部管理用IDで、公開ユーザー識別子（UserId）と明確に分離されている。
