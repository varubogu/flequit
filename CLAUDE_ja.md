# CLAUDE_ja.md

このリポジトリで作業する Claude Code 向けガイドの日本語版。
Claude が読み込む正本は英語の `CLAUDE.md`。本ファイルは人間の参照用で、編集時は英語版と同期させる。

## 応答ルール

- 必ず**日本語**で回答する。
- このファイルを読み込んだ最初に `✅️ CLAUDE.md loaded` と出力してから指示に従う。

## プロジェクト

Tauri 製のデスクトップタスク管理アプリ。
Frontend: SvelteKit 2 + Svelte 5 (runes) + Tailwind 4 + bits-ui + Inlang Paraglide。
Backend: Tauri 2 (Rust) + Sea-ORM + SQLite + Automerge (CRDT)。
Clean Architecture（クレート分離）+ Specta による Rust→TS 型生成。

- パッケージマネージャは **Bun**（npm / yarn / pnpm 不可）。

## 重要ルール

- 指示外のコードを勝手に変更しない。必要なら先にユーザーへ確認する。
- regex 等での一括置換は適用前に必ず差分を確認する。
- 「ファイル/ディレクトリが無い」系エラー時はまず `pwd` を確認する。

## ポインタ

- 設計 / 規約 / 要件 / コマンド: `docs/ja/develop/{design,rules,requirements,commands.md}`
- `docs/ja/` を信頼源とし、`docs/en/` の同期は別タスク。
- タスク固有のガイドは関連スキル（testing / tauri-command / architecture-review / i18n / documentation / coding-standards / debugging）が自動発火するので、CLAUDE.md / CLAUDE_ja.md にスキル側の内容を重複記載しない。
