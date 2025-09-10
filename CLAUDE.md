# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## レスポンスについて

日本語で

## 設計ドキュメントについて

詳細な設計や仕様については、以下のdocsディレクトリ配下のドキュメントを参照してください：

### アーキテクチャ・設計
- `docs/develop/design/architecture.md` - 全体アーキテクチャ
- `docs/develop/design/data/` - データ関連設計
  - `data-structure.md` - データ構造仕様
  - `data-security.md` - セキュリティ設計
  - `tauri-automerge-repo-dataflow.md` - データフロー設計
  - `partial-update-implementation.md` - 部分更新システム実装詳細
- `docs/develop/design/frontend/` - フロントエンド設計
- `docs/develop/design/database/` - データベース設計

### 開発ルール
- 何かを修正を指示するように言われた場合、そのソースに関連する部分以外はすぐには修正せず、ユーザーに修正して良いか必ず許可を求めてください。
- `docs/develop/rules/` - 各種開発ルール（backend.md, frontend.md, testing.md等）
- 加えて、bunとcargoの両方で、ビルド時と全体テスト実行時はワーカー数を4に制限する（ユーザーの意図せぬ負荷を防ぐため）
  - cargo test -j 4
  - bun run test    # こちらは設定ファイルで設定済みなので意識しなくても良い

### 要件定義
- `docs/develop/requirements/` - 各種要件（performance.md, security.md, testing.md等）

### テスト
- `docs/develop/design/testing.md` - テスト戦略とガイドライン

必要に応じてこれらのドキュメントを参照し、最新の設計情報に基づいて作業を行ってください。

## アプリケーション概要

Tauri製のタスク管理デスクトップアプリケーション。プロジェクト管理や人とタスクのやり取りも可能。現在はローカル動作（SQLite）想定だが、将来的にはWeb同期、クラウドストレージ同期も対応予定。同期時に競合が起きないようにAutoMergeベースのデータ管理システムを採用する。

## 技術スタック

詳細は `docs/develop/design/tech-stack.md` を参照してください。

## プロジェクト構造

詳細は `docs/develop/design/tech-stack.md` を参照してください。

## Svelte 5 設計パターン

詳細は `docs/develop/design/frontend/svelte5-patterns.md` を参照してください。

## 国際化システム

詳細は `docs/develop/design/frontend/i18n-system.md` を参照してください。

## コーディング規約

詳細は `docs/develop/rules/coding-standards.md` を参照してください。

### Rust部分について

詳細は `docs/develop/design/backend-tauri/rust-guidelines.md` を参照してください。

### モジュールの関連性

詳細は `docs/develop/design/backend-tauri/rust-guidelines.md` の「アーキテクチャ構成」セクションを参照してください。

## 開発ワークフロー

詳細は `docs/develop/rules/workflow.md` を参照してください。

## コマンド一覧

詳細は `docs/develop/commands.md` を参照してください。
