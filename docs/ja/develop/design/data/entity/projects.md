# プロジェクト系エンティティ定義

プロジェクト・タスク・サブタスク・タグ・メンバー・繰り返し関連の全エンティティを定義する。共通フォーマットは `_template.md` を参照。

## Project — projects

**役割**: プロジェクト管理の基本エンティティ。タスクやメンバーの親コンテナ。

### フィールド

| 論理名 | 物理名 | Rust 型 | 制約 | デフォルト | 外部キー | 説明 |
| --- | --- | --- | --- | --- | --- | --- |
| プロジェクト ID | id | ProjectId | PK, NN | - | - | 一意識別子 |
| プロジェクト名 | name | String | NN | - | - | - |
| 説明 | description | Option\<String\> | - | NULL | - | - |
| カラー | color | Option\<String\> | - | NULL | - | - |
| 表示順序 | order_index | i32 | NN | 0 | - | - |
| アーカイブ状態 | is_archived | bool | NN | false | - | - |
| ステータス | status | Option\<String\> | - | NULL | - | - |
| オーナー ID | owner_id | Option\<UserId\> | - | NULL | users.id | - |
| 作成日時 | created_at | DateTime\<Utc\> | NN | - | - | - |
| 最終更新日時 | updated_at | DateTime\<Utc\> | NN | - | - | - |

### 制約

- PRIMARY KEY: `id`
- FOREIGN KEY: `owner_id → users.id`
- NOT NULL: `id, name, order_index, is_archived, created_at, updated_at`

### インデックス対象カラム

`owner_id`, `order_index`, `created_at`

### 関連

- task_lists, tasks, tags, members

---

## TaskList — task_lists

**役割**: プロジェクト内でタスクを分類するリスト。カンバン列・GTD リスト等に利用。

### フィールド

| 論理名 | 物理名 | Rust 型 | 制約 | デフォルト | 外部キー | 説明 |
| --- | --- | --- | --- | --- | --- | --- |
| ID | id | TaskListId | PK, NN | - | - | - |
| プロジェクト ID | project_id | ProjectId | NN | - | projects.id | - |
| 名前 | name | String | NN | - | - | - |
| 説明 | description | Option\<String\> | - | NULL | - | - |
| 表示順序 | order_index | i32 | NN | 0 | - | - |
| アーカイブ状態 | is_archived | bool | NN | false | - | - |
| 作成日時 | created_at | DateTime\<Utc\> | NN | - | - | - |
| 最終更新日時 | updated_at | DateTime\<Utc\> | NN | - | - | - |

### 制約

- PRIMARY KEY: `id`
- FOREIGN KEY: `project_id → projects.id`
- NOT NULL: `id, project_id, name, order_index, is_archived, created_at, updated_at`

### インデックス対象カラム

`project_id`, `order_index`, `created_at`

### 関連

- projects, tasks

### 補足

タスクは task_list なしで直接プロジェクトに属することも可能。

---

## Task — tasks

**役割**: タスク管理の中核。作業項目の詳細情報と状態を保持。

### フィールド

| 論理名 | 物理名 | Rust 型 | 制約 | デフォルト | 外部キー | 説明 |
| --- | --- | --- | --- | --- | --- | --- |
| タスク ID | id | TaskId | PK, NN | - | - | - |
| プロジェクト ID | project_id | ProjectId | NN | - | projects.id | - |
| タスクリスト ID | task_list_id | Option\<TaskListId\> | - | NULL | task_lists.id | 任意 |
| タイトル | title | String | NN | - | - | - |
| 詳細説明 | description | Option\<String\> | - | NULL | - | - |
| ステータス | status | String | NN | "Todo" | - | - |
| 優先度 | priority | String | NN | "Medium" | - | - |
| 重要度 | importance | String | NN | "Medium" | - | - |
| 期限日時 | due_date | Option\<DateTime\<Utc\>\> | - | NULL | - | - |
| 予定開始日時 | plan_start_date | Option\<DateTime\<Utc\>\> | - | NULL | - | - |
| 予定終了日時 | plan_end_date | Option\<DateTime\<Utc\>\> | - | NULL | - | - |
| 実開始日時 | do_start_date | Option\<DateTime\<Utc\>\> | - | NULL | - | - |
| 実終了日時 | do_end_date | Option\<DateTime\<Utc\>\> | - | NULL | - | - |
| 表示順序 | order_index | i32 | NN | 0 | - | - |
| アーカイブ状態 | is_archived | bool | NN | false | - | - |
| 作成日時 | created_at | DateTime\<Utc\> | NN | - | - | - |
| 最終更新日時 | updated_at | DateTime\<Utc\> | NN | - | - | - |

