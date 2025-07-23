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


## コーディングについて

- ファイルの単位は単一機能とし、分解できる単位を常に探す
- 200行超えるなら必ず分割する。100行でも分割してよい可能性が高い
- 命名規則について、コンポーネントファイル名はケバブケース、他は一般的なTypeScriptの基準に従う

# ワークフロー
- コード変更後は「bun check」を実行し、単体テストも実行する
- `playwright test`と`bun run test:e2e`はユーザーが実行します。AI側では使用禁止です。


## 使用コマンド
- `bun check` bunのチェッカーを使用（コード変更後に実施）
- `bun run test` vitestを利用したテスト実行（`bun check`後に実施
