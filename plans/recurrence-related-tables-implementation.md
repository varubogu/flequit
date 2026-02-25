# RecurrenceRule関連テーブル実装計画

## 概要

繰り返しルール（RecurrenceRule）の`adjustment`と`details`(pattern)を正しく保存・取得するため、関連テーブルの実装を完了させる。

## 進捗サマリ（2026-02-25時点）

- ✅ Phase 1: 関連テーブルモデル確認完了
- ✅ Phase 2.1: `adjustment` + 子テーブル（`recurrence_date_conditions`, `recurrence_weekday_conditions`）保存完了
- ✅ Phase 2.2: `details` + 子テーブル（`recurrence_date_conditions`）保存完了
- ✅ Phase 2.3: `days_of_week` 保存完了
- ✅ Phase 3: `adjustment` / `details` / `days_of_week` の読込完了（`find_by_id` / `find_all`）
- ✅ Phase 4: トランザクション + 既存関連データ削除→再作成戦略を `details` / `days_of_week` まで拡張完了
- 🟡 Phase 5: `recurrence_rule` 向けテスト追加と対象検証は完了。全体統合テストは既存スキーマ不整合により別課題が残る

## 背景

### 現在の問題

1. **設計**: `recurrence_rules`テーブルは基本フィールド（unit, interval, end_date, max_occurrences）のみ
2. **関連テーブル**: `recurrence_adjustment`と`recurrence_detail`は別テーブルとして設計されている
3. **残課題**: `recurrence_rule` の専用テストは追加済み。全体統合テスト基盤（テンプレートDBと現行スキーマの差分）が未整備
4. **残リスク**: 全体統合テストが壊れているため、他機能との横断回帰検知が弱い

### 現在の実装状況

#### RecurrenceRuleモデル (src-tauri/crates/flequit-infrastructure-sqlite/src/models/task_projects/recurrence_rule.rs)

```rust
// 関連データ本体はリポジトリ層で読込む前提
days_of_week: None, // 紐づけテーブルから取得
details: None,      // 関連テーブルから取得
adjustment: None,   // 関連テーブルから取得
```

#### RecurrenceRuleリポジトリ (src-tauri/crates/flequit-infrastructure-sqlite/src/infrastructure/task_projects/recurrence_rule.rs)

```rust
// save()でトランザクション + 既存関連データ削除
self.delete_related_data(&txn, project_id, &rule.id).await?;

// adjustment保存は実装済み
if let Some(ref adjustment) = rule.adjustment {
    self.save_adjustment(&txn, project_id, &rule.id, adjustment).await?;
}

// details / days_of_week も保存済み
if let Some(ref details) = rule.details {
    self.save_details(&txn, project_id, &rule.id, details).await?;
}
self.save_days_of_week(&txn, project_id, rule).await?;

// find_by_id / find_all で adjustment / details / days_of_week を読込
rule.adjustment = self.load_adjustment(db, project_id, id).await?;
rule.details = self.load_details(db, project_id, id).await?;
rule.days_of_week = self.load_days_of_week(db, project_id, id).await?;
```

## 実装計画

### Phase 1: 関連テーブルモデルの確認と理解

#### 1.1 既存モデルの確認

以下のファイルを確認：

- [x] `src-tauri/crates/flequit-infrastructure-sqlite/src/models/task_projects/recurrence_adjustment.rs`
- [x] `src-tauri/crates/flequit-infrastructure-sqlite/src/models/task_projects/recurrence_detail.rs`
- [x] `src-tauri/crates/flequit-infrastructure-sqlite/src/models/task_projects/recurrence_days_of_week.rs`
- [x] `src-tauri/crates/flequit-infrastructure-sqlite/src/models/task_projects/recurrence_date_condition.rs`
- [x] `src-tauri/crates/flequit-infrastructure-sqlite/src/models/task_projects/recurrence_weekday_condition.rs`

#### 1.2 テーブル構造の把握

マイグレーションファイルから各テーブルのスキーマを確認

### Phase 2: 保存処理の実装

#### 2.1 RecurrenceAdjustmentの保存

**ファイル**: `src-tauri/crates/flequit-infrastructure-sqlite/src/infrastructure/task_projects/recurrence_rule.rs`

**実装内容**:
- `save`メソッドを拡張
- `rule.adjustment`が存在する場合、`recurrence_adjustment`テーブルに保存
- 既存の`adjustment`がある場合は更新、ない場合は新規作成

**関連処理**:
- DateConditionのリスト保存 → `recurrence_date_conditions`テーブル
- WeekdayConditionのリスト保存 → `recurrence_weekday_conditions`テーブル

#### 2.2 RecurrenceDetailの保存

**実装内容**:
- `rule.details`が存在する場合、`recurrence_details`テーブルに保存
- `date_conditions` を `recurrence_date_conditions` へ分離保存

#### 2.3 DaysOfWeekの保存

**実装内容**:
- `rule.days_of_week`が存在する場合、`recurrence_days_of_week`テーブルに保存
- 多対多のリレーション処理

### Phase 3: 取得処理の実装

#### 3.1 関連テーブルのJOIN

**ファイル**: `src-tauri/crates/flequit-infrastructure-sqlite/src/models/task_projects/recurrence_rule.rs`

