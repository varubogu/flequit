# アカウント・ユーザー系エンティティ定義

認証アカウントと公開ユーザー情報を管理する。共通フォーマットは `_template.md` を参照。

## Account — accounts

**役割**: アカウント内部識別子と認証プロバイダー情報。`AccountId` は他者から参照不可な内部 ID。`UserId` (`users.id`) と分離されている。

### フィールド

| 論理名 | 物理名 | Rust 型 | 制約 | デフォルト | 外部キー | 説明 |
| --- | --- | --- | --- | --- | --- | --- |
| アカウント ID | id | AccountId | PK, NN | - | - | 内部識別子（非公開） |
| ユーザー ID | user_id | UserId | NN | - | users.id | 公開識別子 |
| メール | email | Option\<String\> | - | NULL | - | - |
| 表示名 | display_name | Option\<String\> | - | NULL | - | プロバイダー提供 |
| アバター URL | avatar_url | Option\<String\> | - | NULL | - | - |
| プロバイダー | provider | String | NN | - | - | 認証プロバイダー名 |
| プロバイダー ID | provider_id | Option\<String\> | - | NULL | - | プロバイダー側 ID |
| アクティブ状態 | is_active | bool | NN | true | - | - |
| 作成日時 | created_at | DateTime\<Utc\> | NN | - | - | - |
| 最終更新日時 | updated_at | DateTime\<Utc\> | NN | - | - | - |

### 制約・インデックス

- PRIMARY KEY: `id`
- FOREIGN KEY: `user_id → users.id`
- NOT NULL: `id, user_id, provider, is_active, created_at, updated_at`
- インデックス: `user_id`, `provider`, `created_at`

### 関連

- users (公開ユーザー情報)

### 補足

`AccountId` は他者から参照されない内部管理用 ID。LocalSQLite / LocalAutomerge では完全秘匿し、PC 内で完結。OS 認証連携時のみ暗号化が解除される。

---

## User — users

**役割**: 公開ユーザー情報。`UserId` は他者から参照可能で、プロジェクトメンバーやタスク担当者として使用される。

### フィールド

| 論理名 | 物理名 | Rust 型 | 制約 | デフォルト | 外部キー | 説明 |
| --- | --- | --- | --- | --- | --- | --- |
| ユーザー ID | id | UserId | PK, NN | - | - | 公開識別子 |
| ユーザー名 | username | String | UK, NN | - | - | - |
| 表示名 | display_name | Option\<String\> | - | NULL | - | - |
| メール | email | Option\<String\> | - | NULL | - | - |
| アバター URL | avatar_url | Option\<String\> | - | NULL | - | - |
| 自己紹介 | bio | Option\<String\> | - | NULL | - | - |
| タイムゾーン | timezone | Option\<String\> | - | NULL | - | - |
| アクティブ状態 | is_active | bool | NN | true | - | - |
| 作成日時 | created_at | DateTime\<Utc\> | NN | - | - | - |
| 最終更新日時 | updated_at | DateTime\<Utc\> | NN | - | - | - |

### 制約・インデックス

- PRIMARY KEY: `id` / UNIQUE: `username`
- NOT NULL: `id, username, is_active, created_at, updated_at`
- インデックス: `username` (UNIQUE), `created_at`

### 関連

- accounts (内部アカウント), members (プロジェクト参加), task_assignments, subtask_assignments
