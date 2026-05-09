# 開発コマンド一覧

正本は `package.json` (フロントエンド) と各 `Cargo.toml` (バックエンド)。本書は頻用コマンドのみ抜粋する。

## フロントエンド

| 用途             | コマンド                           |
| ---------------- | ---------------------------------- |
| 型チェック       | `bun check` (※ `bun run check` は不可) |
| Lint             | `bun run lint`                     |
| Lint (アーキ境界) | `bun run lint:arch`                |
| Format           | `bun run format`                   |
| 単体/結合テスト  | `bun run test [ファイル]` → `bun run test` |
| E2E テスト       | `bun run test:e2e [ファイル]` (個別ファイルのみ実行)|
| ビルド           | `bun run build`                    |
| 機械翻訳         | `bun run machine-translate`        |
| Tauri 開発モード | `bun run tauri:dev`                |

> 注意: `bun run dev` はユーザーが使用中のため使用禁止。

## バックエンド (Rust/Cargo)

| 用途         | コマンド                          |
| ------------ | --------------------------------- |
| 構文チェック | `cargo check --quiet`             |
| 警告チェック | `cargo check`                     |
| Lint         | `cargo clippy`                    |
| Format       | `cargo fmt --all -- --check`      |
| テスト       | `cargo test -j 4` (`-j 4` 必須)   |

## テスト事前準備

```bash
bun run test:prepare:automerge  # Automerge 用テストディレクトリ作成
bun run test:prepare:db         # SQLite テスト DB 準備
bun run test:prepare:db:force   # SQLite テスト DB を作り直す
bun run test:prepare            # 上記をまとめて実行
```

## 推奨実行順 (修正後の確認フロー)

詳細手順は `docs/ja/develop/rules/workflow.md` 参照。サマリ:

- **フロントエンド修正時**: `bun check` → `bun run lint` → 個別 `bun run test` → `bun run test`
- **バックエンド修正時**: `cargo check --quiet` → `cargo clippy` → 個別 `cargo test -j 4 <name>` → `cargo test -j 4`
- **両方修正時**: フロントエンド → バックエンドの順で実施
