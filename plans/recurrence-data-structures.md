# 繰り返し関連データ構造サマリ

作成日: 2025-11-01
目的: フロントエンドから SQLite / Automerge までの繰り返し系データ構造を整理し、今後の統一設計に向けたベース情報を共有する。

---

## 0. 繰り返しデータ構造の概要（JSONC 想定）
```json
{
  "recurrenceRule": {
    "id": "string | null",
    "interval": 1, // 繰り返し間隔
    "unit": "minute|hour|day|week|month|quarter|halfyear|year|fiscalYear", // 想定する単位
    "exitConditions": {
      "endDate": "2025-12-31T00:00:00.000Z | null",
      "maxOccurrences": 10
    },
    "globalAdjustment": {
      // ルール全体に適用する補正
      "holidayAdjustment": "none|skip|before|after",
      "monthEndAdjustment": "none|lastDay|before",
      "dateConditions": [
        {
          "id": "string",
          "relation": "before|on_or_before|on_or_after|after",
          "referenceDate": "2025-11-01T00:00:00.000Z"
        }
      ],
      "weekdayConditions": [
        {
          "id": "string",
          "ifWeekday": "monday|tuesday|wednesday|thursday|friday|saturday|sunday|weekday|weekend|holiday|non_holiday|weekend_only|non_weekend|weekend_holiday|non_weekend_holiday|specific_weekday",
          "thenDirection": "previous|next",
          "thenTarget": "weekday|weekend|holiday|non_holiday|weekend_only|non_weekend|weekend_holiday|non_weekend_holiday|specific_weekday",
          "thenWeekday": "monday|tuesday|wednesday|thursday|friday|saturday|sunday|null",
          "thenDays": 0
        }
      ]
    },
    "pattern": {
      // 既存構造との互換を意識した単一指定
      "monthly?": {
        "dayOfMonth": 15,
        "weekOfMonth": 2,
        "dayOfWeek": "monday"
      },
      "yearly?": {
        "month": 3,
        "dayOfMonth": 31,
        "weekOfMonth": 4,
        "dayOfWeek": "thursday"
      },
      // 拡張案: 複数指定と長期周期の表現
      "extended": {
        "weekly?": {
          "daysOfWeek": ["monday", "thursday"],
          "perPatternAdjustment": {
            "dateConditions": [],
            "weekdayConditions": []
          }
        },
        "monthly?": {
          "daysOfMonth": [1, 15, 28],
          "weeksOfMonth": [
            { "week": 2, "dayOfWeek": "monday" },
            { "week": 4, "dayOfWeek": "friday" }
          ],
          "perPatternAdjustment": {
            "dateConditions": [],
            "weekdayConditions": []
          }
        },
        "quarterly?": {
          // プロジェクトで管理する fiscalStartMonth を起点に解釈
          "offsetMonths": [0, 2], // 四半期開始からの月オフセット
          "daysOfMonth": [1, 15],
          "weeksOfQuarter": [
            { "week": 1, "dayOfWeek": "monday" },
            { "week": 10, "dayOfWeek": "friday" }
          ],
          "perPatternAdjustment": {
            "dateConditions": [],
            "weekdayConditions": []
          }
        },
        "halfyear?": {
          "offsetMonths": [0, 5], // 半期開始からの月オフセット
          "daysOfMonth": [1],
          "weeksOfHalfyear": [
            { "week": 1, "dayOfWeek": "monday" },
            { "week": 24, "dayOfWeek": "wednesday" }
          ],
          "perPatternAdjustment": {
            "dateConditions": [],
            "weekdayConditions": []
          }
        },
        "yearly?": {
          "months": [
            {
              "month": 3,
              "daysOfMonth": [15, 31],
              "weeksOfMonth": [{ "week": 4, "dayOfWeek": "thursday" }]
            },
            {
              "month": 9,
              "daysOfMonth": [],
              "weeksOfMonth": [{ "week": 1, "dayOfWeek": "monday" }]
            }
          ],
          "perPatternAdjustment": {
            "dateConditions": [],
            "weekdayConditions": []
          }
        },
        "fiscalYear?": {
          // 会計年度の開始月は project.fiscalStartMonth (将来的に導入予定)
          "months": [
            {
              "offset": 0, // 会計年度開始月からのオフセット
              "daysOfMonth": [1],
              "weeksOfMonth": []
            },
            {
              "offset": 6,
              "daysOfMonth": [1],
              "weeksOfMonth": [{ "week": 2, "dayOfWeek": "monday" }]
            }
          ],
          "perPatternAdjustment": {
            "dateConditions": [],
            "weekdayConditions": []
          }
        }
      }
    }
  }
}
```

