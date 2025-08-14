# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## レスポンスについて

日本語で

## アプリケーション概要

Tauri製のタスク管理デスクトップアプリケーション。プロジェクト管理や人とタスクのやり取りも可能。現在はローカル動作（SQLite）想定だが、将来的にはWeb同期、クラウドストレージ同期も対応予定。同期時に競合が起きないようにAutoMergeベースのデータ管理システムを採用する。

## 技術スタック・アーキテクチャ

### フロントエンド

- **SvelteKit**: メインフレームワーク（Svelte 5 + runes使用）
- **アダプター**: `@sveltejs/adapter-static` (SSG) - Tauriでの静的サイト生成
- **UI**: shadcn-svelte（bits-uiベース）- 極力オリジナルを維持
- **スタイリング**: Tailwind CSS v4 + カスタムCSS変数
- **国際化**: Inlang Paraglide（英語・日本語対応）
- **アイコン**: Lucide Svelte

### バックエンド・デスクトップ

- **Tauri**: デスクトップアプリケーションフレームワーク
- **Rust**: バックエンドロジック
- **SQLite**: ローカルデータベース
- **Automerge**: ローカルデータベースの履歴管理・同期用

### 開発ツール

- **パッケージマネージャ**: bun
- **ビルドツール**: Vite
- **型チェック**: TypeScript + svelte-check
- **テスト**: Vitest + @testing-library/svelte + Playwright

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
│   └── app.html               # HTMLテンプレート
├── tests/         # 単体・結合テスト(vitest)
│   ├── integration/          # 結合テスト
│   ├── */                    # 単体テスト
│   └── vitest.setup.ts       # Vitest設定

```

## Svelte 5 設計パターン

### 状態管理

- **$state**: リアクティブな状態
- **$derived**: 派生状態（計算されたプロパティ）
- **$effect**: 副作用処理
- **クラスベースストア**: 複雑な状態管理に使用

### コンポーネント設計

- **props**: `let { prop }: Props = $props()`
- **イベント**: コールバック関数を優先、CustomEventは必要時のみ
- **スニペット**: `Snippet`型を使用した子コンテンツ渡し

## 国際化システム

全てのUIに関わるテキストは多言語対応を行う。
設定画面でUI言語を選択可能で、選択後は即時反映される。（リアクティブ対応でリロード不要）

- **Inlang Paraglide**: 翻訳管理（`project.inlang/`設定）
- **対応言語**: 英語（ベース）、日本語
- **使用方法**:
  1. `paraglide/messages`からメッセージをインポート
  2. `reactiveMessage`を使用してリアクティブにメッセージを取得
  3. 実際に使用する

  ```typescript
  import * as m from '$paraglide/messages';
  import { reactiveMessage } from '$lib/stores/locale.svelte';
  const msg_task_title = reactiveMessage(m.task_title());
  ```

  ```svelte
  <h1>{$msg_task_title}</h1>
  ```

- **ビルド**: `bun run build`で翻訳ファイル自動生成
- **テスト時**: vitest（単体テスト）は`getTranslationService()`をモック化して実行する。詳細は`docs/develop/design/testing.md`の「翻訳システムのテスト」セクションを参照

## コーディング規約

### ファイル構成

- **単一責任原則**: 1ファイル1機能
- **ファイルサイズ**: 200行超過で必須分割、100行でも分割検討
- **命名規則**:
  - コンポーネント: ケバブケース（`task-item.svelte`）
  - その他: TypeScript標準規約

### コンポーネント設計原則

- shadcn-svelteコンポーネントは極力オリジナル維持
- 機能別コンポーネントは適切なディレクトリに配置
- 200行を超える場合は機能分割を検討
- メッセージはInlang Paraglideを使用して常に国際化対応

### Rust部分について

- Optionから値を取り出す際、１つだけならif let Someで取ってよいが、複数ある場合はネストが深くならないように一時的に変数に格納する

## 開発ワークフロー

### 推奨手順

手順の過程でエラーが発生した場合、解消後に次工程に進む

#### フロントエンド（SvelteKit）のコード修正時

1. コード編集
2. vitest単体テストケース作成
3. `bun check` - 型チェック実行
4. `bun run test [単体テストファイル名]` - vitest単体テスト実行
5. vitest結合テストケース作成
6. `bun run test [結合テストファイル名]` - vitest結合テスト実行
7. `bun run test` - vitest全テスト実行
8. Playwright(E2E)テストケース作成
9. `bun run test:e2e [E2Eテストファイル名]` - E2Eテスト実行（個別ファイルのみで全体は実行しない）

#### Tauriのコード修正時

1. コード編集
2. `cargo check --quiet` - エラーがないかチェック（警告は一旦除く）
3. `cargo check` - 警告がないかチェック
4. `cargo test [単体テストファイル名]` - cargo単体テスト実行
5. cargo結合テストケース作成
6. `cargo run test [結合テストファイル名]` - cargo結合テスト実行
7. `cargo run test` - cargo全テスト実行

#### 両方のコード修正時

フロントエンド、Tauriの順番で推薦手順を実施

### 重要な制約

- **開発サーバー**: `bun run dev`は使用禁止（ユーザーが使用中）
- **E2Eテスト**: 全体実行禁止、個別ファイル実行のみ
- **テストタイムアウト**: ファイル内テスト件数 × 1分

## コマンド一覧

### 開発・ビルド

- `bun check` - TypeScript型チェック（コード変更後必須実行）
- `bun run build` - プロジェクトビルド（Paraglide翻訳ファイル含む）
- `bun run tauri:dev` - Tauriデスクトップアプリ開発モード

### テスト

- `bun run test` - Vitest全テスト実行
- `bun run test [ファイル名]` - Vitest個別ファイルテスト
- `bun run test:watch` - Vitestウォッチモード
- `bun run test:e2e [ファイル名]` - Playwright E2Eテスト（個別ファイルのみ、ヘッドレス）

### 国際化

- `bun run build` - Inlang機械翻訳実行
- 各項目は設定変更によってリロード不要で即時反映するためにリアクティブ対応する必要あり
