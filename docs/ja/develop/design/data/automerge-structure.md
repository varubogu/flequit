# Automerge 構造仕様

Flequit のデータ管理は、ローカル環境での CRDT (Conflict-free Replicated Data Type) による分散同期を目的とした Automerge ベースのシステム。データは複数の Automerge ドキュメントに分散保存され、将来のクラウド同期や競合解決に対応する設計。

> 実装の正本は `src-tauri/crates/flequit-infrastructure-automerge/` を参照。データフロー全体は [`tauri-automerge-repo-dataflow.md`](./tauri-automerge-repo-dataflow.md) 参照。

## ドキュメント分割

データは 4 種類の Automerge ドキュメントに分割される:

| ドキュメント | ファイル | 内容 |
| --- | --- | --- |
| Settings | `settings.automerge` | 設定情報 + プロジェクト一覧 + カスタム日付/日時フォーマット + ローカル設定 |
| Account | `account.automerge` | ローカルアカウント + サーバーアカウント配列 |
| User | `user.automerge` | ユーザー情報配列 (**追加・更新のみ、削除不可**) |
| Project | `project_{id}.automerge` | プロジェクト詳細 + タスクリスト + タスク + サブタスク + タグ + メンバー (1 プロジェクト = 1 ファイル) |

### ドキュメント間の関係

- **Settings → Project**: プロジェクト一覧から各プロジェクト詳細へナビゲーション
- **Account ↔ User**: 認証情報 (ローカル/サーバー) と公開プロフィールの関連
- **Project → User**: メンバー・担当者は `User.id` で参照
- **TaskList → Task → SubTask**: 階層的タスク管理

## データアクセスパターン

実装は `DocumentManager::load_data()` 系 API で対象ドキュメントとフィールド名を指定して取得する。

実装参照:

- Rust: `src-tauri/crates/flequit-infrastructure-automerge/src/document_manager.rs`
- TypeScript からの呼び出し: `invoke('get_projects', ...)`、`invoke('get_tasks', { projectId })` 等
- 詳細な命令一覧は `src-tauri/src/commands/mod.rs` の `generate_app_handler!` 参照

### Tree 系コマンド

通常の単一エンティティ取得に加え、関連データを含む Tree 構造の取得コマンドも提供:

- `get_user_with_assignments(userId)`: ユーザー + 担当タスク・サブタスク
- `get_tag_with_relations(tagId)`: タグ + 関連タスク・サブタスク
- `assign_task_to_user(taskId, userId)`: 正規化された紐付けテーブルを使用
- `add_tag_to_subtask(subtaskId, tagId)`: 同上
- `associate_recurrence_rule_to_task(taskId, recurrenceRuleId)`: 繰り返しルール関連付け

## User Document の特別な操作制約

User Document は他と異なり以下の制約がある。

### 操作制約

| 操作 | 可否 |
| --- | --- |
| 追加 | ✓ (新しいプロフィール追加は常に可能) |
| 更新 | ✓ (既存プロフィールの更新可能) |
| **削除** | **不可** (情報蓄積方式) |
| 編集権限 | 自分の `Account.user_id` にマッチするプロフィールのみ編集可能 |

### データ特性

- **公開情報**: 全プロフィールは他ユーザーから参照可能
- **情報蓄積**: プロジェクト参加者・担当者の情報を継続的に蓄積
- **プロフィール管理**: 自分と他人の公開プロフィール情報として機能

### 編集可否の判定

`current_account.user_id == target_user_id` の場合のみ編集を許可する。

実装参照: `src-tauri/crates/flequit-core/src/services/user_service.rs` (該当があれば)

### 更新ロジック

`update_user_profile(users, updated_user)`:

- ID 一致のユーザーがいれば既存プロフィールを置き換え
- いなければ新規追加 (削除はしない)

## 同期と競合解決

Automerge の特性により以下を実現:

- **自動競合解決**: CRDT アルゴリズムによる自動マージ
- **分散同期**: オフライン環境での操作と後の同期
- **履歴管理**: 全変更履歴の保持
- **部分同期**: ドキュメント単位での効率的な同期
