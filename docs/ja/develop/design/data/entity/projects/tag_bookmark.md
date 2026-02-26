# Tag Bookmark (タグブックマーク) - tag_bookmarks

## 概要

サイドバーに固定表示するタグの管理エンティティ。プロジェクトを横断してブックマークされたタグを一覧表示するために、(project_id, tag_id) のペアで管理する。

## フィールド定義

| 論理名         | 物理名      | Rustでの型    | 説明                             | PK  | UK  | NN  | デフォルト値 | 外部キー    | PostgreSQL型 | SQLite型 | TypeScript型 |
| -------------- | ----------- | ------------- | -------------------------------- | --- | --- | --- | ------------ | ----------- | ------------ | -------- | ------------ |
| プロジェクトID | project_id  | ProjectId     | タグの所属プロジェクトID         | ✓   | -   | ✓   | -            | projects.id | UUID         | TEXT     | string       |
| タグID         | tag_id      | TagId         | ブックマークするタグID           | ✓   | -   | ✓   | -            | tags.id     | UUID         | TEXT     | string       |
| 表示順序       | order_index | i32           | サイドバー内での表示順序         | -   | -   | ✓   | 0            | -           | INTEGER      | INTEGER  | number       |
| 作成日時       | created_at  | DateTime<Utc> | ブックマーク追加日時（ISO 8601） | -   | -   | ✓   | -            | -           | TIMESTAMPTZ  | TEXT     | string       |

## 制約

- PRIMARY KEY: (project_id, tag_id) - 複合主キー
- FOREIGN KEY: project_id → projects.id
- FOREIGN KEY: tag_id → tags.id
- NOT NULL: project_id, tag_id, order_index, created_at

## インデックス

```sql
-- 複合主キーで自動作成: (project_id, tag_id)
CREATE INDEX IF NOT EXISTS idx_tag_bookmarks_order_index ON tag_bookmarks(order_index);
CREATE INDEX IF NOT EXISTS idx_tag_bookmarks_created_at ON tag_bookmarks(created_at);
```

## 関連テーブル

- projects: タグが所属するプロジェクト
- tags: ブックマークされるタグ

## 設計上の重要な原則

### なぜ (project_id, tag_id) のペアが必要か

1. **タグはプロジェクトに所属する**
   - tags テーブルには必ず project_id が存在する
   - 異なるプロジェクトで同じ tag_id が存在する可能性がある（UUID衝突は理論上ゼロだが、設計上の明確性のため）

2. **プロジェクト横断表示のため**
   - サイドバーには複数プロジェクトのブックマークタグが混在して表示される
   - どのプロジェクトのタグか特定するために project_id が必須

3. **データ整合性**
   - tag_id のみではどのプロジェクトのタグか不明
   - FOREIGN KEY 制約で tags テーブルとの整合性を保証

### 表示順序 (order_index) について

- サイドバー内でのドラッグ&ドロップによる並び替えに使用
- プロジェクト横断での順序を管理
- 0から始まる連番

## TypeScript での型定義

```typescript
interface TagBookmark {
  projectId: string; // 必須
  tagId: string; // 必須
  orderIndex: number;
  createdAt: Date;
}

// Store での管理
class TagBookmarkStore {
  // Map<tagId, projectId> で管理
  bookmarkedTags = $state<Map<string, string>>(new Map());

  addBookmark(projectId: string, tagId: string) {
    this.bookmarkedTags.set(tagId, projectId);
  }

  getProjectIdByTagId(tagId: string): string | undefined {
    return this.bookmarkedTags.get(tagId);
  }

  isBookmarked(tagId: string): boolean {
    return this.bookmarkedTags.has(tagId);
  }
}
```

## Service での使用例

```typescript
// TagService
async addBookmark(projectId: string, tagId: string) {
  // projectId は必須パラメータ
  await tagStoreFacade.addBookmark(projectId, tagId);
}

async updateTag(projectId: string, tagId: string, updates: Partial<Tag>) {
  // すべてのタグ操作で projectId は必須
}

async deleteTag(projectId: string, tagId: string, onDelete?: (tagId: string) => void) {
  // 削除時も projectId が必要
}
```

## 備考

### 一般原則: projectId 必須ルール

**すべてのID系パラメータ（taskListId, taskId, subTaskId, tagId、関連付け系）が必要な処理では、projectId もセットで必要**

理由:

1. すべてのエンティティはプロジェクトに所属する
2. プロジェクト横断でデータを扱う場合、ID衝突を防ぐ
3. タスクから projectId が取得できる（逆引き可能）

適用箇所:

- タグのCRUD操作
- タグのブックマーク
- タスクのタグ付け
- サブタスクのタグ付け
- その他すべてのエンティティ操作

例外:

- プロジェクトIDからの逆引き: `getProjectIdByTagId(tagId)` などは例外的に projectId 不要
