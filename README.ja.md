# Flequit

[English](./README.md) | 日本語

Flequit は Tauri と SvelteKit で構築された、ローカルファーストのタスク管理デスクトップアプリです。
SQLite と Automerge を組み合わせることで、ローカルでの高速な操作性と将来的な同期拡張を見据えたデータモデルを両立しています。

## 主な機能

- プロジェクト・タスク・サブタスク管理
- タスクスケジュールにおける繰り返しルール対応
- SQLite + Automerge によるローカルファーストなデータ管理
- Tauri コマンド経由の型安全なフロントエンド/バックエンド連携
- 日本語・英語の i18n 対応

## 技術スタック

- フロントエンド: SvelteKit 2, Svelte 5 runes, Tailwind CSS 4, bits-ui, Inlang Paraglide
- バックエンド: Tauri 2 (Rust), Sea-ORM, SQLite, Automerge
- ツール: Bun, Vitest, Playwright, ESLint, Prettier

## セットアップ

### 前提条件

- Bun
- Rust toolchain (`rustup`, `cargo`)
- 利用 OS に対応した Tauri ビルド前提
  - 参照: <https://v2.tauri.app/start/prerequisites/>

### インストール

```bash
bun install
```

### 起動（デスクトップ開発）

```bash
bun run tauri:dev
```

## よく使うコマンド

```bash
# フロントエンド型チェック
bun check

# フロントエンド lint
bun run lint

# フロントエンドテスト
bun run test [file]
bun run test

# Rust チェック
cargo check --quiet

# Rust テスト
cargo test -j 4

# ビルド
bun run build
```

## ドキュメント

- [開発コマンド一覧](./docs/ja/develop/commands.md)
- [アーキテクチャ](./docs/ja/develop/design/architecture.md)
- [技術スタックと構成](./docs/ja/develop/design/tech-stack.md)
- [開発ルール](./docs/ja/develop/rules/)

## 補足

- 現在のデフォルト実行経路はデスクトップ向けのローカルファーストモードです。
- `src/lib/infrastructure/backends/web` には実験的な Web バックエンド経路がありますが、デフォルトでは無効です。

## ライセンス

MIT
