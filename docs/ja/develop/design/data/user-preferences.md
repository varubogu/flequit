# User Preferences（ユーザー設定）

## 概要

ユーザーの個人作業環境設定を管理するカテゴリ。プロジェクトデータ（チーム共有）とは独立し、同じユーザーの複数端末間でのみ同期される。

## 位置づけ

### データカテゴリの分類

| カテゴリ | 目的 | 同期対象 | Automerge | 例 |
|---------|------|---------|-----------|-----|
| `accounts` | 認証情報 | - | なし | ユーザープロフィール |
| `user_preferences` | 個人作業環境 | 同じユーザーの他端末 | あり | タグブックマーク、UI設定 |
| `projects` | プロジェクトデータ | チームメンバー全員 | あり | タスク、タグ、プロジェクト |

### user_preferences の特徴

1. **個人専用**: 他のユーザーとは共有しない
2. **端末間同期**: 同じユーザーの複数端末で同期
3. **プロジェクト依存**: 多くの設定はプロジェクトIDをキーとして管理
4. **ローカル永続化**: SQLite + Automerge

## Automergeドキュメント構造

```
/user_preferences/{user_id}
  ├── tag_bookmarks/                    # タグブックマーク
  │   ├── {project_id}/
  │   │   ├── {tag_id_1}/
  │   │   │   ├── id: string
  │   │   │   ├── project_id: string
  │   │   │   ├── tag_id: string
  │   │   │   ├── order_index: number
  │   │   │   ├── created_at: timestamp
  │   │   │   └── updated_at: timestamp
  │   │   └── {tag_id_2}/...
  │   └── {another_project_id}/...
  │
  ├── view_preferences/                 # ビュー設定（将来）
  │   ├── {project_id}/
  │   │   ├── task_list_columns/        # カラム幅・表示/非表示
  │   │   ├── default_sort/             # デフォルトソート
  │   │   └── saved_filters/            # 保存したフィルター
  │   └── ...
  │
  ├── sidebar_state/                    # サイドバー状態（将来）
  │   ├── collapsed: boolean
  │   ├── width: number
  │   └── pinned_items: string[]
  │
  └── ui_settings/                      # UI設定（将来）
      ├── theme: string
      ├── language: string
      └── date_format: string
```

## 現在実装されているエンティティ

### Tag Bookmark（タグブックマーク）

詳細は [tag_bookmark.md](./entity/user_preferences/tag_bookmark.md) を参照。

#### 概要
サイドバーに固定表示するタグの管理。

#### 主要フィールド
- `project_id`: タグの所属プロジェクト
- `tag_id`: ブックマークするタグ
- `order_index`: 表示順序
- `created_at`, `updated_at`: タイムスタンプ

## 同期戦略

### SQLiteとAutomergeの使い分け

1. **SQLite**: 高速な読み取りとクエリ
   - 初期化時の一括読み込み
   - 並び替えやフィルタリング

2. **Automerge**: 複数端末間の同期
   - 変更の履歴管理
   - 競合解決（CRDT）

### 同期フロー

```
端末A                                    端末B
  ↓ 設定変更
SQLite更新 + Automergeドキュメント更新
  ↓
同期サーバー（将来実装）
  ↓
                                   ← Automergeドキュメント受信
                                   ← SQLite更新
```

## user_idの扱い

### 現在の実装
- `user_id`は固定値: `"local_user"`
- 単一ユーザー環境を想定

### 将来の拡張
複数デバイスで同じユーザーを識別するため、以下を検討：
- デバイスIDベースの識別
- クラウド認証との連携

## 設計原則

### 1. プロジェクト依存の設定
多くの設定はプロジェクトIDをキーとして管理：
```typescript
// 良い例
interface TagBookmark {
  projectId: string;  // 必須
  tagId: string;
  orderIndex: number;
}

// 悪い例（プロジェクト情報がない）
interface TagBookmark {
  tagId: string;  // どのプロジェクトのタグか不明
  orderIndex: number;
}
```

### 2. Automergeパスの一貫性
階層構造を保つ：
```
/user_preferences/{user_id}/{category}/{project_id}/{entity_id}
```

### 3. SQLiteとAutomergeの整合性
- 両方に同じデータを保存
- SQLiteは読み取り最適化
- Automergeは同期最適化

## 拡張計画

### 優先度: 高
- **タグブックマーク**: 実装済み
- **サイドバー状態**: 開閉状態、幅

### 優先度: 中
- **ビュー設定**: カラム幅、ソート順、フィルター
- **UI設定**: テーマ、言語

### 優先度: 低
- **キーボードショートカット**: カスタマイズ
- **通知設定**: 通知ON/OFF

## 実装ガイドライン

### 新しいエンティティを追加する場合

1. **ドキュメント作成**
   - `docs/ja/develop/design/data/entity/user_preferences/{entity_name}.md`
   - `docs/en/develop/design/data/entity/user_preferences/{entity_name}.md`

2. **Rustモデル作成**
   ```
   src-tauri/crates/
     ├── flequit-model/src/models/user_preferences/{entity_name}.rs
     ├── flequit-infrastructure-sqlite/src/models/user_preferences/{entity_name}.rs
     └── flequit-infrastructure-automerge/src/models/user_preferences/{entity_name}.rs
   ```

3. **TypeScript型定義**
   ```
   src/lib/types/user-preferences/{entity-name}.ts
   ```

4. **サービス実装**
   - Rustサービス: `src-tauri/crates/flequit-core/src/services/user_preferences/`
   - TypeScriptサービス: `src/lib/services/domain/user-preferences/`

5. **ストア実装**
   ```
   src/lib/stores/user-preferences/{entity-name}-store.svelte.ts
   ```

## 関連ドキュメント

- [Tag Bookmark エンティティ](./entity/user_preferences/tag_bookmark.md)
- [Automerge構造](./automerge-structure.md)
- [データフロー](./tauri-automerge-repo-dataflow.md)
