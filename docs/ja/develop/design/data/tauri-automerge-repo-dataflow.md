# Automerge-Repo データフロー設計書

タスク管理アプリのデータ管理システム概念設計。Tauri → Commands → Facade → Service → Repository の 4 階層呼び出し構造で、クリーンアーキテクチャと Automerge-Repo による CRDT 操作を提供する。

> 実装の正本は `src-tauri/crates/...` を参照。

## 1. アーキテクチャ

```
Frontend (SvelteKit)
    ↓ Tauri invoke
Commands → Facade → Service → Repository
                                    ├── local_automerge/
                                    ├── local_sqlite/
                                    ├── cloud_automerge/
                                    └── web/
```

### レイヤー責務

| 層 | 責務 |
| --- | --- |
| Commands | Tauri invoke 関数の公開、入力検証、結果変換、Facade 呼び出し |
| Facade | アプリ統合ポイント、複数サービスの協調、トランザクション境界、コマンドモデル変換 |
| Service | ドメインビジネスロジック、整合性、権限・バリデーション、ストレージ非依存 |
| Repository | データアクセスの具象実装 (CRUD・型変換・シリアライゼーション)、ストレージごとに別実装 |

詳細は `rust-guidelines.md` のクレート分割を参照。

## 2. データ階層構造

### Automerge ドキュメント分割 (4 種類)

| ドキュメント | 内容 |
| --- | --- |
| `settings.automerge` | アプリ設定 + プロジェクト一覧 + ローカル設定 + ビュー設定 |
| `account.automerge` | アカウント情報 (認証プロバイダー情報) |
| `user.automerge` | ユーザープロフィール情報 |
| `project_{project_id}.automerge` | プロジェクト固有データ (タスクリスト・タスク・サブタスク・タグ・メンバー) |

### 設計根拠

- **データ一貫性**: プロジェクト内エンティティの整合性を 1 ドキュメントで保証
- **トランザクション境界**: プロジェクト内の複数変更を 1 トランザクションで処理
- **権限管理**: プロジェクト単位のアクセス制御が自然
- **パフォーマンス**: 2 層アーキテクチャにより大きなドキュメントの実行時影響を軽減
- **セキュリティ**: アカウント認証情報とユーザー情報を分離
- **設定分離**: グローバル設定とプロジェクト固有データを独立管理

## 3. Repository API パターン

Repository 層は階層的データアクセスを提供する。詳細な API シグネチャは `src-tauri/crates/flequit-repository/src/repositories/...` を参照。

主要操作:

- **Settings document**: `list_projects()`, `get_local_settings()`, `set_local_settings()`
- **Account/User document**: `get_account()`, `set_account()`, `get_user()`, `set_user()`
- **Project document**: タスクリスト・タスク・サブタスク・タグ・メンバーの `set_x()` / `get_x(id)` / `list_x(project_id)` 系メソッド

### CRDT 操作の種類

- **Insert**: 新規エンティティ追加
- **Update**: 既存データ部分更新
- **Delete**: ドキュメントを `.deleted/` フォルダへ移動 (詳細は §6)

## 4. データフロー

```
Frontend → Commands → Facade → Service → Repository
                                              ↓
                        実装による分岐 (local_automerge / local_sqlite / cloud_automerge / web)
                                              ↓
                                  選択ストレージで操作
                                              ↓
                                Network Sync (必要に応じて)
```

### 2 層ストレージ (SQLite + Automerge)

- **SQLite**: 最新データの高速アクセス、インデックス・クエリ最適化
- **Automerge**: 履歴管理・同期機能に特化
- **読み込み**: SQLite から最新データを取得 (高速)
- **書き込み**: SQLite + Automerge 両方を更新 (整合性保証)
- **同期**: Automerge の変更を SQLite に反映
- **履歴**: Automerge から過去データへアクセス

## 5. ファイルストレージと DocumentId マッピング

### ファイル命名規則

`~/.local/share/flequit/automerge/` 配下に説明的な名前で保存:

- `settings.automerge`
- `account.automerge`
- `user.automerge`
- `project_{uuid}.automerge` (1 プロジェクト = 1 ファイル)

### 動的マッピング (永続化なし)

起動時にインメモリの双方向マッピング `HashMap<DocumentId, Filename>` を構築。永続化されたマッピングファイルは使用しない。

