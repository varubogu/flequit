# 開発コマンド一覧

## 概要

このドキュメントは、現在このリポジトリで有効なコマンドのみを記載します。
正本は以下です。

- フロントエンド: `package.json` scripts
- バックエンド: `src-tauri/Cargo.toml` と各crateの `Cargo.toml`

## フロントエンド（Bun）

```bash
# 型チェック（コード変更後は必須）
bun check

# Lint
bun run lint

# アーキテクチャ境界Lint（src/libのみ）
bun run lint:arch

# Format
bun run format

# 単体/結合テスト（Vitest）
bun run test [ファイル]
bun run test
bun run test:watch
bun run test:ui

# E2Eテスト（Playwright: まず対象ファイルを実行）
bun run test:e2e [ファイル]
```

## バックエンド（Rust/Cargo）

```bash
# Rustチェック
cargo check --quiet
cargo check
cargo clippy
cargo fmt --all
cargo fmt --all -- --check

# テスト（常に -j 4 を付ける）
cargo test -j 4
cargo test -j 4 <test_name>
cargo test -j 4 --test <integration_name>
cargo test -j 4 -- --nocapture
```

## テスト事前準備ヘルパー

```bash
# Automerge用テストディレクトリ作成
bun run test:prepare:automerge

# SQLiteテストDB準備（migration_runnerを実行）
bun run test:prepare:db

# SQLiteテストDBを作り直す
bun run test:prepare:db:force

# 事前準備をまとめて実行
bun run test:prepare
```

## デスクトップアプリ（Tauri）

```bash
# Tauri開発モード
bun run tauri:dev

# Tauriコマンドのパススルー
bun run tauri
```

## ビルドとi18n

```bash
# フロントエンドビルド
bun run build

# ローカライズ向け機械翻訳
bun run machine-translate
```

## 推奨実行順

### フロントエンド修正時

1. `bun check`
2. `bun run lint`
3. `bun run test [ファイル]`
4. `bun run test`
5. `bun run test:e2e [ファイル]`（必要時）

### バックエンド修正時

1. `cargo check --quiet`
2. `cargo check`
3. `cargo clippy`
4. `cargo fmt --all -- --check`
5. `cargo test -j 4 <test_name>`
6. `cargo test -j 4`

### 両方修正時

フロントエンド確認を先に、次にバックエンド確認を実行します。
