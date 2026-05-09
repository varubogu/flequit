# エンティティ設計書

Flequit アプリケーションのデータベーススキーマ定義とエンティティ仕様。

## ファイル構成

| ファイル | 内容 |
| --- | --- |
| [`_template.md`](./_template.md) | 各エンティティの記述テンプレート (フォーマット定義) |
| [`accounts-and-users.md`](./accounts-and-users.md) | `accounts`, `users` |
| [`projects.md`](./projects.md) | `projects`, `task_lists`, `tasks`, `subtasks`, `tags`, `tag_bookmarks`, `members`, `task_assignments`, `subtask_assignments`, `task_tags`, `subtask_tags`, `task_recurrences`, `subtask_recurrences`, `date_conditions`, `weekday_conditions` |
| [`settings.md`](./settings.md) | `settings`, `datetime_formats`, `due_date_buttons`, `recurrence_rules`, `recurrence_details`, `time_labels`, `view_items` |
| [`user-preferences.md`](./user-preferences.md) | `user_tag_bookmarks` (ユーザー個人設定) |

## 主要スキーマカテゴリ

### accounts — アカウント管理

`AccountId` は内部識別子で他者から参照不可。`UserId` と分離。LocalSQLite/LocalAutomerge では完全秘匿し、PC 内で完結する。暗号化必須。

- 物理ファイル: `./accounts.database` / `./accounts.automerge`

### users — ユーザー情報

公開識別子 `UserId` を持つ。プロジェクトメンバーやタスク担当者として使用される。

- 物理ファイル: `./users.database` / `./users.automerge`

### projects — プロジェクト管理

プロジェクト遂行に必要な情報をすべて集約。プロジェクト単位で 1 ファイル。

- 物理ファイル: `./projects/{project_id}.database` / `./projects/{project_id}.automerge`

### settings — 汎用設定

アプリ全体の設定。

- 物理ファイル: `./settings.database` / `./settings.automerge`

## 型システム

| 種別 | 例 |
| --- | --- |
| ID 型 | `ProjectId`, `AccountId`, `UserId` 等 (専用型) |
| 日時 | `DateTime<Utc>` (ISO 8601) |
| Optional | `Option<T>` (NULL 許可) |
| 文字列・数値 | `String`, `i32`, `bool` |

詳細な型変換規則は [`../data-model.md`](../data-model.md) を参照。

## 設計の方針

- 各エンティティは「フィールド定義 + 制約 + インデックス対象カラム + 関連 + 必要時の補足」のみを記述する。
- SQL DDL、Sea-ORM コード、TypeScript インターフェース、Rust サービスコードは **このドキュメント群に置かない**。実装は `src-tauri/crates/flequit-infrastructure-sqlite/` を正本とする。
- 新規エンティティを追加する際は `_template.md` のフォーマットに従って該当統合ファイルへ追記する。
