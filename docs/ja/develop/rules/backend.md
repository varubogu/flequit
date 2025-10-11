# バックエンド固有のコーディングルール

## Rust部分について

### Option型の扱い

- Optionから値を取り出す際、1つだけならif let Someで取ってよいが、複数ある場合はネストが深くならないように一時的に変数に格納する

## モジュールの関連性

### Tauri側アーキテクチャ

クリーンアーキテクチャ採用

```text
アプリケーション層イベント（commands,controllers,eventなど）
↓
ドメイン層（facadeが呼び出され、場合によってはそこから複数のserviceを呼び出す）
↓
データアクセス層（repository, 実体としてはsqliteやautomergeなど）
```

### アクセス制御ルール

- **commands**: facadeはOK、commands, service, repositoriesはNG
- **facade**: serviceはOK、facade, commands, repositoriesはNG
- **service**: serviceとrepositoryはOK、commands, facadeはNG
- **repository**: repository内のみOK、外部はNG

## 開発ワークフロー

詳細は `docs/develop/rules/workflow.md` を参照してください。