### 制約

- PRIMARY KEY: `id`
- FOREIGN KEY: `project_id → projects.id`, `task_list_id → task_lists.id`
- NOT NULL: `id, project_id, title, status, priority, importance, order_index, is_archived, created_at, updated_at`

### インデックス対象カラム

`project_id`, `task_list_id`, `status`, `due_date`, `order_index`, `created_at`

### 関連

- projects, task_lists, subtasks, task_assignments, task_tags, task_recurrences

### 補足

日時管理は計画 (plan) と実績 (do) を分離。

---

## SubTask — subtasks

**役割**: タスクを細分化した作業項目。親タスクに従属。独立した完了状態とステータスを持つ。

### フィールド

| 論理名 | 物理名 | Rust 型 | 制約 | デフォルト | 外部キー | 説明 |
| --- | --- | --- | --- | --- | --- | --- |
| サブタスク ID | id | SubTaskId | PK, NN | - | - | - |
| タスク ID | task_id | TaskId | NN | - | tasks.id | 親タスク |
| タイトル | title | String | NN | - | - | - |
| 説明 | description | Option\<String\> | - | NULL | - | - |
| ステータス | status | String | NN | "not_started" | - | - |
| 優先度 | priority | Option\<i32\> | - | NULL | - | - |
| 予定開始日時 | plan_start_date | Option\<DateTime\<Utc\>\> | - | NULL | - | - |
| 予定終了日時 | plan_end_date | Option\<DateTime\<Utc\>\> | - | NULL | - | - |
| 実開始日時 | do_start_date | Option\<DateTime\<Utc\>\> | - | NULL | - | - |
| 実終了日時 | do_end_date | Option\<DateTime\<Utc\>\> | - | NULL | - | - |
| 期間指定フラグ | is_range_date | Option\<bool\> | - | NULL | - | - |
| 表示順序 | order_index | i32 | NN | 0 | - | - |
| 完了状態 | completed | bool | NN | false | - | - |
| 作成日時 | created_at | DateTime\<Utc\> | NN | - | - | - |
| 最終更新日時 | updated_at | DateTime\<Utc\> | NN | - | - | - |

### 制約

- PRIMARY KEY: `id`
- FOREIGN KEY: `task_id → tasks.id`
- NOT NULL: `id, task_id, title, status, order_index, completed, created_at, updated_at`

### インデックス対象カラム

`task_id`, `status`, `order_index`, `completed`, `created_at`

### 関連

- tasks, subtask_assignments, subtask_tags, subtask_recurrences

---

## Tag — tags

**役割**: プロジェクト内でタスク／サブタスクを分類するラベル。色情報を持つ。

### フィールド

| 論理名 | 物理名 | Rust 型 | 制約 | デフォルト | 外部キー | 説明 |
| --- | --- | --- | --- | --- | --- | --- |
| タグ ID | id | TagId | PK, NN | - | - | - |
| プロジェクト ID | project_id | ProjectId | NN | - | projects.id | - |
| タグ名 | name | String | NN | - | - | - |
| 背景色 | color | String | NN | "#808080" | - | HEX |
| 文字色 | text_color | String | NN | "#FFFFFF" | - | HEX |
| 表示順序 | order_index | i32 | NN | 0 | - | - |
| 作成日時 | created_at | DateTime\<Utc\> | NN | - | - | - |
| 最終更新日時 | updated_at | DateTime\<Utc\> | NN | - | - | - |

### 制約

- PRIMARY KEY: `id`
- FOREIGN KEY: `project_id → projects.id`
- NOT NULL: `id, project_id, name, color, text_color, order_index, created_at, updated_at`

### インデックス対象カラム

`project_id`, `order_index`, `created_at`

### 関連

- projects, task_tags, subtask_tags

---

## TagBookmark (プロジェクトスコープ) — tag_bookmarks

**役割**: サイドバー固定表示するプロジェクトスコープのタグ。プロジェクト横断表示のため `(project_id, tag_id)` の複合主キー。

### フィールド

| 論理名 | 物理名 | Rust 型 | 制約 | デフォルト | 外部キー | 説明 |
| --- | --- | --- | --- | --- | --- | --- |
| プロジェクト ID | project_id | ProjectId | PK, NN | - | projects.id | - |
| タグ ID | tag_id | TagId | PK, NN | - | tags.id | - |
| 表示順序 | order_index | i32 | NN | 0 | - | - |
| 作成日時 | created_at | DateTime\<Utc\> | NN | - | - | - |

