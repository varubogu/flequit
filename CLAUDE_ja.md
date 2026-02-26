# CLAUDE.md

このファイルは、Claude Code (claude.ai/code) がこのリポジトリのコードを扱う際のガイダンスを提供します。

## レスポンスについて

- 常に**日本語**で回答してください。
- このファイルを読み込んだら、最初に「✅️ CLAUDE.md loaded」と発言してから、指示に従ってください。

## アプリケーション概要

**Tauri ベースのデスクトップタスク管理アプリケーション**。プロジェクト管理とタスクコラボレーションをサポートします。

**技術スタック**:

- フロントエンド: SvelteKit (SSG) + Svelte 5 + Inlang Paraglide
- バックエンド: Tauri (Rust) + SQLite + Automerge
- アーキテクチャ: クリーンアーキテクチャ（Crate 分離）

## 重要な開発ルール

- 何かを修正するように指示された場合、そのソースに関連する部分以外はすぐには修正せず、ユーザーに修正して良いか**必ず許可を求めてください**。
- 正規表現などによる置換を行う場合、**必ず一度検証**を行って余計な影響が出ないことを確認してから置換を行ってください。
- コマンドを実行してファイルやディレクトリが存在しないと言われた場合、カレントディレクトリを `pwd` で確認してください。

## ドキュメント & スキル

Claude Code には、よくあるタスクに対応する専門的な**スキル**があります。これらのスキルが詳細なガイダンスを提供します：

- **`.claude/skills/frontend-testing/`** - フロントエンドテスト（Vitest、Svelte 5）
- **`.claude/skills/backend-testing/`** - バックエンドテスト（Rust、cargo）
- **`.claude/skills/tauri-command/`** - Tauri コマンド実装
- **`.claude/skills/architecture-review/`** - アーキテクチャ準拠チェック
- **`.claude/skills/debugging/`** - デバッグ支援
- **`.claude/skills/i18n/`** - 国際化対応（Inlang Paraglide）
- **`.claude/skills/documentation/`** - ドキュメント編集（日英両方）
- **`.claude/skills/coding-standards/`** - コーディング標準チェック

詳細な設計と仕様については、`docs` ディレクトリのドキュメントを参照してください：

- **アーキテクチャ & 設計**: `docs/en/develop/design/`
  - `architecture.md` - 全体アーキテクチャ
  - `tech-stack.md` - 技術スタックとプロジェクト構造
  - `frontend/` - フロントエンド設計（Svelte 5、i18n、レイヤーなど）
  - `backend-tauri/` - バックエンド設計（Rust ガイドライン、トランザクションなど）
  - `data/` - データ設計（モデル、セキュリティ、Automerge など）

- **開発ルール**: `docs/en/develop/rules/`
  - `coding-standards.md` - コーディング標準
  - `frontend.md` - フロントエンドルール
  - `backend.md` - バックエンドルール
  - `testing.md` - テストルール
  - `documentation.md` - ドキュメント編集ルール（**日英両方の更新が必須**）

- **要件定義**: `docs/en/develop/requirements/`
  - `performance.md`、`security.md`、`testing.md` など

必要に応じてこれらのドキュメントとスキルを参照してください。スキルはタスクに基づいて自動的に起動されます。
