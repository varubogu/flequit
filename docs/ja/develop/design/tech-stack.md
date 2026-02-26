# 技術スタック・プロジェクト構造

## 技術スタック・アーキテクチャ

### フロントエンド

- **SvelteKit**: メインフレームワーク（Svelte 5 + runes使用）
- **アダプター**: `@sveltejs/adapter-static` (SSG) - Tauriでの静的サイト生成
- **UI**: shadcn-svelte（bits-uiベース）- 極力オリジナルを維持
- **スタイリング**: Tailwind CSS v4 + カスタムCSS変数
- **国際化**: Inlang Paraglide（英語・日本語対応）
- **アイコン**: Lucide Svelte
- **パッケージマネージャ**: bun
- **ビルドツール**: Vite
- **型チェック**: TypeScript + svelte-check
- **フォーマッター**: Prettier
- **リンター**: ESLint
- **テスト**: Vitest(単体) + @testing-library/svelte(結合) + Playwright(E2E)

### バックエンド・デスクトップ

- **Tauri**: デスクトップアプリケーションフレームワーク
- **Rust**: バックエンドロジック
- **SQLite**: ローカルデータベース
- **Automerge**: ローカルデータベースの履歴管理・同期用
- **Web backendの状態**: 実験用スタブのみ（`PUBLIC_ENABLE_EXPERIMENTAL_WEB_BACKEND=true` で有効化）
- **パッケージマネージャ**: cargo
- **ビルドツール**: cargo
- **型チェック**: cargo check
- **フォーマッター**: rustfmt
- **リンター**: clippy
- **テスト**: cargo test

## プロジェクト構造

```
(root)
├── e2e/           # E2Eテスト
│   ├── components/  # SvelteコンポーネントのE2Eテスト
├── src/          # ソースコード
│   ├── lib/
│   │   ├── components/          # Svelteコンポーネント
│   │   │   ├── ui/             # shadcn-svelte基本コンポーネント（オリジナル維持）
│   │   │   ├── shared/         # 共通コンポーネント
│   │   │   └── [機能別]/       # 特定用途のコンポーネント
│   │   ├── services/           # ビジネスロジック（API通信、データ操作）
│   │   ├── stores/             # Svelte 5 runesベースの状態管理
│   │   ├── types/              # TypeScript型定義
│   │   └── utils/              # 純粋なヘルパー関数
│   ├── routes/                 # SvelteKitルーティング
│   ├── paraglide/              # 国際化（自動生成、Git管理対象外）
│   ├── app.css                 # グローバルスタイル + Tailwind設定
│   └── app.html                # HTMLテンプレート
├── src-tauri/                  # Tauri部分のソースコード
│   ├── capabilities/           # Tauriセキュリティ設定
│   ├── icons/                  # アプリアイコン
│   ├── crates/                 # 分割されたクレート
│   │   ├── flequit-storage/    # ストレージ層クレート
│   │   │   ├── src/
│   │   │   │   ├── errors/             # エラー型
│   │   │   │   ├── models/             # データモデル
│   │   │   │   │   ├── command/        # コマンド用モデル
│   │   │   │   │   └── sqlite/         # SQLite用モデル
│   │   │   │   ├── repositories/       # Repository実装
│   │   │   │   │   ├── cloud_automerge/ # クラウドAutomerge
│   │   │   │   │   ├── local_automerge/ # ローカルAutomerge
│   │   │   │   │   ├── local_sqlite/    # ローカルSQLite
│   │   │   │   │   ├── web/             # Webサーバー
│   │   │   │   │   ├── unified/         # 統合レイヤー
│   │   │   │   │   └── *_trait.rs       # Repository trait定義
│   │   │   │   ├── types/              # 型定義
│   │   │   │   └── utils/              # ストレージ用ユーティリティ
│   │   │   ├── tests/              # ストレージ層テスト
│   │   │   ├── build.rs            # テスト用DB作成
│   │   │   └── Cargo.toml
│   │   └── flequit-core/           # ビジネスロジック層クレート
│   │       ├── src/
│   │       │   ├── facades/            # ファサードレイヤー
│   │       │   └── services/           # サービスレイヤー
│   │       └── Cargo.toml
│   ├── src/                    # メインアプリケーション
│   │   ├── commands/           # Tauriコマンド（最小構成）
│   │   ├── logger.rs           # ログ設定
│   │   └── lib.rs              # エントリーポイント
│   ├── target/
│   ├── build.rs
│   ├── Cargo.lock
│   ├── Cargo.toml
│   └── tauri.conf.json
├── tests/                    # 単体・結合テスト(vitest)
│   ├── test-data/            # 単体・結合テスト(vitest)で使用するテストデータ（1関数＝1テストデータ生成）
│   ├── integration/          # 結合テスト
│   ├── */                    # 単体テスト
│   └── vitest.setup.ts       # Vitest設定
```
