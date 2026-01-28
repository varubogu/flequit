# モノレポ化移行計画書

**作成日**: 2025-12-28
**対象プロジェクト**: flequit
**移行方針**: Option 2 - 簡易モノレポ化

## 📋 目次

1. [移行の目的](#移行の目的)
2. [現在の構成](#現在の構成)
3. [移行後の構成](#移行後の構成)
4. [Crate依存関係](#crate依存関係)
5. [移行手順](#移行手順)
6. [RustRover操作ガイド](#rustrover操作ガイド)
7. [変更が必要なファイル一覧](#変更が必要なファイル一覧)
8. [検証手順](#検証手順)

---

## 移行の目的

### 背景
- 新規にWebバックエンド（Rust Webフレームワーク）を追加予定
- 既存のcrateを流用したい
- TauriデスクトップアプリとWebバックエンドで共通コードを共有

### 期待される効果
1. ✅ デスクトップアプリとWebバックエンドの明確な分離
2. ✅ 共有crateの一元管理
3. ✅ ビルド・デプロイの独立性確保
4. ✅ 将来的な拡張性の向上（モバイルアプリ、CLIツール等）

---

## 現在の構成

```
flequit/
├── package.json                    # SvelteKit frontend
├── src/                           # SvelteKit sources
├── tests/                         # Frontend tests
├── src-tauri/                     # Tauri app
│   ├── Cargo.toml                # Workspace root
│   ├── src/                      # Tauri app sources
│   └── crates/                   # Shared crates
│       ├── flequit-types/
│       ├── flequit-model/
│       ├── flequit-repository/
│       ├── flequit-infrastructure-sqlite/
│       ├── flequit-infrastructure-automerge/
│       ├── flequit-infrastructure/
│       ├── flequit-core/
│       ├── flequit-settings/
│       └── flequit-testing/
├── docs/
├── .vscode/
├── .claude/
└── plans/
```

### 現在のworkspace構成（src-tauri/Cargo.toml）

```toml
[workspace]
members = [
    "crates/flequit-core",
    "crates/flequit-model",
    "crates/flequit-repository",
    "crates/flequit-infrastructure-sqlite",
    "crates/flequit-infrastructure-automerge",
    "crates/flequit-settings",
    "crates/flequit-testing",
    "crates/flequit-types",
    "crates/flequit-infrastructure",
    "."
]
```

---

## 移行後の構成

```
flequit/                           # モノレポルート
├── Cargo.toml                     # ルートworkspace定義 ⭐新規
├── .gitignore                     # 更新
├── README.md                      # 更新
│
├── desktop/                       # Tauriデスクトップアプリ ⭐移動
│   ├── package.json              # 既存のpackage.json
│   ├── src/                      # 既存のsrc/
│   ├── tests/                    # 既存のtests/
│   ├── static/                   # 既存のstatic/
│   ├── src-tauri/                # 既存のsrc-tauri/（cratesを除く）
│   │   ├── Cargo.toml           # プロジェクト固有設定に変更 ⭐更新
│   │   ├── src/
│   │   ├── icons/
│   │   └── tauri.conf.json      # frontendDistパス更新 ⭐更新
│   ├── svelte.config.js
│   ├── vite.config.js
│   ├── tsconfig.json
│   ├── vitest.config.ts
│   ├── playwright.config.ts
│   ├── eslint.config.ts
│   └── tailwind.config.js
│
├── web-backend/                   # Webバックエンド ⭐新規
│   ├── Cargo.toml                # Webアプリ用設定 ⭐新規
│   ├── src/
│   │   └── main.rs               # Webサーバーエントリポイント ⭐新規
│   └── README.md                 # ⭐新規
│
├── crates/                        # 共有crateディレクトリ ⭐移動
│   ├── flequit-types/
│   ├── flequit-model/
│   ├── flequit-repository/
│   ├── flequit-infrastructure-sqlite/
│   ├── flequit-infrastructure-automerge/
│   ├── flequit-infrastructure/
│   ├── flequit-core/
│   ├── flequit-settings/
│   └── flequit-testing/
│
├── docs/                          # ドキュメント（既存位置）
│   ├── en/
│   └── ja/
│
├── .vscode/                       # VSCode設定（既存位置）
│   └── settings.json             # rust-analyzer設定更新 ⭐更新
│
├── .claude/                       # Claude Code設定（既存位置）
│
└── plans/                         # 計画書（既存位置）
```

---

## Crate依存関係

### 依存関係グラフ

```
Level 0 (依存なし):
  └─ flequit-types

Level 1:
  └─ flequit-model → flequit-types
  └─ flequit-settings (独立)
  └─ flequit-testing (独立、テスト用)

Level 2:
  └─ flequit-repository → flequit-types, flequit-model

Level 3:
  └─ flequit-infrastructure-sqlite → flequit-types, flequit-model, flequit-repository
  └─ flequit-infrastructure-automerge → flequit-types, flequit-model, flequit-repository

Level 4:
  └─ flequit-infrastructure → すべてのinfrastructure crate

Level 5:
  └─ flequit-core → flequit-types, flequit-model, flequit-repository, flequit-infrastructure
```

### Webバックエンドでの利用想定
Webバックエンドは以下のcrateを利用する想定:
- ✅ flequit-types
- ✅ flequit-model
- ✅ flequit-repository
- ✅ flequit-infrastructure (または個別のinfrastructure crate)
- ✅ flequit-core

---

## 移行手順

### フェーズ1: 準備と構造作成

#### 1-1. バックアップ作成
```bash
# Gitで現在の状態をコミット
git add -A
git commit -m "chore: モノレポ化前のバックアップ"

# または別ブランチを作成
git checkout -b monorepo-migration
```

#### 1-2. ルートディレクトリの準備
```bash
# ルートディレクトリに移動
cd /home/toyosuke/Projects/repo/github.com/varubogu/flequit
```

#### 1-3. 新規ディレクトリ作成
```bash
# desktopディレクトリを作成
mkdir desktop

# web-backendディレクトリを作成
mkdir web-backend

# cratesディレクトリを作成（ルート直下）
mkdir crates
```

### フェーズ2: RustRoverを使用した移動作業

> **⚠️ 重要**: 以下の手順はRustRoverのリファクタリング機能を使用します。
> 手動でのファイル移動は避けてください。

#### 2-1. Crateの移動（RustRover推奨）

**RustRoverでの操作手順**:

1. **プロジェクトをRustRoverで開く**
   - `/home/toyosuke/Projects/repo/github.com/varubogu/flequit/src-tauri` を開く

2. **各crateを移動**
   - `src-tauri/crates/` 内の各crateフォルダを選択
   - 右クリック → `Refactor` → `Move...` を選択
   - 移動先: `/home/toyosuke/Projects/repo/github.com/varubogu/flequit/crates/`
   - RustRoverが自動的にCargo.tomlのパス参照を更新

   **移動対象のcrate**:
   - `flequit-types`
   - `flequit-model`
   - `flequit-repository`
   - `flequit-infrastructure-sqlite`
   - `flequit-infrastructure-automerge`
   - `flequit-infrastructure`
   - `flequit-core`
   - `flequit-settings`
   - `flequit-testing`

> **注意**: RustRoverのMove機能は、依存関係のパスを自動的に更新しますが、
> 必ず移動後に各Cargo.tomlを確認してください。

#### 2-2. フロントエンド・Tauriファイルの移動

**⚠️ この作業は手動で行う必要があります（フロントエンドファイルのため）**

```bash
# ルートディレクトリで実行
# フロントエンド関連ファイルをdesktop/に移動
mv src desktop/
mv static desktop/
mv tests desktop/
mv package.json desktop/
mv bun.lock desktop/
mv svelte.config.js desktop/
mv vite.config.js desktop/
mv tsconfig.json desktop/
mv vitest.config.ts desktop/
mv playwright.config.ts desktop/
mv eslint.config.ts desktop/
mv tailwind.config.js desktop/
mv .prettierrc.ts desktop/
mv .prettierignore desktop/
mv components.json desktop/
mv app.d.ts desktop/
mv project.inlang desktop/
mv messages desktop/

# Tauriアプリをdesktop/に移動
mv src-tauri desktop/

# e2eテストもdesktop/に移動
mv e2e desktop/
mv playwright-report desktop/
mv test-results desktop/
```

### フェーズ3: 設定ファイルの作成・更新

#### 3-1. ルートCargo.tomlの作成

**ファイル**: `/home/toyosuke/Projects/repo/github.com/varubogu/flequit/Cargo.toml`

```toml
[workspace]
resolver = "2"
members = [
    "desktop/src-tauri",
    "web-backend",
    "crates/flequit-types",
    "crates/flequit-model",
    "crates/flequit-repository",
    "crates/flequit-infrastructure-sqlite",
    "crates/flequit-infrastructure-automerge",
    "crates/flequit-infrastructure",
    "crates/flequit-core",
    "crates/flequit-settings",
    "crates/flequit-testing",
]

[workspace.package]
version = "0.1.0"
edition = "2021"

# 共通の依存関係バージョン管理
[workspace.dependencies]
# Internal crates
flequit-types = { path = "crates/flequit-types" }
flequit-model = { path = "crates/flequit-model" }
flequit-repository = { path = "crates/flequit-repository" }
flequit-infrastructure-sqlite = { path = "crates/flequit-infrastructure-sqlite" }
flequit-infrastructure-automerge = { path = "crates/flequit-infrastructure-automerge" }
flequit-infrastructure = { path = "crates/flequit-infrastructure" }
flequit-core = { path = "crates/flequit-core" }
flequit-settings = { path = "crates/flequit-settings" }
flequit-testing = { path = "crates/flequit-testing" }

# External dependencies (共通バージョン)
tokio = { version = "1.47.1", features = ["full"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0.143"
async-trait = "0.1.89"
chrono = { version = "0.4.41", features = ["serde"] }
uuid = { version = "1.18.0", features = ["v4", "serde"] }
sea-orm = { version = "1.1.14", features = ["sqlx-sqlite", "runtime-tokio-rustls"] }
thiserror = "2.0.16"
tracing = "0.1.41"
log = "0.4"

[profile.dev]
incremental = true

[profile.release]
codegen-units = 1
lto = true
opt-level = "s"
panic = "abort"
strip = true
```

#### 3-2. desktop/src-tauri/Cargo.tomlの更新

**変更箇所**:

1. **workspace定義を削除**（ルートで管理するため）
2. **パス参照を更新**

```toml
[package]
name = "flequit"
version = "0.1.0"
description = "A Tauri App"
authors = ["you"]
edition = "2021"
default-run = "flequit"

[lib]
name = "flequit_lib"
crate-type = ["staticlib", "cdylib", "rlib"]

# workspace定義は削除（ルートで管理）

[build-dependencies]
tauri-build = { version = "2.4.0", features = [] }

[dependencies]
# Internal crates - パスをルートからの相対パスに変更
flequit-model = { path = "../../crates/flequit-model" }
flequit-core = { path = "../../crates/flequit-core" }
flequit-infrastructure = { path = "../../crates/flequit-infrastructure" }
flequit-settings = { path = "../../crates/flequit-settings" }

# Tauri framework
tauri = { version = "2.8.4", features = [] }
tauri-plugin-opener = "2.5.0"

# Serialization (for commands)
serde = { version = "1", features = ["derive"] }
serde_json = "1.0.143"

# Async runtime
tokio = { version = "1.47.1", features = ["full"] }
futures = "0.3.31"

# Utilities
dirs = "6.0.0"

# Error handling
thiserror = "2.0.16"

# Logging
log = "0.4"
env_logger = "0.11.8"
tracing = "0.1.41"
tracing-subscriber = { version = "0.3.20", features = ["env-filter", "fmt", "time", "chrono"] }
tracing-appender = "0.2.3"
chrono = { version = "0.4", features = ["serde"] }
uuid = { version = "1.18", features = ["serde", "v4"] }
async-trait = "0.1"
specta = { version = "=2.0.0-rc.22", features = ["uuid"] }
tauri-specta = { version = "=2.0.0-rc.21", features = ["derive", "typescript"] }
specta-typescript = "0.0.9"
specta-jsdoc = "0.0.9"

[dev-dependencies]
tempfile = "3.21.0"
```

#### 3-3. 各crateのCargo.toml更新

**変更内容**: パス参照を更新

例: `crates/flequit-model/Cargo.toml`

```toml
[package]
name = "flequit-model"
version = "0.1.0"
edition = "2024"

[dependencies]
async-trait = "0.1.89"
chrono = { version = "0.4.41", features = ["serde"] }
partially = { version = "0.2.1", features = ["derive"]}
serde = { version = "1.0.219", features = ["derive"] }
uuid = { version = "1.18.0", features = ["serde", "v4"] }
specta = { version = "=2.0.0-rc.22", features = ["uuid"] }
specta-typescript = "0.0.9"
specta-jsdoc = "0.0.9"

# Internal dependencies - パスは変わらない（crates/内での相対パス）
flequit-types = { path = "../flequit-types" }
```

> **📝 注意**: crateディレクトリ内の相対パス（`../`）は変わりません。
> RustRoverのMove機能を使えば自動更新されます。

#### 3-4. desktop/src-tauri/tauri.conf.jsonの更新

**変更箇所**: `frontendDist` パスの更新

```json
{
  "$schema": "https://schema.tauri.app/config/2",
  "productName": "flequit",
  "version": "0.1.0",
  "identifier": "com.flequit.app",
  "build": {
    "beforeDevCommand": "bun run dev",
    "devUrl": "http://localhost:1420",
    "beforeBuildCommand": "bun run build",
    "frontendDist": "../build"  // ← "../../build"から変更
  },
  "app": {
    "windows": [
      {
        "title": "flequit",
        "width": 1200,
        "height": 800
      }
    ],
    "security": {
      "csp": null
    }
  },
  "bundle": {
    "active": true,
    "targets": "all",
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/128x128@2x.png",
      "icons/icon.icns",
      "icons/icon.ico"
    ]
  }
}
```

#### 3-5. desktop/package.jsonの更新

**変更箇所**: `tauri` コマンドの作業ディレクトリ

```json
{
  "name": "flequit-desktop",
  "version": "0.1.0",
  "description": "Flequit Desktop Application",
  "type": "module",
  "scripts": {
    "dev": "vite dev --host",
    "dev:e2e": "vite dev --port 10000 --host",
    "build": "vite build",
    "preview": "vite preview --host",
    "lint": "eslint .",
    "format": "prettier --write .",
    "check": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json",
    "check:watch": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json --watch",
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:ui": "vitest --ui",
    "test:e2e": "npx playwright test",
    "tauri": "cd src-tauri && export RUST_LOG=debug && tauri",
    "tauri:dev": "cd src-tauri && export RUST_LOG=debug && tauri dev --host",
    "machine-translate": "inlang machine translate --project project.inlang"
  },
  "license": "MIT",
  "dependencies": {
    // 既存の依存関係をそのまま
  },
  "devDependencies": {
    // 既存のdevDependenciesをそのまま
  }
}
```

#### 3-6. web-backend/Cargo.tomlの作成

**ファイル**: `/home/toyosuke/Projects/repo/github.com/varubogu/flequit/web-backend/Cargo.toml`

```toml
[package]
name = "flequit-web-backend"
version = "0.1.0"
edition = "2021"
description = "Flequit Web Backend API Server"

[[bin]]
name = "flequit-web-backend"
path = "src/main.rs"

[dependencies]
# Internal crates
flequit-types = { path = "../crates/flequit-types" }
flequit-model = { path = "../crates/flequit-model" }
flequit-repository = { path = "../crates/flequit-repository" }
flequit-infrastructure = { path = "../crates/flequit-infrastructure" }
flequit-core = { path = "../crates/flequit-core" }

# Webフレームワーク（例: Axum）
# TODO: 使用するフレームワークに応じて追加
# axum = "0.7"
# tower = "0.4"
# tower-http = { version = "0.5", features = ["cors", "trace"] }

# Async runtime
tokio = { version = "1.47.1", features = ["full"] }
futures = "0.3.31"

# Serialization
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0.143"

# Error handling
thiserror = "2.0.16"
anyhow = "1.0"

# Logging
tracing = "0.1.41"
tracing-subscriber = { version = "0.3.20", features = ["env-filter", "fmt"] }

# Database
sea-orm = { version = "1.1.14", features = ["sqlx-sqlite", "runtime-tokio-rustls"] }

# Utilities
chrono = { version = "0.4", features = ["serde"] }
uuid = { version = "1.18", features = ["serde", "v4"] }
async-trait = "0.1"
```

#### 3-7. web-backend/src/main.rsの作成（雛形）

**ファイル**: `/home/toyosuke/Projects/repo/github.com/varubogu/flequit/web-backend/src/main.rs`

```rust
// Webバックエンドのエントリポイント
// TODO: 使用するフレームワークに応じて実装

use tracing::info;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // ロギング初期化
    tracing_subscriber::fmt::init();

    info!("Starting Flequit Web Backend...");

    // TODO: Webサーバーの起動処理を実装
    // 例: Axumの場合
    // let app = Router::new()
    //     .route("/", get(handler));
    //
    // let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await?;
    // axum::serve(listener, app).await?;

    Ok(())
}
```

#### 3-8. .gitignoreの更新

**ファイル**: `/home/toyosuke/Projects/repo/github.com/varubogu/flequit/.gitignore`

```gitignore
.DS_Store
node_modules
coverage/

# Desktop app build artifacts
/desktop/build
/desktop/.svelte-kit
/desktop/package
/desktop/test-results/
/desktop/playwright-report/
/desktop/blob-report/
/desktop/playwright/.cache/

# Rust build artifacts
/target
/desktop/src-tauri/target
/web-backend/target
/crates/*/target
Cargo.lock  # workspace rootのみ管理、サブプロジェクトは除外

# Environment files
.env
.env.*
!.env.example
!.env.*.example

# Temporary files
vite.config.js.timestamp-*
vite.config.ts.timestamp-*
config.local.toml
.tmp

# AI/IDE specific
.claude/settings.local.json
.serena/
.idea/
```

#### 3-9. .vscode/settings.jsonの更新

**ファイル**: `/home/toyosuke/Projects/repo/github.com/varubogu/flequit/.vscode/settings.json`

```json
{
  "svelte.enable-ts-plugin": true,
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "prettier.prettier",
  "eslint.validate": [
    "javascript",
    "typescript",
    "svelte"
  ],
  "eslint.experimental.useFlatConfig": true,
  "cSpell.words": [
    "chrono",
    "CRDT",
    "flequit",
    "Inlang",
    "Paraglide",
    "rlib",
    "rustls",
    "serde",
    "sqlx",
    "tauri",
    "thiserror"
  ],
  "[rust]": {
    "editor.defaultFormatter": "rust-lang.rust-analyzer"
  },
  "rust-analyzer.linkedProjects": [
    "Cargo.toml"
  ],
  "rust-analyzer.cargo.features": "all"
}
```

#### 3-10. README.mdの更新

**ファイル**: `/home/toyosuke/Projects/repo/github.com/varubogu/flequit/README.md`

```markdown
# Flequit

タスク管理アプリケーション - モノレポ構成

## プロジェクト構成

このリポジトリはモノレポ構成を採用しており、以下のプロジェクトを含みます:

- **desktop/**: Tauriベースのデスクトップアプリケーション
  - Frontend: SvelteKit (SSG) + Svelte 5
  - Backend: Tauri (Rust)

- **web-backend/**: Rust Webフレームワークベースのバックエンドサーバー

- **crates/**: 共有Rustライブラリ
  - `flequit-types`: 基本型定義
  - `flequit-model`: ドメインモデル
  - `flequit-repository`: リポジトリレイヤー
  - `flequit-infrastructure`: インフラレイヤー
  - `flequit-core`: コアビジネスロジック
  - その他

## 開発環境のセットアップ

### 必要な環境
- Rust (latest stable)
- Node.js 18+ / Bun
- RustRover / VSCode (推奨)

### デスクトップアプリ

```bash
cd desktop
bun install
bun run tauri:dev
```

### Webバックエンド

```bash
cd web-backend
cargo run
```

### 全体のビルド

```bash
# ルートディレクトリで
cargo build --workspace
```

## テスト

```bash
# Rustテスト
cargo test --workspace

# フロントエンドテスト
cd desktop
bun test
```

## ドキュメント

詳細なドキュメントは `docs/` ディレクトリを参照してください。

## ライセンス

MIT
```

---

## RustRover操作ガイド

### Crateの移動方法（詳細）

#### ステップ1: プロジェクトを開く
1. RustRoverを起動
2. `File` → `Open` → `/home/toyosuke/Projects/repo/github.com/varubogu/flequit` を選択

#### ステップ2: 移動対象のcrateを選択
1. Project Toolウィンドウで `src-tauri/crates/flequit-types` を右クリック
2. `Refactor` → `Move...` を選択

#### ステップ3: 移動先を指定
1. 移動先ダイアログが表示される
2. `To directory:` に `/home/toyosuke/Projects/repo/github.com/varubogu/flequit/crates` を入力
3. `Refactor` ボタンをクリック

#### ステップ4: プレビュー確認
1. 変更プレビューが表示される
2. Cargo.tomlのパス参照が自動更新されることを確認
3. `Do Refactor` をクリック

#### ステップ5: すべてのcrateで繰り返し
以下のcrateについて、ステップ2〜4を繰り返す:
- `flequit-model`
- `flequit-repository`
- `flequit-infrastructure-sqlite`
- `flequit-infrastructure-automerge`
- `flequit-infrastructure`
- `flequit-core`
- `flequit-settings`
- `flequit-testing`

### 注意点
- ⚠️ 一度に複数のcrateを移動すると、依存関係の解決に失敗する可能性があるため、**1つずつ移動**することを推奨
- ⚠️ 移動後、必ず `cargo check` でエラーがないか確認

---

## 変更が必要なファイル一覧

### ✅ 新規作成

| ファイルパス | 内容 |
|-------------|------|
| `Cargo.toml` | ルートworkspace定義 |
| `web-backend/Cargo.toml` | Webバックエンド設定 |
| `web-backend/src/main.rs` | Webバックエンドエントリポイント |
| `web-backend/README.md` | Webバックエンド説明 |

### ✏️ 更新

| ファイルパス | 変更内容 |
|-------------|----------|
| `desktop/src-tauri/Cargo.toml` | workspace定義削除、パス参照更新 |
| `desktop/src-tauri/tauri.conf.json` | frontendDistパス更新 |
| `desktop/package.json` | tauriコマンド修正 |
| `.gitignore` | パス更新 |
| `.vscode/settings.json` | rust-analyzer設定追加 |
| `README.md` | モノレポ構成の説明追加 |

### 📦 移動（RustRoverで実施）

| 移動元 | 移動先 |
|-------|-------|
| `src-tauri/crates/*` | `crates/*` |

### 📦 移動（手動実施）

| 移動元 | 移動先 |
|-------|-------|
| `src/` | `desktop/src/` |
| `static/` | `desktop/static/` |
| `tests/` | `desktop/tests/` |
| `src-tauri/` | `desktop/src-tauri/` |
| `package.json` | `desktop/package.json` |
| その他フロントエンド設定ファイル | `desktop/` 配下 |

---

## 検証手順

### フェーズ4: ビルド・動作確認

#### 4-1. Rustワークスペースの検証

```bash
# ルートディレクトリで実行
cd /home/toyosuke/Projects/repo/github.com/varubogu/flequit

# 全crateのチェック
cargo check --workspace

# 全crateのビルド
cargo build --workspace

# 全crateのテスト
cargo test --workspace
```

**期待される結果**:
- ✅ すべてのcrateがエラーなくビルドできる
- ✅ パス参照エラーがない
- ✅ テストがパスする

#### 4-2. デスクトップアプリの検証

```bash
cd desktop

# 依存関係のインストール
bun install

# 型チェック
bun run check

# フロントエンドテスト
bun run test

# Tauriアプリの起動
bun run tauri:dev
```

**期待される結果**:
- ✅ フロントエンドがビルドできる
- ✅ Tauriアプリが起動する
- ✅ 既存機能が正常に動作する

#### 4-3. Webバックエンドの検証（雛形のみ）

```bash
cd web-backend

# ビルドチェック
cargo check

# 実行（雛形なので即座に終了）
cargo run
```

**期待される結果**:
- ✅ ビルドが成功する
- ✅ 共有crateが正しく参照できる

#### 4-4. IDEの動作確認

**RustRover**:
1. プロジェクトを再読み込み
2. `Cargo.toml` (ルート) が認識されていることを確認
3. コード補完が動作することを確認
4. 各crateへのジャンプが動作することを確認

**VSCode**:
1. プロジェクトを再読み込み
2. rust-analyzerが正常に動作することを確認
3. エラーがないことを確認

---

## トラブルシューティング

### エラー: `failed to load manifest`

**原因**: Cargo.tomlのパス参照が間違っている

**解決方法**:
1. 各Cargo.tomlのパス参照を確認
2. 相対パスが正しいか検証
3. `cargo check` でエラー箇所を特定

### エラー: `cannot find crate`

**原因**: workspace membersに登録されていない

**解決方法**:
1. ルート `Cargo.toml` の `[workspace] members` を確認
2. 該当crateが登録されているか確認

### RustRoverでリファクタリングが失敗する

**原因**: 複数のworkspaceが存在する場合に発生

**解決方法**:
1. 一旦手動でファイルを移動
2. 各Cargo.tomlのパス参照を手動で修正
3. `cargo check` で検証

### Tauriアプリが起動しない

**原因**: `tauri.conf.json` の `frontendDist` パスが間違っている

**解決方法**:
1. `desktop/src-tauri/tauri.conf.json` を開く
2. `frontendDist` を `"../build"` に修正
3. 再ビルド

---

## チェックリスト

移行完了時に以下を確認してください:

### 構造
- [ ] `crates/` ディレクトリが作成され、全crateが移動済み
- [ ] `desktop/` ディレクトリが作成され、フロントエンド・Tauriが移動済み
- [ ] `web-backend/` ディレクトリが作成され、雛形が配置済み

### 設定ファイル
- [ ] ルート `Cargo.toml` が作成され、workspace定義が正しい
- [ ] `desktop/src-tauri/Cargo.toml` のパス参照が更新済み
- [ ] `desktop/src-tauri/tauri.conf.json` の `frontendDist` が更新済み
- [ ] 各crateの `Cargo.toml` のパス参照が正しい

### ビルド・テスト
- [ ] `cargo check --workspace` が成功
- [ ] `cargo build --workspace` が成功
- [ ] `cargo test --workspace` がパス
- [ ] `desktop/` でフロントエンドビルドが成功
- [ ] Tauriアプリが起動し、既存機能が動作

### IDE
- [ ] RustRoverでプロジェクトが正しく認識される
- [ ] コード補完が動作する
- [ ] 各crateへのジャンプが動作する

### Git
- [ ] 移行前のコミットが作成済み
- [ ] すべての変更がコミット済み

---

## 参考資料

### Cargo Workspaces
- [The Cargo Book - Workspaces](https://doc.rust-lang.org/cargo/reference/workspaces.html)

### Tauri
- [Tauri Configuration](https://tauri.app/v1/api/config/)

### RustRover
- [RustRover Refactoring](https://www.jetbrains.com/help/rust/refactoring-source-code.html)

---

## 質問・相談

不明点や問題が発生した場合は、以下を確認してください:

1. エラーメッセージの内容
2. 実行したコマンド
3. 期待される動作と実際の動作の差異

---

**最終更新**: 2025-12-28