## 1. フロントエンド (Svelte / TypeScript)

- **型定義**: `src/lib/types/recurrence.ts`, `src/lib/types/datetime-calendar.ts`
  - `RecurrenceRule`: unit / interval / daysOfWeek / pattern / adjustment / endDate / maxOccurrences
  - `RecurrenceAdjustment`: `holidayAdjustment`, `monthEndAdjustment`, `dateConditions: DateCondition[]`, `weekdayConditions: WeekdayCondition[]`
  - `DateCondition`: `{ id: string; relation: 'before' | 'on_or_before' | 'on_or_after' | 'after'; referenceDate?: Date }`
  - `WeekdayCondition`: 調整方向・対象などを保持
- **利用箇所**
  - 繰り返しダイアログ (`src/lib/components/recurrence/**`)
  - `RecurrenceState` / `RecurrenceRuleBuilder` / `DateConditionManager` / `WeekdayConditionManager`
  - `RecurrenceService` (次回日付計算) と `RecurrenceSyncService` (バックエンド同期)
  - JSON 送信時は `RecurrenceRule` を直接 API に渡し、必要に応じ `JSON.stringify` で補正部分を文字列化 (`src/lib/utils/recurrence-converter.ts`)

### 既知ギャップ
- `DateCondition` はメタデータ（created_at 等）を持たない軽量定義。
- `referenceDate` の実体は `Date` または `SvelteDate`。UTC への正規化ルール未確定。

---

## 2. ドメイン層 (`flequit-model`)

- **主な構造体**
  - `DateCondition` (`src-tauri/crates/flequit-model/src/models/task_projects/date_condition.rs`)
    - 追加フィールド: `created_at`, `updated_at`, `deleted`, `updated_by`
    - `reference_date: DateTime<Utc>`
  - `RecurrenceAdjustment` (`recurrence_adjustment.rs`): `date_conditions: Vec<DateCondition>`, `weekday_conditions: Vec<WeekdayCondition>`
  - `RecurrenceDetail` (`recurrence_details.rs`): `date_conditions: Option<Vec<DateCondition>>` など
  - `RecurrenceRule` (`recurrence_rule.rs`): Pattern や Adjustment をもつ完全モデル
- **未実装の点**
  - `recurrence_date_condition` モジュールが存在せず、インフラ層からの参照が解決できない。
  - UI で保持する軽量 `DateCondition` との変換レイヤー未整備。

---

## 3. リポジトリ層 (`flequit-repository`)

- `DateConditionRepositoryTrait` (`src-tauri/crates/flequit-repository/src/repositories/task_projects/date_condition_repository_trait.rs`)
  - `ProjectRepository<DateCondition, DateConditionId>` を継承。
  - Automerge / SQLite 双方の実装に共通インターフェースを提供。
- 既存のサービス (`datetime_service.rs`) は現状スタブ実装。将来的にはここ経由で CRUD を行う想定。

---

## 4. インフラ層

### 4.1 SQLite (`flequit-infrastructure-sqlite`)

- `date_conditions` テーブル (`models/task_projects/date_condition.rs`)
  - カラム: `project_id`, `id`, `relation`, `reference_date`, `created_at`, `updated_at`, `deleted`, `updated_by`
  - `SqliteModelConverter<DateCondition>` によりドメイン構造体へ変換。