### 制約

- PRIMARY KEY: `(project_id, tag_id)`
- FOREIGN KEY: `project_id → projects.id`, `tag_id → tags.id`
- NOT NULL: 全カラム

### インデックス対象カラム

`order_index`, `created_at` (PK は自動)

### 補足

ユーザー設定としての `user_tag_bookmarks` は `user-preferences.md` を参照。

---

## Member — members

**役割**: プロジェクトへのユーザー参加状態と権限。多対多関係を複合主キーで管理。

### フィールド

| 論理名 | 物理名 | Rust 型 | 制約 | デフォルト | 外部キー | 説明 |
| --- | --- | --- | --- | --- | --- | --- |
| プロジェクト ID | project_id | ProjectId | PK, NN | - | projects.id | - |
| ユーザー ID | user_id | UserId | PK, NN | - | users.id | - |
| 権限役割 | role | String | NN | "Member" | - | - |
| 参加日時 | joined_at | DateTime\<Utc\> | NN | - | - | - |
| 最終更新日時 | updated_at | DateTime\<Utc\> | NN | - | - | - |

### 制約

- PRIMARY KEY: `(project_id, user_id)`
- FOREIGN KEY: `project_id → projects.id`, `user_id → users.id`

### インデックス対象カラム

`project_id`, `user_id`, `role`, `joined_at`

---

## TaskAssignment — task_assignments

**役割**: タスクと担当ユーザーの多対多関連付け。プロジェクト横断管理のため `project_id` を含む 3 カラム複合主キー。

### フィールド

| 論理名 | 物理名 | Rust 型 | 制約 | デフォルト | 外部キー | 説明 |
| --- | --- | --- | --- | --- | --- | --- |
| プロジェクト ID | project_id | ProjectId | PK, NN | - | projects.id | - |
| タスク ID | task_id | TaskId | PK, NN | - | tasks.id | - |
| ユーザー ID | user_id | UserId | PK, NN | - | users.id | - |
| 作成日時 | created_at | DateTime\<Utc\> | NN | - | - | - |

### 制約

- PRIMARY KEY: `(project_id, task_id, user_id)`
- FOREIGN KEY: 各カラムが対応テーブルへ

### インデックス対象カラム

`project_id`, `task_id`, `user_id`, `created_at`

---

## SubtaskAssignment — subtask_assignments

**役割**: サブタスクと担当ユーザーの多対多関連付け。同上 3 カラム複合主キー。

### フィールド

| 論理名 | 物理名 | Rust 型 | 制約 | デフォルト | 外部キー | 説明 |
| --- | --- | --- | --- | --- | --- | --- |
| プロジェクト ID | project_id | ProjectId | PK, NN | - | projects.id | - |
| サブタスク ID | subtask_id | SubTaskId | PK, NN | - | subtasks.id | - |
| ユーザー ID | user_id | UserId | PK, NN | - | users.id | - |
| 作成日時 | created_at | DateTime\<Utc\> | NN | - | - | - |

### 制約

- PRIMARY KEY: `(project_id, subtask_id, user_id)`
- FOREIGN KEY: 各カラムが対応テーブルへ

### インデックス対象カラム

`project_id`, `subtask_id`, `user_id`, `created_at`

---

## TaskTag — task_tags

**役割**: タスクとタグの多対多関連付け。同 3 カラム複合主キー。

### フィールド

| 論理名 | 物理名 | Rust 型 | 制約 | デフォルト | 外部キー | 説明 |
| --- | --- | --- | --- | --- | --- | --- |
| プロジェクト ID | project_id | ProjectId | PK, NN | - | projects.id | - |
| タスク ID | task_id | TaskId | PK, NN | - | tasks.id | - |
| タグ ID | tag_id | TagId | PK, NN | - | tags.id | - |
| 作成日時 | created_at | DateTime\<Utc\> | NN | - | - | - |

### 制約・インデックス

- PRIMARY KEY: `(project_id, task_id, tag_id)` / FK: 対応テーブル
- インデックス: `project_id`, `task_id`, `tag_id`, `created_at`

---

## SubtaskTag — subtask_tags

**役割**: サブタスクとタグの多対多関連付け。同 3 カラム複合主キー。

### フィールド

