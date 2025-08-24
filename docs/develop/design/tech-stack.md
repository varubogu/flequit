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
│   ├── capabilities/           # ???
│   ├── icons/                  # アプリアイコン
│   ├── src/                    # Tauriソースコード
│   │   ├── commands/           # フロントエンドからinvokeで呼び出されるTauriコマンド
│   │   ├── errors/             # エラー型格納
│   │   ├── models/             # モデル定義
│   │   │   ├── command/        # コマンド用のモデル
│   │   │   └── sqlite/         # SQLite用のモデル定義とマイグレーション
│   │   ├── repositories/                 # Repositoryの定義
│   │   │   ├── cloud_automerge/          # クラウドストレージのAutomergeでデータを読み書きするためのRepository定義
│   │   │   ├── local_automerge/          # ローカルのAutomergeでデータを読み書きするためのRepository定義
│   │   │   ├── local_sqlite/             # ローカルのSQLiteでデータを読み書きするためのRepository定義
│   │   │   ├── web/                      # Webサーバーに保存するためのRepository定義
│   │   │   ├── base_repository_trait.rs  # Repositoryのベース定義（CRUD操作など）
│   │   │   └── XXXX_repository_trait.rs  # 機能別Repositoryのベース定義（project_repository_traitなど）
│   │   ├── services/                     # Serviceの定義
│   │   │   └── xxxx_service.rs           # 機能別Serviceの定義（project_serviceなど）
│   │   ├── types/          # type,enumなどの型定義（構造体はmodelsで定義）
│   │   └── utils/          # 汎用処理のヘルパー関数群
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