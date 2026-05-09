# ユーザー設定系エンティティ定義

ユーザーの個人設定として管理し、同じユーザーの複数端末間で同期されるエンティティ。共通フォーマットは `_template.md` を参照。

## TagBookmark (ユーザー設定) — user_tag_bookmarks

**役割**: サイドバーに固定表示するタグの管理。**ユーザー個人設定**として管理され、同じユーザーの複数端末間で同期される (チーム共有はしない)。

- **分類**: `user_preferences`
- **同期対象**: 同じユーザーの他端末のみ
- **Automerge ドキュメントパス**: `/user_preferences/{user_id}/tag_bookmarks/{project_id}/{tag_id}`

### フィールド

| 論理名 | 物理名 | Rust 型 | 制約 | デフォルト | 外部キー | 説明 |
| --- | --- | --- | --- | --- | --- | --- |
| ID | id | TagBookmarkId | PK, NN | UUID 生成 | - | - |
| ユーザー ID | user_id | UserId | UK, NN | "local_user" | - | 現在は固定値 |
| プロジェクト ID | project_id | ProjectId | UK, NN | - | projects.id | - |
| タグ ID | tag_id | TagId | UK, NN | - | tags.id | - |
| 表示順序 | order_index | i32 | NN | 0 | - | サイドバー内 |
| 作成日時 | created_at | DateTime\<Utc\> | NN | - | - | - |
| 更新日時 | updated_at | DateTime\<Utc\> | NN | - | - | - |

### 制約・インデックス

- PRIMARY KEY: `id`
- UNIQUE: `(user_id, project_id, tag_id)` — 同じタグの重複ブックマークを防止
- FOREIGN KEY: `project_id → projects.id (ON DELETE CASCADE)`
- NOT NULL: 全カラム
- インデックス: `(user_id, project_id, order_index)`, `tag_id`

### 関連

- projects, tags

### 設計上の重要な原則

#### 1. ユーザー設定としての管理

タグブックマークは **ユーザー個人の作業環境** であり、タグ自体の属性ではない。理由:

- ユーザーごとに異なるタグをブックマークする (個人の作業環境)
- プロジェクトメンバー間で共有しない (チーム共有外)
- ユーザーごとに異なる並び順を保持
- 同じユーザーの他端末でも同じブックマーク状態 (端末間同期)

`Tag` エンティティに `is_bookmarked` のような個人設定を持たせる設計は誤り。ブックマークは独立したエンティティで管理する。

#### 2. プロジェクトスコープ

タグはプロジェクトに所属するため、ブックマークも `project_id` を保持する。プロジェクト横断で異なるタグを管理可能。

#### 3. 表示順序 (`order_index`) の管理

- サイドバー内のドラッグ&ドロップで並び替え可能
- プロジェクト横断での順序を管理
- 0 から始まる連番

### 補足: 全エンティティ共通の `projectId` 必須ルール

すべての ID 系パラメータ (`taskListId`, `taskId`, `subTaskId`, `tagId` および関連付け系) を必要とする処理では、`projectId` もセットで必要。理由:

1. すべてのエンティティはプロジェクトに所属する
2. プロジェクト横断でデータを扱う場合、ID 衝突を防ぐ
3. タスクから `projectId` が取得できる (逆引き可能)

例外: `getProjectIdByTagId(tagId)` のような逆引き専用メソッドは `projectId` 不要。
