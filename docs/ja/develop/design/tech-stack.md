# 技術スタック・プロジェクト構造

## 技術スタック

### フロントエンド

- **フレームワーク**: SvelteKit 2（Svelte 5 runes）
- **アダプター**: `@sveltejs/adapter-static`（Tauri向けSSG）
- **UI**: bits-ui ベースのコンポーネント
- **スタイル**: Tailwind CSS v4
- **i18n**: Inlang Paraglide
- **パッケージマネージャ**: Bun
- **型チェック**: `bun check`
- **Lint**: `bun run lint`
- **テスト**: `bun run test`, `bun run test:e2e [file]`

### バックエンド / デスクトップ

- **フレームワーク**: Tauri 2
- **言語**: Rust
- **データベース**: SQLite（local-first）
- **CRDT**: Automerge
- **パッケージマネージャ**: Cargo
- **型チェック**: `cargo check --quiet`
- **Lint**: `cargo clippy`
- **テスト**: `cargo test -j 4`

## Rustクレート構成

`src-tauri/crates` 配下の現行workspaceクレート:

- `flequit-types`
- `flequit-model`
- `flequit-repository`
- `flequit-core`
- `flequit-infrastructure`
- `flequit-infrastructure-sqlite`
- `flequit-infrastructure-automerge`
- `flequit-settings`
- `flequit-testing`

依存方向ルール:

`flequit-types -> flequit-model -> flequit-repository -> flequit-core -> flequit-infrastructure-* -> src-tauri/src/commands`

## プロジェクト構造

```text
(root)
├── src/                             # SvelteKitフロントエンド
│   └── lib/
│       ├── components/              # UIコンポーネント
│       ├── services/                # domain/composite/uiサービス
│       ├── stores/                  # 状態のみ
│       ├── infrastructure/backends/ # tauri/webバックエンドアダプタ
│       └── types/
├── src-tauri/                       # Tauri/Rust workspace
│   ├── src/commands/                # Tauriコマンド
│   └── crates/                      # 上記Rustクレート
├── tests/                           # Vitest単体/結合テスト
├── e2e/                             # Playwrightテスト
└── docs/                            # プロジェクトドキュメント
```

## Webバックエンドの状態

`src/lib/infrastructure/backends/web` は実験中で、既定では無効です。
実験時のみ `PUBLIC_ENABLE_EXPERIMENTAL_WEB_BACKEND=true` で有効化してください。
