# バックエンド固有のコーディングルール

## Rust部分について

### Option型の扱い
- Optionから値を取り出す際、１つだけならif let Someで取ってよいが、複数ある場合はネストが深くならないように一時的に変数に格納する

## モジュールの関連性

### Tauri側アーキテクチャ

クリーンアーキテクチャ採用

```
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

### Tauriのコード修正時

手順の過程でエラーが発生した場合、解消後に次工程に進む

1. コード編集
2. `cargo check --quiet` - エラーがないかチェック（警告は一旦除く）
3. `cargo check` - 警告がないかチェック
4. `cargo clippy` - リンター実行
5. `cargo fmt --all` - フォーマッター実行
6. `cargo test [単体テストファイル名]` - cargo単体テスト実行
7. cargo結合テストケース作成
8. `cargo test [結合テストファイル名]` - cargo結合テスト実行
9. `cargo test` - cargo全テスト実行

### 両方のコード修正時

フロントエンド、Tauriの順番で推薦手順を実施