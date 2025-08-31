# データモデル仕様

## 概要

Flequitアプリケーションで使用されるデータモデルの定義と型変換規則を定義します。

## 型システムと変換規則

### 型変換表

Flequitでは異なる層間で型変換を行います。以下の変換表に従って各データ型を管理します：

| Rust内部型 | TypeScript/フロントエンド | SQLite | PostgreSQL | Automerge JSON | 説明 |
|-----------|-------------------------|--------|------------|----------------|------|
| `ProjectId` | `string` | `TEXT` | `UUID` | `string` | プロジェクト一意識別子（UUID v4） |
| `AccountId` | `string` | `TEXT` | `UUID` | `string` | アカウント内部識別子（UUID v4・非公開） |
| `UserId` | `string` | `TEXT` | `UUID` | `string` | ユーザー識別子（UUID v4・公開用） |
| `TaskId` | `string` | `TEXT` | `UUID` | `string` | タスク一意識別子（UUID v4） |
| `TaskListId` | `string` | `TEXT` | `UUID` | `string` | タスクリスト一意識別子（UUID v4） |
| `TagId` | `string` | `TEXT` | `UUID` | `string` | タグ一意識別子（UUID v4） |
| `SubTaskId` | `string` | `TEXT` | `UUID` | `string` | サブタスク一意識別子（UUID v4） |
| `DateTime<Utc>` | `string` | `TEXT` | `TIMESTAMPTZ` | `string` | ISO 8601形式日時文字列 |
| `Option<T>` | `T \| null` | `NULL` | `NULL` | `null` | Optional値 |
| `String` | `string` | `TEXT` | `TEXT` | `string` | 文字列 |
| `i32` | `number` | `INTEGER` | `INTEGER` | `number` | 32bit整数 |
| `bool` | `boolean` | `INTEGER` | `BOOLEAN` | `boolean` | 真偽値（SQLiteは0/1） |
| Enum型 | `string` | `TEXT` | `TEXT` | `string` | 列挙型（文字列として保存） |

### 注意点

- **UUID形式**: 全てのIDは`xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`形式
- **日時形式**: `YYYY-MM-DDTHH:mm:ss.sssZ` (UTC)
- **SQLite真偽値**: `true`=1, `false`=0で保存
- **Optional値**: 未設定時は`null`/`NULL`で統一

## エンティティ定義

`./entity/*.md` を参照