- `recurrence_date_condition` テーブル定義あり (`models/task_projects/recurrence_date_condition.rs`)
  - フィールド: `project_id`, `id`, `recurrence_adjustment_id`, `recurrence_detail_id`, `relation`, `reference_date`, `created_at`, `updated_at`, `updated_by`, `deleted`
  - **課題**: ドメイン側の `RecurrenceDateCondition` が未定義のためビルドエラー (未解決インポート)。
- `recurrence_detail` / `recurrence_adjustment` とはリレーションを設定し、繰り返しルールの追加条件として紐付け可能な構造を想定。

### 4.2 Automerge (`flequit-infrastructure-automerge`)

- `DateConditionLocalAutomergeRepository` (`infrastructure/task_projects/date_condition.rs`)
  - ドキュメントキー `date_conditions` に `Vec<DateCondition>` を保存/読取。
  - 既存実装は `DateCondition` ドメイン構造体に対応。
- `recurrence_date_condition` ドキュメント (`models/task_projects/recurrence_date_condition.rs`)
  - `RecurrenceDateConditionDocument`: `recurrence_rule_id`, `date_condition_id`, `created_at`
  - こちらもドメイン側の型未定義でインフラ内のみ完結。

---

## 5. 層間マッピングまとめ

| レイヤ | 型/テーブル | 備考 |
| ------ | ----------- | ---- |
| フロントエンド | `DateCondition` (軽量) | `referenceDate` 任意。ID は文字列。 |
| ドメイン | `DateCondition` | `DateTime<Utc>` + メタ情報。`RecurrenceAdjustment` 等から利用。 |
| SQLite | `date_conditions` 行 | ドメインと同じフィールド。`project_id` でスコープ化。 |
| SQLite | `recurrence_date_conditions` 行 | `recurrence_adjustment_id` / `recurrence_detail_id` と紐付け。ドメイン型未整備。 |
| Automerge | `date_conditions` ドキュメント | `Vec<DateCondition>` を CRDT 管理。 |
| Automerge | `recurrence_date_conditions` ドキュメント | ルール ID と条件 ID を紐付ける軽量構造。ドメイン未整備。 |

---

## 6. 整備が必要なポイント

1. **命名と型の統一**
   - `recurrence_date_condition` をドメイン層にも追加し、SQLite/Automerge と一致させる。
   - フロントエンドの `DateCondition` との相互変換 (`referenceDate` -> `DateTime<Utc>`, メタ情報補完) を設計。
2. **サービスレイヤの実装**
   - `datetime_service` の日付条件 CRUD を実装し、UI → ドメイン → リポジトリの流れを確認。
3. **同期パイプラインの整理**
   - `RecurrenceSyncService` がライト時に `DateCondition` / `RecurrenceDateCondition` をどう扱うか仕様化。
4. **テーブル/ドキュメント整合性チェック**
   - `recurrence_detail` -> `recurrence_date_condition` リレーションの設計意図を明示し、利用シナリオを洗い出す。
5. **フロントエンド型の拡張検討**
   - メタ情報を扱う必要がある場合、UI 型にも `createdAt` 等を追加するか、別 DTO を用意するか決定。

---

## 7. 次のステップ案

1. ドメイン層に `RecurrenceDateCondition` (および変換ロジック) を追加し、インフラ層のビルドエラーを解消。
2. フロントエンドとの型差異（`Date` vs `DateTime<Utc>`、メタ情報）を吸収するマッピング層を議論。
3. `RecurrenceRule` 保存フローをシーケンス図などで整理し、どの段階で `recurrence_date_condition` が必要になるか明確化。
4. 上記を踏まえてテストデータ/マイグレーションの整備・追加。

---

※このドキュメントは暫定まとめです。今後の設計検討に合わせて更新してください。
