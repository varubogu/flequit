# 開発コマンド一覧

## 概要

Flequitプロジェクトの開発で使用するコマンド一覧です。フロントエンド（SvelteKit）とバックエンド（Tauri/Rust）の各種開発作業に必要なコマンドを目的別に整理しています。

## 開発・ビルド

### TypeScript/SvelteKit

```bash
# 型チェック（コード変更後必須実行）
bun check

# プロジェクトビルド（Paraglide翻訳ファイル含む）
bun run build

# Tauriデスクトップアプリ開発モード
bun run tauri:dev
```

### Rust/Tauri

```bash
# エラーがないかチェック（警告は一旦除く）
cargo check --quiet

# 警告がないかチェック
cargo check

# リンター実行
cargo clippy

# フォーマッター実行
cargo fmt --all
```

### プロジェクト全体

```bash
# 全体ビルド（フロントエンド + バックエンド）
bun run build && cargo build

# リリースビルド
bun run build && cargo build --release
```

## テスト

### フロントエンド（Vitest）

```bash
# 全テスト実行
bun run test

# 個別ファイルテスト
bun run test [ファイル名]

# ウォッチモード（開発時）
bun run test:watch

# テストカバレッジ
bun run test:coverage
```

### E2Eテスト（Playwright）

```bash
# 個別E2Eテストファイル実行（ヘッドレス）
bun run test:e2e [ファイル名]

# E2Eテスト（ブラウザ表示）
bun run test:e2e:headed [ファイル名]

# 注意: 全体実行は禁止（個別ファイル実行のみ）
```

### バックエンド（Cargo）

```bash
# 全テスト実行
cargo test

# 個別テストファイル実行
cargo test [テストファイル名]

# 個別テスト関数実行
cargo test [関数名]

# テストを詳細表示で実行
cargo test -- --nocapture

# 並行実行を無効化（データベーステスト時）
cargo test -- --test-threads=1
```

### 結合テスト

```bash
# バックエンド結合テスト
cargo test --test integration

# フロントエンド結合テスト
bun run test tests/integration/

# E2E結合テスト（個別ファイルのみ）
bun run test:e2e tests/e2e/integration/
```

## リンター・フォーマッター

### TypeScript/SvelteKit

```bash
# ESLintによるリンター実行
bun run lint

# ESLintによる自動修正
bun run lint:fix

# Prettierによるフォーマット
bun run format

# Prettierによるフォーマットチェック
bun run format:check
```

### Rust

```bash
# Clippyリンター実行
cargo clippy

# Clippy厳格モード
cargo clippy -- -D warnings

# Rustfmtフォーマッター実行
cargo fmt --all

# フォーマットチェック
cargo fmt --all -- --check
```

## 国際化（i18n）

```bash
# Inlang機械翻訳実行（ビルドに含まれる）
bun run build

# 翻訳ファイル検証
bun run i18n:validate

# 翻訳ファイル生成のみ
bun run i18n:generate

# 翻訳状況確認
bun run i18n:status
```

## データベース・マイグレーション

### SQLite

```bash
# マイグレーション実行
cargo run --bin migrate

# マイグレーション作成
cargo run --bin create-migration [migration_name]

# マイグレーション状態確認
cargo run --bin migration-status

# テスト用データベースセットアップ
cargo run --bin setup-test-db
```

### Automerge

```bash
# Automergeドキュメント検証
cargo run --bin verify-automerge

# Automergeドキュメント修復
cargo run --bin repair-automerge

# 同期状況確認
cargo run --bin sync-status
```

## デバッグ・プロファイリング

### フロントエンド

```bash
# デバッグモードでの開発サーバー起動（使用禁止 - ユーザーが使用中）
# bun run dev

# Bundle分析
bun run analyze

# パフォーマンス分析
bun run perf:analyze
```

### バックエンド

```bash
# デバッグビルド
cargo build

# リリースビルドでのプロファイリング
cargo build --release
RUST_LOG=debug cargo run --release

# メモリ使用量分析
cargo run --release --features memory-profiling

# パフォーマンステスト
cargo bench
```

## CI/CD・デプロイ

### ローカル検証

```bash
# CI環境と同等のチェック実行
./scripts/ci-check.sh

# 全ての品質チェック実行
bun check && bun run lint && cargo check && cargo clippy && cargo fmt --all -- --check
```

### ビルド検証

```bash
# 本番ビルドテスト
bun run build:production

# マルチプラットフォームビルド（ローカル）
cargo build --target x86_64-pc-windows-msvc
cargo build --target x86_64-apple-darwin
cargo build --target x86_64-unknown-linux-gnu
```

## 開発支援ツール

### コード生成

```bash
# 新しいコンポーネントの雛形作成
bun run generate:component [component-name]

# 新しいサービスクラス作成
bun run generate:service [service-name]

# Rustモデル生成
cargo run --bin generate-model [model-name]
```

### ドキュメント生成

```bash
# TypeDoc生成
bun run docs:generate

# Rust Doc生成
cargo doc --open

# API仕様書生成
bun run api:docs
```

## トラブルシューティング

### 依存関係

```bash
# Node modules再インストール
rm -rf node_modules && bun install

# Cargo キャッシュクリア
cargo clean

# 全依存関係の再インストール
rm -rf node_modules target && bun install && cargo build
```

### データベース

```bash
# テストデータベースリセット
cargo run --bin reset-test-db

# 開発用データベースリセット
cargo run --bin reset-dev-db

# データベース整合性チェック
cargo run --bin verify-db-integrity
```

## 制約・注意事項

### 実行制限

- **開発サーバー**: `bun run dev`は使用禁止（ユーザーが使用中）
- **E2Eテスト**: 全体実行禁止、個別ファイル実行のみ
- **テストタイムアウト**: ファイル内テスト件数 × 1分

### パフォーマンス考慮

- 並行テスト実行時は`--test-threads`で制御
- 大量データテスト時はタイムアウト調整
- メモリ使用量に注意してバッチサイズ調整

### セキュリティ

- 本番データでの開発・テスト禁止
- APIキー等の機密情報は環境変数使用
- コミット前に機密情報の混入をチェック

## 推奨ワークフロー

### フロントエンド開発時

1. `bun check` - 型チェック
2. `bun run lint` - リンター
3. `bun run test [単体テストファイル]` - 単体テスト
4. `bun run test [結合テストファイル]` - 結合テスト
5. `bun run test` - 全テスト
6. `bun run test:e2e [E2Eテストファイル]` - E2Eテスト

### バックエンド開発時

1. `cargo check --quiet` - エラーチェック
2. `cargo check` - 警告チェック
3. `cargo clippy` - リンター
4. `cargo fmt --all` - フォーマッター
5. `cargo test [単体テストファイル]` - 単体テスト
6. `cargo test [結合テストファイル]` - 結合テスト
7. `cargo test` - 全テスト

### 両方修正時

フロントエンド → バックエンドの順番で推奨手順を実施