## レスポンスについて

日本語で

## 作ってるアプリ

Tauri製のタスク管理アプリ。
プロジェクト管理や人とタスクのやり取りも可能。
現在はローカル動作（SQLite）想定だが、将来的にはWeb同期、クラウドストレージ同期も対応
同期時に競合が起きないようにAutoMergeベースのデータ管理をする。


## 環境について

### 開発ツール・言語
- bun
- typescript
- vite
- svelte5
- tailwind v4

### テストツール
- vitest  -> 「bun run test」
- playwright  -> ユーザーが呼び出すので使用禁止
- @testing-library/svelte

## プロジェクト構造

- flequit 全体、ワークスペース
  - docs: 仕様書
  - e2e: Playwrightを使ったE2Eテスト
  - playwright-report: e2eテストの結果
  - src: ソースコード
  - src-tauri: Tauriのソースコード
  - tests: vitestを使った単体・結合テストコード
  - test-results: vitestの結果

## コーディングについて

- ファイルの単位は単一機能とし、分解できる単位を常に探す
- 200行超えるなら必ず分割する。100行でも分割してよい可能性が高い
- 命名規則について、コンポーネントファイル名はケバブケース、他は一般的なTypeScriptの基準に従う

## ワークフロー
- コードを編集した後、vitest作成、bun check、vitest（ファイル単位）、vitest（全体）、playwright（ファイル単位）を実行する
- 実行過程でエラーが出た場合、そのエラーを解消して再度実行、解消されてから先に進む。


## 使用コマンド
- `bun check` bunのチェッカーを使用（コード変更後に実施）
- `bun run test <ファイル名>` vitestを利用した単体・結合テストを1ファイルのみ実行
- `bun run test` vitestを利用した単体・結合テスト全ファイルで実行
- `bun run test:e2e <ファイル名>` playwrightを利用したE2Eテスト実行（全体のE2Eテスト実行は禁止、ヘッドレスモードのみOK、タイムアウトはそのファイルのテスト件数✕1分とします）
