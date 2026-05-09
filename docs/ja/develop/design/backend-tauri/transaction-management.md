# トランザクション管理設計書

Flequit のデータベーストランザクション管理の設計を定義する。Facade 層でトランザクションを一元管理し、データ整合性を保証する。

> 実装の正本は `src-tauri/crates/...` を参照。本書は責務分離・パターン・運用ルールのみを述べる。

## 1. 設計原則

### 責務分離

| 層 | トランザクションに対する責務 |
| --- | --- |
| **Facade** | トランザクション境界の制御 (`begin` / `commit` / `rollback`)、ビジネスフロー全体の調整 |
| **Service** | ビジネスロジックの実装。トランザクションオブジェクトを引数で受け取り、Repository へ渡す |
| **Repository** | データアクセスの実装。受け取ったトランザクションオブジェクトで操作する。**自分で commit / rollback はしない** |

### データ整合性

- 複数の Repository 操作は **単一トランザクション内で実行**
- ACID 特性の厳格な遵守 (SQLite)
- エラー発生時の確実なロールバック

## 2. アーキテクチャ

### レイヤーフロー

```
Commands → Facade ──┐
                    │ begin / commit / rollback
                    ↓
                  Service ──┐ ビジネスロジック
                           ↓
                        Repository ──┐ DB アクセス
                                    ↓
                                  Database
```

### 削除処理のシーケンス例

1. Commands が Facade を呼ぶ (`delete_tag(repositories, tx_manager, ...)`)
2. Facade が `tx_manager.begin()` でトランザクション開始
3. Service が複数 Repository (tag, task_tag, subtask_tag, tag_bookmark) を同一トランザクションで操作
4. 全成功 → Facade が `commit`
5. 失敗 → Facade が `rollback`

実装参照: `src-tauri/crates/flequit-core/src/facades/tag_facades.rs` の `delete_tag`

## 3. 主要コントラクト

### `TransactionManager` トレイト

`flequit-model/src/traits/transaction.rs`

- 関連型: `type Transaction: Send + Sync`
- メソッド: `async fn begin() -> Result<Self::Transaction, RepositoryError>`, `async fn commit(txn: Self::Transaction) -> Result<...>`, `async fn rollback(txn: Self::Transaction) -> Result<...>`

### SQLite 実装

`flequit-infrastructure-sqlite/src/infrastructure/database_manager.rs`

- `DatabaseManager` が `TransactionManager` を実装
- `Transaction = sea_orm::DatabaseTransaction`
- Sea-ORM の `TransactionTrait::begin()` をラップ

### `AppState`

`src-tauri/src/lib.rs`

- `repositories: Arc<InfrastructureRepositories>` と `transaction_manager: Arc<dyn TransactionManager<Transaction = DatabaseTransaction>>` を保持

## 4. データベース別の扱い

| DB | トランザクション | 特徴 |
| --- | --- | --- |
| **SQLite** | 必須 (`TransactionManager` で管理) | ACID 厳密 |
| **Automerge** | 不要 (個別操作) | CRDT による結果整合性 |

`UnifiedRepository` は内部で SQLite/Automerge の振り分けを行い、SQLite には接続トランザクションを渡し、Automerge は通常通り個別操作する。

## 5. エラーハンドリング

| 失敗箇所 | 対応 |
| --- | --- |
| トランザクション開始失敗 | Facade で format! → エラー返却 (DB 接続エラー / リソース不足) |
| ビジネスロジック失敗 | Facade で `rollback` → エラー返却 (バリデーション / 外部キー制約違反等) |
| コミット失敗 | エラー返却 (自動ロールバック) |
| ロールバック失敗 | **無視** (既にエラー状態のため)。ログには記録 |

## 6. トランザクション分離レベル

- SQLite デフォルト: **SERIALIZABLE** (最も厳格、ファントムリードなし)
- 将来的に `begin_with_isolation(level)` を追加可能 (`ReadCommitted` / `RepeatableRead` 等)

## 7. パフォーマンス

### トランザクション期間の最小化

- ✅ 検証・準備処理は **トランザクション外** で実施
- ✅ DB 操作のみをトランザクション内に
- ❌ 長時間処理 (ネットワーク呼び出し、複雑な前処理) をトランザクション内に入れない

### 読み取り専用操作

- 単純な `find_by_id` 等の読み取りは **トランザクション不要**

### バッチ操作

- 複数レコードの処理は **単一トランザクションでまとめる** (個別トランザクションを並べない)

## 8. テスト戦略

- **単体**: `mockall` で `TransactionManager` をモック化し、`begin → commit / rollback` の呼び出し回数と順序を検証
- **統合**: 実 DB を使い、削除前後のデータ整合性 (関連テーブルが正しくカスケード削除されること、ロールバック時はデータが残ること) を検証

実装参照: 各 facade の `tests` モジュール、`src-tauri/tests/integration/`

## 9. ベストプラクティス (要約)

### トランザクション制御

1. **Facade 層でのみ** トランザクション開始 (Service 以下では禁止 → ネストトランザクションを防ぐ)
2. 明示的な commit / rollback (自動 commit に依存しない)
3. トランザクション期間を最小化
4. 読み取り専用操作にトランザクションを使わない

### コードレビューチェックリスト

- [ ] トランザクション開始は Facade 層のみか?
- [ ] 成功時にコミット、失敗時にロールバックしているか?
- [ ] トランザクション期間は最小化されているか?
- [ ] 読み取り専用操作に不要なトランザクションを使っていないか?
- [ ] エラーハンドリング (begin / commit / rollback の各失敗) は適切か?
- [ ] テストケース (成功・失敗・ロールバック検証) は十分か?

## 10. 実装状況サマリ

| Phase | 内容 | 状態 |
| --- | --- | --- |
| 1 | 基盤 (`TransactionManager` トレイト + SQLite 実装 + `InfrastructureRepositories`) | ✅ |
| 2 | パイロット実装: タグ削除 (Repository + Facade) | ✅ |
| 3 | 削除処理拡張: タスク削除 (cascade)、プロジェクト削除 (包括的 cascade) | ✅ |
| 4 | Repository 層クリーンアップ (旧 `delete_with_relations()` 廃止、内部トランザクション処理を Repository から除去) | ✅ |
| - | 作成・更新系のトランザクション化 (タスク・サブタスク・プロジェクト・タスクリスト・繰り返しルール) | 予定 |

実装ファイル参照:

- TransactionManager: `src-tauri/crates/flequit-model/src/traits/transaction.rs`
- SQLite 実装: `src-tauri/crates/flequit-infrastructure-sqlite/src/infrastructure/database_manager.rs`
- パイロット (タグ削除): `src-tauri/crates/flequit-core/src/facades/tag_facades.rs`
- カスケード削除 (タスク): `src-tauri/crates/flequit-core/src/facades/task_facades.rs`
- カスケード削除 (プロジェクト): `src-tauri/crates/flequit-core/src/facades/project_facades.rs`

## 11. 新エンティティへの実装ガイドライン

1. Repository 層に `_with_txn` メソッドを追加 (引数に `&sea_orm::DatabaseTransaction` を受け取る)
2. Facade 層で `begin → service 呼び出し → 成功時 commit / 失敗時 rollback` のパターンを実装
3. 既存メソッドは非推奨マーク付与のうえ段階的に移行 (後方互換性を維持)

## 12. 参考

- Sea-ORM Transaction: <https://www.sea-ql.org/SeaORM/docs/advanced-query/transaction/>
- SQLite Transaction: <https://www.sqlite.org/lang_transaction.html>
