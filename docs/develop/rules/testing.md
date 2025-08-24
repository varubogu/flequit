# テスト関連のコーディングルール

## テストの種類と配置

### フロントエンド
- **単体テスト**: Vitest
- **結合テスト**: @testing-library/svelte + Vitest
- **E2Eテスト**: Playwright

### バックエンド
- **単体テスト**: cargo test
- **結合テスト**: cargo test

## テストデータ管理

- **テストデータ**: `tests/test-data/`ディレクトリに配置
- **基本原則**: 1関数＝1テストデータ生成

## テスト実行ルール

### 重要な制約
- **E2Eテスト**: 全体実行禁止、個別ファイル実行のみ
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

### フロントエンド
- コンポーネントの単体テスト作成時、外部UIライブラリはモックは使わない
- 外部UIライブラリ以外はモック化する
- vitest（単体テスト）は`getTranslationService()`をモック化して実行する

### 国際化システムのテスト
- 詳細は`docs/develop/design/testing.md`の「翻訳システムのテスト」セクションを参照