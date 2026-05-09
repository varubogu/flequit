# 部分更新システム実装設計書

Flequit における **フィールド単位の部分更新システム** の設計。`partially` クレートを活用してデータ転送量を最適化し、型安全性を保つ。

> 実装の正本は `src-tauri/crates/flequit-model/`、`src-tauri/crates/flequit-core/services/`、`src/lib/services/domain/...-backend.ts` を参照。

## 1. 背景と要件

### 課題

- **データ転送効率**: 列の変更でも行全体のデータ転送が発生
- **パフォーマンス**: 不必要なデータ転送と DB 更新
- **保守性**: 列単位コマンドを個別作成すると膨大なコード量

### 要件

- 読み込み: 全データ / テーブル単位 / 行単位 / 列単位
- 書き込み: 全データ (初回のみ) / 行単位 (新規追加) / 列単位 (リアルタイム更新)
- 複数 Repository 実装 (SQLite / Automerge / 将来クラウド・Web)

## 2. 設計方針

1. **Patch / Delta Update パターン** の採用
2. **`partially` クレート** による自動生成
3. **既存システムとの併存** による段階的導入
4. **型安全性** の最大限活用

## 3. 技術選定

| アプローチ | データ転送量 | 実装コスト | 保守性 | 型安全性 | Automerge 親和性 |
| --- | --- | --- | --- | --- | --- |
| **Patch Update (`partially`)** ✓採用 | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| Field Specific Commands | ⭐⭐⭐ | ⭐ | ⭐ | ⭐⭐⭐ | ⭐⭐ |
| Generic Field Update | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐ | ⭐⭐ |
| 現状維持 | ⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |

### 採用理由 (`partially` クレート)

- 成熟した API + 豊富なドキュメント
- `apply_some()` による部分適用と変更検知
- フィールドレベルの詳細制御 (`#[partially(omit)]` 等)
- 自動生成による開発効率向上

## 4. 実装パターン

### 4.1 構造体定義

`models/...rs` で `#[derive(Partial)]` + `#[partially(derive(Debug, Clone, Serialize, Deserialize, Default))]` を付与する。`id` 等の更新対象外フィールドは `#[partially(omit)]` で除外。これにより `XxxPartial` 構造体が自動生成され、各フィールドが `Option<T>` または `Option<Option<T>>` でラップされる。

実装参照: `src-tauri/crates/flequit-model/src/models/task.rs` (該当ファイル)

### 4.2 各層の責務

| 層 | 役割 |
| --- | --- |
| **Command** | 汎用 `update_xxx_patch(id, patch)` コマンドと、利便性向上のための専用コマンド (`update_xxx_title(id, title)` 等) を提供。専用コマンドは内部で `XxxPartial { title: Some(...), ..Default::default() }` を構築 |
| **Facade** | Service の結果をそのまま返却。`ServiceError::ValidationError` のみメッセージを取り出す |
| **Service** | `repository.find_by_id(id)` → `apply_some(patch)` → 変更があれば `repository.save()` → `Ok(changed)` のフロー |
| **Repository** | パッチ適用後の完全な構造体を `save()` で保存 (現状)。将来 SQL `UPDATE` 最適化を検討 |

### 4.3 フロントエンド

- `TaskPatch` 等の型を TypeScript 側でも定義 (各フィールドが `?` オプショナル)
- 汎用関数 `updateTaskPatch(id, patch)` と専用関数 `updateTaskTitle(id, title)` を提供
- 変更検知ユーティリティ `createTaskPatch(original, current)` で差分のみを抽出してリクエスト

実装参照: `src/lib/services/domain/task/task-backend.ts`, `src/lib/utils/task-patch.ts`

## 5. 実装課題と対策

### バリデーション戦略

- フィールドレベルバリデーション
- 既存データとの組み合わせバリデーション
- Service 層でのビジネスルール適用

### パフォーマンス

- フロントエンドでのデバウンス
- バッチ更新の検討
- Repository 層での SQL 最適化

### Automerge 統合

- 部分更新は SQLite 側で効率実行
- Automerge 側は従来の `save()` で全体保存
- 同期時の自動整合性確保

## 6. 段階的導入計画

| Phase | 内容 |
| --- | --- |
| 1: 基盤 | `partially` クレート追加、`Task` への `Partial` derive、基本パッチ更新コマンド |
| 2: 機能拡張 | 頻用フィールド専用コマンド追加、フロントエンド変更検知、バリデーション強化 |
| 3: 最適化 | パフォーマンス測定・調整、Repository SQL 最適化、Automerge 同期効率化 |
| 4: 他エンティティ展開 | Project / Subtask / Tag 等へ適用、統一パターン確立 |

## 7. テスト戦略

| 種別 | 観点 |
| --- | --- |
| 単体 | パッチ適用ロジック、変更検知、バリデーション |
| 結合 | Command 層 → Repository 層、Automerge と SQLite の整合性 |
| E2E | フロントエンド → バックエンドの完全フロー、リアルタイム更新の動作 |

## 8. 実装チェックリスト

### Phase 1

- [ ] `partially` クレートを `Cargo.toml` に追加
- [ ] Task 構造体への `#[derive(Partial)]` 追加
- [ ] `update_task_patch` コマンド実装
- [ ] Facade 層のパッチ処理ロジック
- [ ] Service 層の `apply_some()` 統合
- [ ] フロントエンド `TaskPatch` 型定義

### Phase 2

- [ ] 頻用フィールドの専用コマンド追加
- [ ] フロントエンド変更検知ユーティリティ
- [ ] バリデーションルール強化
- [ ] エラーハンドリング改善

## 9. 効果

- **効率的なデータ更新**: 変更フィールドのみの転送 → ネットワーク負荷減
- **型安全性**: `partially` クレートと Rust 型システムによる安全な部分更新
- **保守性**: マクロ自動生成によるコード重複減
- **段階的導入**: 既存システムを残しつつ徐々に移行
