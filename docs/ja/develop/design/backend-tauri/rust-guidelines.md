# Rust 設計ガイドライン

Flequit の Tauri (Rust) 部分における設計指針。クリーンアーキテクチャ + 適切なエラーハンドリング + パフォーマンスの最適化を重視する。

> コード例の正本は `src-tauri/crates/...` を参照。本書はパターンの「形」と原則のみを述べる。

## アーキテクチャ構成

### クリーンアーキテクチャ (クレート分割)

```
メインクレート (flequit / src-tauri/src)
└── アプリケーション層 (commands)
        ↓
flequit-infrastructure (統合インフラ Facade)
        ↓
flequit-infrastructure-sqlite / flequit-infrastructure-automerge (永続化実装)
        ↓
flequit-core (ドメインロジック: facade / service)
        ↓
flequit-repository (Repository trait)
        ↓
flequit-model
        ↓
flequit-types
```

### クレート間アクセス制御

| クレート | 依存可能先 |
| --- | --- |
| `flequit` (メイン) | `flequit-infrastructure` (必要に応じ types) |
| `flequit-infrastructure-*` | `flequit-core`, `flequit-repository`, `flequit-model`, `flequit-types` |
| `flequit-core` | `flequit-repository`, `flequit-model`, `flequit-types` |
| `flequit-repository` | `flequit-model`, `flequit-types` |
| `flequit-model` | `flequit-types` |

### 各クレート内部のアクセス制御

- **commands**: インフラ Facade / サービス経由のみ。DB アダプタへの直接アクセス禁止。
- **flequit-core / facade**: `service` のみ呼び出し可。`facade` 同士・`commands` 直呼び・repositories 直呼び禁止。
- **flequit-core / service**: repository の trait/契約参照のみ。`commands` や インフラ具体実装への依存禁止。
- **インフラ系アダプタ (sqlite/automerge)**: 永続化実装の責務のみ。ドメインルールを実装しない。
- **統合インフラ Facade**: 複数インフラ実装の合成のみ。UI / command 責務を持たない。

## Option 値の処理パターン

- 単一 Option: `if let Some(x) = ...` で取り出す
- 複数 Option: ネストを避けるため一時変数に格納し、最後に `match` でまとめて検証する
- 複雑な変換: `Option::and_then` / `Option::filter` / `Option::map` のチェーンを活用

実装参照:
- `src-tauri/crates/flequit-core/src/services/task_service.rs` - 単一 Option パターン
- `src-tauri/crates/flequit-core/src/services/task_assignment_service.rs` - 複数 Option パターン
- `src-tauri/crates/flequit-core/src/facades/task_facade.rs` - チェーン処理

## エラーハンドリング

### 階層化されたエラー型

各層に独自のエラー型を定義し、`thiserror::Error` を派生する。

| 層 | エラー型 | 役割 |
| --- | --- | --- |
| Domain (service/facade) | `ServiceError` | NotFound / Validation / BusinessRule / Repository (`#[from]`) / ExternalService |
| Repository | `RepositoryError` | Database (`#[from] sqlx::Error`) / Automerge / Serialization (`#[from] serde_json::Error`) / Io (`#[from] std::io::Error`) |
| Command (Tauri) | `CommandError` | InvalidInput / Service (`#[from] ServiceError`) / Serialization |

実装参照: `src-tauri/crates/flequit-core/src/errors/`, `src-tauri/crates/flequit-repository/src/errors/`, `src-tauri/src/errors/`

### コンテキスト付きエラー

長い処理チェーンでは `anyhow::Context` の `.context(...)` / `.with_context(|| ...)` でエラーに文脈を付与する。Result 型の `?` で伝播させる。

実装参照: `src-tauri/crates/flequit-core/src/services/sync_service.rs`

## モジュール設計パターン

### Repository パターン

- Repository は `flequit-repository` で `#[async_trait]` トレイトとして定義
- 実装は `flequit-infrastructure-sqlite` / `flequit-infrastructure-automerge` で別々に提供
- Service は trait に依存し、実装には依存しない (依存性逆転)

実装参照:
- Trait: `src-tauri/crates/flequit-repository/src/repositories/task_repository.rs`
- SQLite 実装: `src-tauri/crates/flequit-infrastructure-sqlite/src/repositories/task_repository.rs`
- Automerge 実装: `src-tauri/crates/flequit-infrastructure-automerge/src/repositories/task_repository.rs`

### Service 層

- Service は依存リポジトリを `Arc<dyn Trait>` で受け取る
- 処理パターン: 1) リソース存在確認 → 2) ビジネスルール検証 → 3) 更新 → 4) 永続化 → 5) 副作用 (通知等)
- 副作用 (通知等) の失敗は警告ログのみで継続するか、ロールバックするかをケースごとに判断

実装参照: `src-tauri/crates/flequit-core/src/services/task_service.rs` の `assign_task`

## パフォーマンス最適化

### データベースアクセス

- **N+1 を避ける**: 関連データはバッチ取得 / `JOIN` で 1 クエリ化
- **インデックス活用**: クエリで使うカラムに対する複合インデックスを設計時に検討
- **トランザクション**: 複数書き込みは 1 トランザクションでまとめる

詳細は `transaction-management.md` を参照。

### 並行処理

- I/O 並列化: `tokio::join!` または `try_join!` で複数の独立 I/O を並行実行
- CPU 集約処理: `tokio::task::spawn_blocking` でブロッキングタスクを別スレッドへ

## 命名・スタイル

- 関数・変数・モジュール: `snake_case`
- 型・enum: `PascalCase`
- 定数: `SCREAMING_SNAKE_CASE`
- ファイル: `snake_case.rs`
- Lint: `cargo clippy` 警告ゼロを維持
- Format: `cargo fmt --all`

## ロギング

- フレームワーク: `tracing` (`tracing::info!` / `warn!` / `error!`)
- Tauri command には `#[tracing::instrument]` を必須付与 (`level = "info"`、`skip(...)` で大きい引数を除外、`fields(...)` で重要 ID を抽出)
- `log::` クレートは使用しない

## Tauri command 規約

- パターン: `#[instrument]` + `#[tauri::command]` の二重属性
- State 取得: `state.repositories.read().await` (直接 `&state.repositories` は使わない)
- CommandModel → ドメインモデル変換: `model.to_model().await?`
- Error は `String` で返却 (`Result<T, String>`)

詳細は `.claude/skills/tauri-command/SKILL.md` を参照。

## 関連ドキュメント

- `transaction-management.md` - トランザクション管理
- `../../rules/coding-standards.md` - 言語横断のコーディング規約
- `../../rules/backend.md` - バックエンドルール (アクセス制御の早見表)