| 論理名 | 物理名 | Rust 型 | 制約 | デフォルト | 外部キー | 説明 |
| --- | --- | --- | --- | --- | --- | --- |
| プロジェクト ID | project_id | ProjectId | PK, NN | - | projects.id | - |
| サブタスク ID | subtask_id | SubTaskId | PK, NN | - | subtasks.id | - |
| タグ ID | tag_id | TagId | PK, NN | - | tags.id | - |
| 作成日時 | created_at | DateTime\<Utc\> | NN | - | - | - |

### 制約・インデックス

- PRIMARY KEY: `(project_id, subtask_id, tag_id)` / FK: 対応テーブル
- インデックス: `project_id`, `subtask_id`, `tag_id`, `created_at`

---

## TaskRecurrence — task_recurrences

**役割**: タスクと繰り返しルールの多対多関連付け。

### フィールド

| 論理名 | 物理名 | Rust 型 | 制約 | デフォルト | 外部キー | 説明 |
| --- | --- | --- | --- | --- | --- | --- |
| タスク ID | task_id | TaskId | PK, NN | - | tasks.id | - |
| 繰り返しルール ID | recurrence_rule_id | String | PK, NN | - | recurrence_rules.id | - |
| 作成日時 | created_at | DateTime\<Utc\> | NN | - | - | - |

### 制約・インデックス

- PRIMARY KEY: `(task_id, recurrence_rule_id)` / FK: 対応テーブル
- インデックス: `task_id`, `recurrence_rule_id`, `created_at`

---

## SubtaskRecurrence — subtask_recurrences

**役割**: サブタスクと繰り返しルールの多対多関連付け。

### フィールド

| 論理名 | 物理名 | Rust 型 | 制約 | デフォルト | 外部キー | 説明 |
| --- | --- | --- | --- | --- | --- | --- |
| サブタスク ID | subtask_id | SubTaskId | PK, NN | - | subtasks.id | - |
| 繰り返しルール ID | recurrence_rule_id | String | PK, NN | - | recurrence_rules.id | - |
| 作成日時 | created_at | DateTime\<Utc\> | NN | - | - | - |

### 制約・インデックス

- PRIMARY KEY: `(subtask_id, recurrence_rule_id)` / FK: 対応テーブル
- インデックス: `subtask_id`, `recurrence_rule_id`, `created_at`

---

## DateCondition — date_conditions

**役割**: 日付に基づく条件判定（基準日との関係性）。

### フィールド

| 論理名 | 物理名 | Rust 型 | 制約 | デフォルト | 外部キー | 説明 |
| --- | --- | --- | --- | --- | --- | --- |
| 条件 ID | id | String | PK, NN | - | - | - |
| 関係性 | relation | String | NN | - | - | 前 / 後 / 同じ等 |
| 比較基準日付 | reference_date | DateTime\<Utc\> | NN | - | - | - |

### 制約・インデックス

- PRIMARY KEY: `id`
- インデックス: `relation`, `reference_date`

---

## WeekdayCondition — weekday_conditions

**役割**: 曜日に基づく条件調整（営業日調整・特定曜日固定タスク等）。

### フィールド

| 論理名 | 物理名 | Rust 型 | 制約 | デフォルト | 外部キー | 説明 |
| --- | --- | --- | --- | --- | --- | --- |
| 条件 ID | id | String | PK, NN | - | - | - |
| 判定対象曜日 | if_weekday | String | NN | - | - | - |
| 調整方向 | then_direction | String | NN | - | - | 前 / 後 / 最近 等 |
| 調整対象 | then_target | String | NN | - | - | 平日 / 特定曜日 / 日数 等 |
| 調整先曜日 | then_weekday | Option\<String\> | - | NULL | - | target=特定曜日時 |
| 調整日数 | then_days | Option\<i32\> | - | NULL | - | target=日数時 |

### 制約・インデックス

- PRIMARY KEY: `id`
- インデックス: `if_weekday`, `then_target`

---

## 設計原則: 関連付けエンティティと `project_id`

すべての関連付けエンティティ (`*_assignments`, `*_tags`) では、複合主キーに `project_id` を含める。理由:

1. **所属関係**: タスク／サブタスク／タグ／ユーザーはすべてプロジェクトに所属する
2. **横断データ管理**: 複数プロジェクトのデータを一元的に扱う際に `project_id` で特定が必要
3. **データ整合性**: FOREIGN KEY 制約でプロジェクトを跨いだ不正な関連付けを防止