1. **起動時スキャン**: `FileStorage::new()` がストレージディレクトリ内の全 `.automerge` ファイルをスキャン (`.deleted/` 除外)
2. **DocumentId 抽出**: ファイル内容から DocumentId を抽出
3. **DocumentId 生成**: 抽出失敗時はファイル名から UUID v5 で決定的に生成
4. **マッピング構築**: 双方向マップをメモリ内に構築
5. **実行時アクセス**: 全ファイル操作でインメモリマッピングを使用

実装参照: `src-tauri/crates/flequit-infrastructure-automerge/src/storage/file_storage.rs`

### ファイルポータビリティの利点

- **共有容易**: ユーザーが `.automerge` ファイルを直接コピーしてデータ共有可能
- **クラウドストレージ互換**: シンボリックリンクで動作
- **ゼロコンフィグレーション**: コピーされたファイルが即座に動作
- **クリーンなストレージ**: メタデータファイル不要

## 6. ドキュメント削除とゴミ箱機能

物理削除ではなく **`.deleted/` フォルダへの移動** で削除を実現する。誤削除からの保護、データバックアップ、監査証跡の利点を得る。

### ファイル構造

```
~/.local/share/flequit/automerge/
├── settings.automerge          # 有効
├── project_xxx.automerge       # 有効
└── .deleted/                   # 削除済み
    ├── project_yyy.automerge
    ├── project_yyy.meta.json   # 削除メタデータ
    └── ...
```

### 削除メタデータ (`.meta.json`)

- `doc_type`: ドキュメントタイプ + ID
- `deleted_at`: 削除日時 (ISO 8601 / UTC)
- `original_filename`: 元のファイル名
- `original_path`: 元のファイルパス

### 削除処理フロー

1. メモリキャッシュから削除 (`DocumentManager::delete()`)
2. 元ファイルの存在確認
3. `.deleted/` フォルダ作成 (なければ)
4. ファイルを `.deleted/` に移動
5. メタデータ `.meta.json` 作成
6. ログ記録

### `FileStorage` 初期化時の除外

起動時スキャンで `.deleted/` フォルダ内・ディレクトリ・`.meta.json` を除外する。

### 将来的な拡張

- **復元機能**: メタデータから元のパスを取得し、ファイルを元の場所に戻す
- **完全削除**: デスクトップは `trash` クレートで OS ゴミ箱へ、モバイルは完全削除
- **自動クリーンアップ**: 指定日数経過後の削除ファイルを自動処理

### 設計の利点

- 二段階の安全網: アプリ内復元 → OS ゴミ箱 → 完全削除
- クロスプラットフォーム統一動作
- フォルダごとコピーでバックアップ完了
- 実装シンプル (ファイル移動のみ)
- 段階的な拡張が可能

## 7. エラーハンドリング

### エラー変換フロー

```
RepositoryError → ServiceError → FacadeError → CommandError → Frontend
```

| 層 | エラー | 役割 |
| --- | --- | --- |
| Repository | `RepositoryError` | データアクセスエラー (ストレージ固有) |
| Service | `ServiceError` | ドメインロジックエラー (`#[from] RepositoryError` で自動変換) |
| Facade | `FacadeError` | 複数サービス協調時の統合エラー |
| Command | `CommandError` | UI 表示用エラー (Serialization、入力検証等) |

### データ整合性エラー

- **削除済みエンティティへの操作**: `.deleted/` 配下のドキュメントへの操作は `RepositoryError` で失敗
- **バリデーションエラー**: 必須フィールド不足・型制約違反等。入力値検証は Service、データ制約は Repository

### 同期エラー

- **リトライ**: 周期的同期 → 次回同期で再実行 / 手動同期 → ユーザー再実行
- **オフライン対応**: ローカル動作が基本、同期はオプション。ネットワーク切断時も通常動作継続

## 8. 主要機能

- **CRDT 操作**: 自動マージ、競合解決の自動化、履歴管理
- **同期**: ローカルファースト (SQLite ベース)、増分同期、競合検知の自動解決、Web バックエンド or クラウドストレージへの同期
- **データ管理**: 型安全な構造体操作、階層的データアクセス、トランザクション管理
- **型安全性**: Rust 厳格型システム + 必須フィールド (id / created_at / updated_at) + その他は Optional (拡張性考慮)
