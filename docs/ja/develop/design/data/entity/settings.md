# 設定系エンティティ定義

アプリ設定および設定 UI に関わるエンティティ。共通フォーマットは `_template.md` を参照。

## Settings — settings

**役割**: アプリ全設定を保持する統合エンティティ。設定画面での一括更新を前提。`id` は通常固定値 `"app_settings"`。

### フィールド

| 論理名 | 物理名 | Rust 型 | 制約 | デフォルト | 説明 |
| --- | --- | --- | --- | --- | --- |
| 設定 ID | id | String | PK, NN | "app_settings" | - |
| UI テーマ | theme | String | NN | "system" | "system" / "light" / "dark" |
| 言語 | language | String | NN | "ja" | ISO 639-1 |
| フォント名 | font | String | NN | "system" | - |
| フォントサイズ | font_size | i32 | NN | 14 | - |
| フォント色 | font_color | String | NN | "#000000" | - |
| 背景色 | background_color | String | NN | "#FFFFFF" | - |
| 週開始曜日 | week_start | String | NN | "monday" | "sunday" / "monday" |
| タイムゾーン | timezone | String | NN | "Asia/Tokyo" | - |
| カスタム期日日数 | custom_due_days | String | NN | "[1,3,7,14,30]" | JSON 配列文字列 |
| 最終選択アカウント ID | last_selected_account | String | NN | "" | - |

### 制約・インデックス

- PRIMARY KEY: `id`
- NOT NULL: 全カラム
- インデックス: `theme`, `language`

### 関連

- datetime_format (1:1), time_labels (1:N), due_date_buttons (1:N), view_items (1:N)

### 関連実装ファイル

- Rust モデル: `src-tauri/crates/flequit-model/src/models/settings.rs`
- TypeScript 型: `src/lib/types/settings.ts`

---

## DateTimeFormat — datetime_formats

**役割**: プリセット (負数 ID) とカスタム (UUID) の日時フォーマットを統合管理するビュー。UI 選択肢の一元化。

### フィールド

| 論理名 | 物理名 | Rust 型 | 制約 | デフォルト | 説明 |
| --- | --- | --- | --- | --- | --- |
| ID | id | String | PK, NN | - | UUID 文字列 / プリセットの負数文字列 |
| 表示名 | name | String | NN | - | UI 表示名 |
| フォーマット文字列 | format | String | NN | - | chrono 形式 |
| グループ | group | String | NN | - | プリセット / カスタム 等 |
| 表示順序 | order | i32 | NN | 0 | 昇順 |

### 制約・インデックス

- PRIMARY KEY: `id`
- インデックス: `group`, `order`

### 関連

- app_preset_formats, custom_datetime_formats

---

## DueDateButtons — due_date_buttons

**役割**: 期日設定 UI のクイックボタンの表示制御。

### フィールド

| 論理名 | 物理名 | Rust 型 | 制約 | デフォルト | 説明 |
| --- | --- | --- | --- | --- | --- |
| ID | id | String | PK, NN | - | - |
| 名前 | name | String | UK, NN | - | - |
| 表示フラグ | is_visible | bool | NN | true | - |
| 表示順序 | display_order | i32 | NN | - | - |

### 制約・インデックス

- PRIMARY KEY: `id` / UNIQUE: `name`
- インデックス: `(is_visible, display_order)`, `display_order`

### 補足

デフォルトボタン例: `overdue` / `today` / `tomorrow` / `three_days` / `this_week` / `this_month` / `this_quarter` / `this_year` / `this_year_end`。可視性とデフォルト並び順は実装側のシード定義 (`src-tauri/...`) を参照。

---

## RecurrenceRule — recurrence_rules

**役割**: タスク／サブタスクの繰り返し実行パターンを定義。RFC5545 (iCalendar) 準拠。複数タスクから参照可能な共有ルール。

### フィールド

| 論理名 | 物理名 | Rust 型 | 制約 | デフォルト | 説明 |
| --- | --- | --- | --- | --- | --- |
| ID | id | String | PK, NN | - | - |
| 単位 | unit | String | NN | - | day / week / month 等 |
| 間隔 | interval_value | i32 | NN | 1 | - |
| 終了日時 | end_date | Option\<DateTime\<Utc\>\> | - | NULL | - |
| 回数 | count | Option\<i32\> | - | NULL | - |
| 曜日指定 | by_weekday | Option\<String\> | - | NULL | カンマ区切り |
| 月内日指定 | by_monthday | Option\<String\> | - | NULL | カンマ区切り |
| 年内日指定 | by_yearday | Option\<String\> | - | NULL | カンマ区切り |
| 月指定 | by_month | Option\<String\> | - | NULL | カンマ区切り |
| 作成日時 | created_at | DateTime\<Utc\> | NN | - | - |
| 最終更新日時 | updated_at | DateTime\<Utc\> | NN | - | - |

### 制約・インデックス

- PRIMARY KEY: `id`
- インデックス: `unit`, `created_at`

### 関連

- task_recurrences, subtask_recurrences

---

## RecurrenceDetails — recurrence_details

**役割**: 繰り返しルールの詳細条件 (月末日、第 3 火曜日 等の細かい指定)。

### フィールド

| 論理名 | 物理名 | Rust 型 | 制約 | デフォルト | 説明 |
| --- | --- | --- | --- | --- | --- |
| ID | id | String | PK, NN | - | - |
| 月の特定日 | specific_date | Option\<i32\> | - | NULL | 1-31 |
| 期間内特定週 | week_of_period | Option\<String\> | - | NULL | 第 1 週 / 最終週 等 |
| 週の特定曜日 | weekday_of_week | Option\<String\> | - | NULL | - |

### 制約・インデックス

- PRIMARY KEY: `id`
- インデックス: `specific_date`, `week_of_period`

### 関連

- recurrence_rules

---

## TimeLabel — time_labels

**役割**: 時刻に対する意味的なラベル（朝礼／昼休み 等）。

### フィールド

| 論理名 | 物理名 | Rust 型 | 制約 | デフォルト | 説明 |
| --- | --- | --- | --- | --- | --- |
| ID | id | String | PK, NN | - | - |
| 名前 | name | String | NN | - | - |
| 時刻 | time | String | NN | - | HH:mm |

### 制約・インデックス

- PRIMARY KEY: `id`
- インデックス: `time`, `name`

---

## ViewItem — view_items

**役割**: メニューやボタン等の UI 表示要素の制御。

### フィールド

| 論理名 | 物理名 | Rust 型 | 制約 | デフォルト | 説明 |
| --- | --- | --- | --- | --- | --- |
| ID | id | String | PK, NN | - | - |
| 表示ラベル | label | String | NN | - | - |
| アイコン名 | icon | String | NN | - | - |
| 表示状態 | visible | bool | NN | true | - |
| 表示順序 | order | i32 | NN | 0 | - |

### 制約・インデックス

- PRIMARY KEY: `id`
- インデックス: `visible`, `order`
