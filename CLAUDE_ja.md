# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## レスポンスについて

- 日本語で回答すること。
- このファイルを読み込んだら最初に「✅️CLAUDE.mdを読み込みました」と発言してください。

## 設計ドキュメントについて

詳細な設計や仕様については、以下のdocsディレクトリ配下のドキュメントを参照してください：

### アーキテクチャ・設計
- `docs/en/develop/design/architecture.md` - 全体アーキテクチャ
- `docs/en/develop/design/data/` - データ関連設計
  - `data-model.md` - データ構造仕様
  - `data-security.md` - セキュリティ設計
  - `tauri-automerge-repo-dataflow.md` - データフロー設計
  - `partial-update-implementation.md` - 部分更新システム実装詳細
- `docs/en/develop/design/frontend/` - フロントエンド設計
- `docs/en/develop/design/database/` - データベース設計

### 開発ルール
- 何かを修正を指示するように言われた場合、そのソースに関連する部分以外はすぐには修正せず、ユーザーに修正して良いか必ず許可を求めてください。
- `docs/en/develop/rules/` - 各種開発ルール（backend.md, frontend.md, testing.md等）
- `docs/ja/develop/rules/documentation.md` - ドキュメント編集ルール
- 加えて、bunとcargoの両方で、ビルド時と全体テスト実行時はワーカー数を4に制限する（ユーザーの意図せぬ負荷を防ぐため）
  - cargo test -j 4
  - bun run test    # こちらは設定ファイルで設定済みなので意識しなくても良い
- フロントエンドの型チェックは`bun check`で行ってください（`bun run check`, `bun run typecheck`は使用しない）
- フロントエンドのlintは`bun run lint`で行ってください（`bun lint`, `bun run check`, `bun run typecheck`は使用しない）
- コマンドを実行してファイルやディレクトリが存在しないと言われた場合、カレントディレクトリを`pwd`で確認してください。

### 要件定義
- `docs/en/develop/requirements/` - 各種要件（performance.md, security.md, testing.md等）

### テスト
- `docs/en/develop/design/testing.md` - テスト戦略とガイドライン

必要に応じてこれらのドキュメントを参照し、最新の設計情報に基づいて作業を行ってください。
テストについて、まず単一ファイルを実行して、問題がないことを確認してから、全体を実行してください。
Webフロントエンドのテストの場合、`bun run test`コマンドで実行します（`bun test`ではない）
Tauriバックエンドのテストの場合、`cargo test -j 4`コマンドで実行します（必ずジョブ数を4に指定すること）

## アプリケーション概要

Tauri製のタスク管理デスクトップアプリケーション。プロジェクト管理や人とタスクのやり取りも可能。現在はローカル動作（SQLite）想定だが、将来的にはWeb同期、クラウドストレージ同期も対応予定。同期時に競合が起きないようにAutoMergeベースのデータ管理システムを採用する。

## 技術スタック

詳細は `docs/en/develop/design/tech-stack.md` を参照してください。

## プロジェクト構造

詳細は `docs/en/develop/design/tech-stack.md` を参照してください。

## Svelte 5 設計パターン

詳細は `docs/en/develop/design/frontend/svelte5-patterns.md` を参照してください。

## 国際化システム

詳細は `docs/en/develop/design/frontend/i18n-system.md` を参照してください。

## コーディング規約

詳細は `docs/en/develop/rules/coding-standards.md` を参照してください。

### Tauri⇔フロントエンド通信規約

**重要**: TauriはJavaScriptの`camelCase`パラメータをRustの`snake_case`に自動変換します。

- **JavaScript側**: `camelCase`で記述（例：`projectId`, `taskAssignment`, `partialSettings`）
- **Rust側**: `snake_case`で記述（例：`project_id`, `task_assignment`, `partial_settings`）
- **戻り値統一**: void返却コマンドは成功時`true`、失敗時`false`を返す
- **エラーハンドリング**: 統一されたパターンを使用

詳細は `docs/en/develop/rules/coding-standards.md` の「Tauri⇔フロントエンド通信規約」セクションを参照。

### Rust部分について

詳細は `docs/en/develop/design/backend-tauri/rust-guidelines.md` を参照してください。

### モジュールの関連性

詳細は `docs/en/develop/design/backend-tauri/rust-guidelines.md` の「アーキテクチャ構成」セクションを参照してください。

## 開発ワークフロー

詳細は `docs/en/develop/rules/workflow.md` を参照してください。

## コマンド一覧

詳細は `docs/en/develop/commands.md` を参照してください。
