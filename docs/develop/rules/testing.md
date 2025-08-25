# テスト関連のコーディングルール

## テストの種類と配置

### フロントエンド
- **単体テスト**:
  - テストフレームワーク: Vitest
  - 作成先： tests/unit/
- **結合テスト**:
  - テストフレームワーク: @testing-library/svelte + Vitest
  - 作成先： tests/integration/
- **E2Eテスト**:
  - コマンド: bun run test:e2e
  - テストフレームワーク: Playwright
  - 作成先： e2e/

### バックエンド
- **単体テスト**:
  - コマンド: cargo test
  - テストフレームワーク: cargo test
  - 作成先： 同一ソースコード内のテストブロック
- **結合テスト**:
  - コマンド: cargo test
  - テストフレームワーク: cargo test
  - 作成先： src-tauri/tests/integration
- **システムテスト**:
  - コマンド: cargo test
  - テストフレームワーク: cargo test
  - 作成先： src-tauri/tests/system

## テストデータ管理

- **テストデータ**: `tests/test-data/`ディレクトリに配置
- **基本原則**: 1関数＝1テストデータ生成

## テスト実行ルール

### 重要な制約
- **E2Eテスト**: 非常に負荷がかかるため、全体実行禁止、個別ファイル実行のみ
- **テストタイムアウト**: ファイル内テスト件数 × 1分

### テストコマンド

#### フロントエンド
- `bun run test` - Vitest全テスト実行
- `bun run test [ファイル名]` - Vitest個別ファイルテスト
- `bun run test:watch` - Vitestウォッチモード
- `bun run test:e2e [ファイル名]` - Playwright E2Eテスト（個別ファイルのみ、ヘッドレス）

#### バックエンド
- `cargo test` - cargo全テスト実行
- `cargo test [ファイル名]` - cargo個別ファイルテスト

## テスト設計原則

### 外部ファイル使用テスト
- 外部ファイルを使用するテストの場合 `.tmp/tests/` 配下にテストファイルとテストケースに応じたフォルダ＋実行日時フォルダを作成して利用する。
  例：
    `<project_root>/src-tauri/tests/integration/local_automerge_repository_test.rs`の`test_error_handling_and_edge_cases`を`2021/09/10 12:34:56`に実行
    ↓
    `<project_root>/.tmp/tests/cargo/integration/local_automerge_repository_test/test_error_handling_and_edge_cases/20210910_123456/`
- Automergeを利用するテストの場合、automergeファイルに加えて、１つ編集するごとにjson_historyフォルダにjsonスナップショットを出力する
- テスト実行時にテスト対象かに関わらず、以下の手順でSQLiteのファイルを用意する
  1. `/tmp/flequit_test/database.db` を作成しマイグレーションする。(どのテストを実行するか、いくつのテストを実行するかに関わらず処理が "必ず" "1度だけ" 行われる)
  2. SQLiteを使うテストの場合、1で作ったファイルを各テスト用フォルダ（`<project_root>.tmp/tests/...`）にコピーして使う
  このようにすることでマイグレーション回数は最小限に抑える
- 上記のように競合しないようテスト対象のファイルを出力するため、テスト後にクリーンアップは行わない

### フロントエンド
- コンポーネントの単体テスト作成時、外部UIライブラリはモックは使わない
- 外部UIライブラリ以外はモック化する
- vitest（単体テスト）は`getTranslationService()`をモック化して実行する

### 国際化システムのテスト
- 詳細は`docs/develop/design/testing.md`の「翻訳システムのテスト」セクションを参照
