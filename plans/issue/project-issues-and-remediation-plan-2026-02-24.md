# プロジェクト問題点整理と改善計画

作成日: 2026-02-24
対象: flequit リポジトリ全体（Frontend / Backend / Tests）

## 進捗（2026-02-25）

- ✅ Phase 1（即時復旧）: `bun check` / `bun run lint` / `task-tauri-service` 単体テストを通過
- ✅ Phase 2（規約整合）: `utils -> stores/services` 依存を撤去し、`current-user-id` を services 層へ移設
- ✅ Phase 3（Rust 安全性）: `std::mem::zeroed::<DatabaseManager>()` を廃止し、安全な初期化へ置換
- ✅ Phase 4（回帰防止）: 共通 factory 導入・テスト基盤整理を実施
- ✅ Phase 4 補足: `src-tauri/src/logger.rs` に root crate のユニットテストを追加（`cargo test -j 4` で 1 件実行）

## 調査方法

以下のコマンドを実行して現状を確認した。

- `bun check`
- `bun run lint`
- `bun run test tests/infrastructure/backends/tauri/task-tauri-service.test.ts`
- `cargo check --quiet`（`src-tauri`）
- `cargo test -j 4`（`src-tauri`）

## 問題点サマリ（優先度順）

| 優先度 | 問題 | 根拠 | 影響 |
| --- | --- | --- | --- |
| P0 | Frontend 型チェックが崩壊 | `bun check` で 67 ファイル・233 エラー。主因は `deleted` / `updatedBy` 追加に対してテストデータが未追随 | CI 不通、型安全性低下、回帰検知不能 |
| P0 | Frontend Lint が失敗 | `bun run lint` で 17 エラー。未使用変数/未使用 import、構文エラー、レイヤ違反 import が混在 | マージ不可、規約逸脱の放置 |
| P0 | 特定テストが構文エラーで実行不能 | `tests/infrastructure/backends/tauri/task-tauri-service.test.ts:86` で `Expected ")" but found ":"` | テスト実行前に落ちるため品質ゲートが機能しない |
| P1 | アーキテクチャ違反（utils -> stores 参照） | `src/lib/utils/user-id-helper.ts` で `accountStore` を直接 import。Lint ルール違反として検出 | レイヤ境界崩壊、依存の複雑化 |
| P1 | Rust 側に未定義動作リスク | `src-tauri/crates/flequit-infrastructure/src/infrastructure_repositories.rs:147` の `std::mem::zeroed::<DatabaseManager>()` に警告 | 将来的な実行時クラッシュ/UB リスク |
| P2 | Rust テスト密度が低い | `cargo test -j 4` は通過したがユニットテスト 0 件（統合テスト 3 件のみ） | 変更耐性が低く、回帰検知の網羅性不足 |

## 問題詳細（主要ファイル）

- 型不整合の代表:
  - `tests/components/task/core/task-content.svelte.test.ts`
  - `tests/stores/tasks/task-stores.test.ts`
  - `tests/utils/project-tree-traverser.test.ts`
- Lint エラーの代表:
  - `src/lib/services/domain/recurrence-service.ts`
  - `src/lib/services/domain/recurrence-sync.ts`
  - `src/lib/services/domain/tag.ts`
  - `src/lib/services/ui/task-detail/task-detail-actions.ts`
  - `src/lib/stores/tags.svelte.ts`
  - `src/lib/stores/tags/tag-bookmark-operations.svelte.ts`
  - `src/lib/utils/user-id-helper.ts`
- 構文エラー:
  - `tests/infrastructure/backends/tauri/task-tauri-service.test.ts`
- Rust 警告:
  - `src-tauri/crates/flequit-infrastructure/src/infrastructure_repositories.rs`

## 改善計画

### Phase 1: 即時復旧（P0）

目的: CI を最短で通す状態に戻す。

実施内容:

1. `task-tauri-service.test.ts` の構文エラー修正。
2. `deleted` / `updatedBy` 必須化に合わせてテスト fixture を更新。
3. `bun check` が通るまで TypeScript エラーをゼロ化。
4. `bun run lint` の未使用 import / 変数を整理。

完了条件:

- `bun check` 成功
- `bun run lint` 成功
- `bun run test tests/infrastructure/backends/tauri/task-tauri-service.test.ts` 成功

### Phase 2: 規約整合（P1）

目的: レイヤ規約違反と設計上の負債を解消。

実施内容:

1. `src/lib/utils/user-id-helper.ts` から store 依存を排除。
2. 呼び出し側（domain/ui 層）で `userId` を受け渡す設計へ寄せる。
3. 依存方向が `AGENTS.md` のアーキテクチャ制約に一致することを確認。

完了条件:

- no-restricted-imports 違反ゼロ
- utils 層が純粋関数のみで構成される

### Phase 3: Rust 安全性改善（P1）

目的: 未定義動作リスクの排除。

実施内容:

1. `std::mem::zeroed::<DatabaseManager>()` を廃止。
2. テスト用ダミー初期化を `Option` / 明示的 builder / mock repository で置換。
3. `cargo check --quiet` で `invalid_value` 警告を解消。

完了条件:

- `cargo check --quiet` で当該警告が出ない
- `cargo test -j 4` 成功

### Phase 4: 回帰防止（P2）

目的: 同種問題の再発防止。

実施内容:

1. テスト用 entity factory を導入し、`deleted` / `updatedBy` を既定値で付与。
2. 主要 entity（Task/SubTask/Tag/ProjectTree）の factory を共通化。
3. Rust 側は最低限のユニットテストを追加してゼロ件状態を解消。

完了条件:

- ✅ 型変更時の修正箇所が factory 側へ集約される
- ✅ Rust ユニットテストが 1 件以上存在する

## 推奨実施順

1. Phase 1（CI 復旧）
2. Phase 2（規約整合）
3. Phase 3（Rust 安全性）
4. Phase 4（回帰防止）

## 備考

- Rust テストは現時点で `cargo test -j 4` が通過している。
- ただし警告とテスト密度の観点で、品質上の改善余地がある。