**実装内容**:
- `to_domain_model`メソッドを拡張（ただし、モデル層ではDB操作不可）
- または、リポジトリ層で`find_by_id`時に関連データを取得

**方針**:
リポジトリ層で実装する方が適切：

```rust
// 疑似コード
async fn find_by_id(&self, project_id: &ProjectId, id: &RecurrenceRuleId)
    -> Result<Option<RecurrenceRule>, RepositoryError> {

    // 1. メインレコード取得
    let model = RecurrenceRuleEntity::find_by_id(...).one(db).await?;

    // 2. 関連データ取得
    let days_of_week = RecurrenceDaysOfWeekEntity::find()
        .filter(Column::RecurrenceRuleId.eq(id))
        .all(db).await?;

    let adjustment = RecurrenceAdjustmentEntity::find()
        .filter(Column::RecurrenceRuleId.eq(id))
        .one(db).await?;

    let details = RecurrenceDetailEntity::find()
        .filter(Column::RecurrenceRuleId.eq(id))
        .one(db).await?;

    // 3. ドメインモデル構築
    let mut rule = model.to_domain_model().await?;
    rule.days_of_week = convert_days_of_week(days_of_week);
    rule.adjustment = convert_adjustment(adjustment).await?;
    rule.details = convert_details(details);

    Ok(Some(rule))
}
```

#### 3.2 Adjustmentの子データ取得

**実装内容**:
- DateConditionのリスト取得
- WeekdayConditionのリスト取得
- これらを`RecurrenceAdjustment`ドメインモデルに変換

### Phase 4: 更新処理の実装

#### 4.1 既存データの削除と再作成戦略

**方針**:
- シンプルさのため、既存の関連データを削除してから新規作成
- トランザクション内で実行して整合性を保証

**実装内容**:
```rust
// 疑似コード
async fn save(...) {
    let transaction = db.begin().await?;

    // 1. メインレコード保存/更新
    save_main_record(&transaction, rule).await?;

    // 2. 既存関連データ削除
    delete_related_data(&transaction, rule.id).await?;

    // 3. 新規関連データ作成
    if let Some(adjustment) = &rule.adjustment {
        create_adjustment(&transaction, rule.id, adjustment).await?;
    }
    if let Some(details) = &rule.details {
        create_details(&transaction, rule.id, details).await?;
    }
    if let Some(days) = &rule.days_of_week {
        create_days_of_week(&transaction, rule.id, days).await?;
    }

    transaction.commit().await?;
}
```

### Phase 5: テストと検証

#### 5.1 ユニットテスト

- 保存処理のテスト
- 取得処理のテスト
- 更新処理のテスト

#### 5.2 統合テスト

- フロントエンドからバックエンドまでの全体フロー
- 「有効（高度）」モードの保存と取得

## 実装順序

1. ✅ **Phase 1**: 関連テーブルモデルの確認（30分）
2. ✅ **Phase 2.1**: RecurrenceAdjustment保存処理（2時間）
3. ✅ **Phase 2.2**: RecurrenceDetail保存処理（1時間）
4. ✅ **Phase 2.3**: DaysOfWeek保存処理（1時間）
5. ✅ **Phase 3**: 取得処理の実装（2時間）
6. ✅ **Phase 4**: 更新処理の実装（1時間）
7. 🟡 **Phase 5**: テストと検証（1時間）
   - 実施済み: `recurrence_rule` のユニットテスト3件追加（保存/取得/更新置換 + 変換ヘルパー）
   - 実施済み: `cargo test -j 4 -p flequit-infrastructure-sqlite recurrence_rule::tests` で3件成功
   - 残課題: `cargo test -j 4 -p flequit-infrastructure-sqlite` は既存の統合テスト41件がスキーマ不整合（`projects.updated_by` など）で失敗

**残作業の推定時間**: 2.0〜4.0時間（統合テスト基盤の修正を含む）

## リスク

1. **複雑な関連データ構造**: 多重ネストの処理が複雑
2. **トランザクション管理**: 複数テーブルへの保存の整合性
3. **パフォーマンス**: N+1問題の可能性

## 代替案

### 代替案A: JSON文字列でメインテーブルに保存

**メリット**:
- 実装が簡単（1-2時間）
- トランザクション不要
- パフォーマンスが良い

**デメリット**:
- SQLでのクエリが困難
- 正規化されていない
- データ整合性チェックが弱い

**実装方法**:
1. `recurrence_rules`テーブルに`adjustment_json`、`details_json`カラムを追加
2. JSON文字列として保存・取得
3. ドメインモデル変換時にデシリアライズ

### 代替案B: Automergeに依存

**メリット**:
- SQLiteは最小限の実装
- 同期時はAutomergeが主

**デメリット**:
- オフライン時の検索性能が低い
- SQLiteの利点を活かせない

## 決定事項

- [x] 実装方針の決定（本格実装を採用。関連テーブルへ正規化して保存）
- [ ] スケジュール調整

## 参考資料

- [recurrence-data-structures.md](./recurrence-data-structures.md) - 繰り返しデータ構造の全体設計
- SQLiteモデル: `src-tauri/crates/flequit-infrastructure-sqlite/src/models/task_projects/`
- Automergeモデル: `src-tauri/crates/flequit-infrastructure-automerge/src/models/task_projects/`
