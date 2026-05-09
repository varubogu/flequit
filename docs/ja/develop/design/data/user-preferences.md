# User Preferences (ユーザー設定)

ユーザーの個人作業環境設定を管理するカテゴリ。プロジェクトデータ (チーム共有) とは独立し、同じユーザーの複数端末間でのみ同期される。

## 位置づけ: データカテゴリの分類

| カテゴリ | 目的 | 同期対象 | Automerge | 例 |
| --- | --- | --- | --- | --- |
| `accounts` | 認証情報 | - | なし | ユーザープロフィール |
| `user_preferences` | 個人作業環境 | 同じユーザーの他端末 | あり | タグブックマーク、UI 設定 |
| `projects` | プロジェクトデータ | チームメンバー全員 | あり | タスク、タグ、プロジェクト |

### `user_preferences` の特徴

1. **個人専用**: 他のユーザーとは共有しない
2. **端末間同期**: 同じユーザーの複数端末で同期
3. **プロジェクト依存**: 多くの設定は `project_id` をキーとして管理
4. **ローカル永続化**: SQLite + Automerge

## Automerge ドキュメント階層

```
/user_preferences/{user_id}
  ├── tag_bookmarks/{project_id}/{tag_id}
  ├── view_preferences/{project_id}/         # 将来: カラム幅、ソート、フィルタ
  ├── sidebar_state/                          # 将来: 開閉、幅、ピン留め
  └── ui_settings/                            # 将来: テーマ、言語、日付フォーマット
```

## 現在実装されているエンティティ

### TagBookmark (タグブックマーク)

サイドバーに固定表示するタグの管理。詳細フィールド定義は [`entity/user-preferences.md`](./entity/user-preferences.md) 参照。

主要フィールド: `project_id` / `tag_id` / `order_index` / `created_at` / `updated_at`

## 同期戦略

### SQLite と Automerge の使い分け

| ストレージ | 役割 |
| --- | --- |
| SQLite | 高速な読み取りとクエリ (初期化一括読み込み、並び替え、フィルタリング) |
| Automerge | 複数端末間同期 (変更履歴管理、CRDT による競合解決) |

### 同期フロー

端末 A での設定変更 → SQLite + Automerge を更新 → 同期サーバ (将来) 経由 → 端末 B が Automerge を受信 → SQLite に反映。

## `user_id` の扱い

- **現在**: 固定値 `"local_user"` (単一ユーザー環境)
- **将来**: 複数デバイスでの同一ユーザー識別 (デバイス ID ベース or クラウド認証連携)

## 設計原則

### 1. プロジェクト依存の設定

多くの設定は `project_id` をキーとして管理する。`tag_id` 単独では「どのプロジェクトのタグか」が不明になるため、必ず `project_id` をセットで保持する。

### 2. Automerge パスの一貫性

階層構造 `/user_preferences/{user_id}/{category}/{project_id}/{entity_id}` を保つ。

### 3. SQLite と Automerge の整合性

両方に同じデータを保存。SQLite は読み取り最適化、Automerge は同期最適化。

## 拡張計画

| 優先度 | エンティティ |
| --- | --- |
| 高 | タグブックマーク (実装済)、サイドバー状態 (開閉・幅) |
| 中 | ビュー設定 (カラム幅、ソート順、フィルター)、UI 設定 (テーマ、言語) |
| 低 | キーボードショートカットのカスタマイズ、通知設定 |

## 実装ガイドライン (新規エンティティ追加時)

1. **ドキュメント追記**: `entity/user-preferences.md` に新エンティティを追記 (`_template.md` のフォーマットに従う)。`docs/en/` 側は別タスクで同期。
2. **Rust モデル作成**: `flequit-model`, `flequit-infrastructure-sqlite`, `flequit-infrastructure-automerge` の各 `src/models/user_preferences/` 配下に追加
3. **TypeScript 型定義**: `src/lib/types/user-preferences/` に追加
4. **サービス実装**: Rust 側 `flequit-core/src/services/user_preferences/`、TypeScript 側 `src/lib/services/domain/user-preferences/`
5. **ストア実装**: `src/lib/stores/user-preferences/{entity-name}-store.svelte.ts`

## 関連

- [`entity/user-preferences.md`](./entity/user-preferences.md): エンティティ仕様
- [`automerge-structure.md`](./automerge-structure.md): Automerge 構造全般
- [`tauri-automerge-repo-dataflow.md`](./tauri-automerge-repo-dataflow.md): データフロー
