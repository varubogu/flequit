# Tag Bookmark (タグブックマーク) - user_tag_bookmarks

## 概要

サイドバーに固定表示するタグの管理エンティティ。**ユーザー設定**として管理され、同じユーザーの複数端末間で同期される。

## カテゴリ

- **分類**: `user_preferences`
- **同期対象**: 同じユーザーの他の端末のみ
- **Automergeドキュメント**: `/user_preferences/{user_id}/tag_bookmarks/{project_id}/{tag_id}`

## フィールド定義

| 論理名 | 物理名 | Rustでの型 | 説明 | PK | UK | NN | デフォルト値 | 外部キー | PostgreSQL型 | SQLite型 | TypeScript型 |
|--------|--------|-----------|------|----|----|----|-----------|---------|-----------|---------|-----------
| ID | id | TagBookmarkId | ブックマークID | ✓ | - | ✓ | UUID生成 | - | UUID | TEXT | string |
| ユーザーID | user_id | UserId | ユーザーID（現在は固定値） | - | ✓ | ✓ | "local_user" | - | UUID | TEXT | string |
| プロジェクトID | project_id | ProjectId | タグの所属プロジェクトID | - | ✓ | ✓ | - | projects.id | UUID | TEXT | string |
| タグID | tag_id | TagId | ブックマークするタグID | - | ✓ | ✓ | - | tags.id | UUID | TEXT | string |
| 表示順序 | order_index | i32 | サイドバー内での表示順序 | - | - | ✓ | 0 | - | INTEGER | INTEGER | number |
| 作成日時 | created_at | DateTime<Utc> | ブックマーク追加日時（ISO 8601） | - | - | ✓ | - | - | TIMESTAMPTZ | TEXT | Date |
| 更新日時 | updated_at | DateTime<Utc> | ブックマーク更新日時（ISO 8601） | - | - | ✓ | - | - | TIMESTAMPTZ | TEXT | Date |

## 制約

- **PRIMARY KEY**: `id`
- **UNIQUE KEY**: `(user_id, project_id, tag_id)` - 同じタグを重複してブックマークしない
- **FOREIGN KEY**: `project_id` → `projects.id` (ON DELETE CASCADE)
- **NOT NULL**: `id`, `user_id`, `project_id`, `tag_id`, `order_index`, `created_at`, `updated_at`

## インデックス

```sql
CREATE INDEX IF NOT EXISTS idx_user_tag_bookmarks_user_project
  ON user_tag_bookmarks(user_id, project_id, order_index);

CREATE INDEX IF NOT EXISTS idx_user_tag_bookmarks_tag
  ON user_tag_bookmarks(tag_id);
```

## SQLiteテーブル定義

```sql
CREATE TABLE user_tag_bookmarks (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL DEFAULT 'local_user',
    project_id TEXT NOT NULL,
    tag_id TEXT NOT NULL,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    UNIQUE(user_id, project_id, tag_id)
);

CREATE INDEX idx_user_tag_bookmarks_user_project
    ON user_tag_bookmarks(user_id, project_id, order_index);
CREATE INDEX idx_user_tag_bookmarks_tag
    ON user_tag_bookmarks(tag_id);
```

## Automergeドキュメント構造

```javascript
{
  "user_preferences": {
    "local_user": {  // user_id
      "tag_bookmarks": {
        "project-uuid-1": {  // project_id
          "tag-uuid-1": {    // tag_id
            "id": "bookmark-uuid-1",
            "project_id": "project-uuid-1",
            "tag_id": "tag-uuid-1",
            "order_index": 0,
            "created_at": "2024-01-01T00:00:00Z",
            "updated_at": "2024-01-01T00:00:00Z"
          },
          "tag-uuid-2": { ... }
        },
        "project-uuid-2": { ... }
      }
    }
  }
}
```

## 関連テーブル

- **projects**: タグが所属するプロジェクト
- **tags**: ブックマークされるタグ

## 設計上の重要な原則

### 1. ユーザー設定としての管理

**重要**: タグブックマークは**ユーザーの個人設定**であり、タグ自体の属性ではない。

#### 理由

1. **個人の作業環境**: ユーザーごとに異なるタグをブックマークする
2. **チーム共有の対象外**: プロジェクトメンバー間で共有しない
3. **並び順の管理**: ユーザーごとに異なる並び順を保持
4. **複数端末間の同期**: 同じユーザーの他の端末でも同じブックマーク状態

#### 誤った設計例

```typescript
// ❌ 悪い例: Tagエンティティに個人設定を含める
interface Tag {
  id: string;
  name: string;
  isBookmarked: boolean;  // これは個人設定
}
```

```typescript
// ✅ 良い例: 分離されたエンティティ
interface Tag {
  id: string;
  name: string;
  // ブックマーク情報は含まない
}

interface TagBookmark {
  id: string;
  userId: string;
  projectId: string;
  tagId: string;
  orderIndex: number;
}
```

### 2. プロジェクトスコープ

タグはプロジェクトに所属するため、ブックマークもプロジェクトIDを持つ：

```typescript
// プロジェクトごとに異なるタグをブックマーク可能
const bookmarks = [
  { userId: 'user1', projectId: 'proj1', tagId: 'tag-urgent' },
  { userId: 'user1', projectId: 'proj2', tagId: 'tag-important' }
];
```

### 3. 表示順序の管理

- サイドバー内でのドラッグ&ドロップによる並び替えに使用
- プロジェクト横断での順序を管理
- `order_index`は0から始まる連番

#### 並び替えのアルゴリズム

```typescript
// タグをドロップした位置に移動
function reorderBookmark(
  bookmarks: TagBookmark[],
  fromIndex: number,
  toIndex: number
): TagBookmark[] {
  const [moved] = bookmarks.splice(fromIndex, 1);
  bookmarks.splice(toIndex, 0, moved);

  // order_indexを更新
  return bookmarks.map((b, index) => ({
    ...b,
    orderIndex: index,
    updatedAt: new Date()
  }));
}
```

## TypeScriptでの型定義

```typescript
// エンティティ定義
interface TagBookmark {
  id: string;
  userId: string;
  projectId: string;
  tagId: string;
  orderIndex: number;
  createdAt: Date;
  updatedAt: Date;
}

// ストアでの管理
class TagBookmarkStore {
  bookmarks = $state<TagBookmark[]>([]);

  // プロジェクトIDでフィルタリング
  getByProject(projectId: string): TagBookmark[] {
    return this.bookmarks
      .filter(b => b.projectId === projectId)
      .sort((a, b) => a.orderIndex - b.orderIndex);
  }

  // タグがブックマーク済みか確認
  isBookmarked(projectId: string, tagId: string): boolean {
    return this.bookmarks.some(
      b => b.projectId === projectId && b.tagId === tagId
    );
  }
}
```

## サービスでの使用例

### TypeScript

```typescript
// TagBookmarkService
class TagBookmarkService {
  // ブックマーク追加
  async addBookmark(projectId: string, tagId: string): Promise<void> {
    const userId = getCurrentUserId(); // "local_user"
    const maxOrder = await this.getMaxOrderIndex(userId, projectId);

    const bookmark: TagBookmark = {
      id: crypto.randomUUID(),
      userId,
      projectId,
      tagId,
      orderIndex: maxOrder + 1,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // 楽観的更新
    tagBookmarkStore.addBookmark(bookmark);

    try {
      // バックエンド同期
      await invoke('add_tag_bookmark', { bookmark });
    } catch (error) {
      // ロールバック
      tagBookmarkStore.removeBookmark(bookmark.id);
      throw error;
    }
  }

  // ブックマーク削除
  async removeBookmark(projectId: string, tagId: string): Promise<void> {
    const bookmark = tagBookmarkStore.findByProjectAndTag(projectId, tagId);
    if (!bookmark) return;

    // 楽観的更新
    tagBookmarkStore.removeBookmark(bookmark.id);

    try {
      await invoke('remove_tag_bookmark', {
        bookmarkId: bookmark.id
      });
    } catch (error) {
      // ロールバック
      tagBookmarkStore.addBookmark(bookmark);
      throw error;
    }
  }

  // 並び替え
  async reorderBookmarks(
    projectId: string,
    fromIndex: number,
    toIndex: number
  ): Promise<void> {
    const bookmarks = tagBookmarkStore.getByProject(projectId);
    const reordered = reorderBookmark(bookmarks, fromIndex, toIndex);

    // 楽観的更新
    tagBookmarkStore.updateBulk(reordered);

    try {
      await invoke('reorder_tag_bookmarks', {
        bookmarks: reordered
      });
    } catch (error) {
      // ロールバック
      tagBookmarkStore.updateBulk(bookmarks);
      throw error;
    }
  }
}
```

### Rust

```rust
// サービス層
pub async fn add_tag_bookmark<R>(
    repositories: &R,
    user_id: &UserId,
    project_id: &ProjectId,
    tag_id: &TagId,
) -> Result<TagBookmark, ServiceError>
where
    R: InfrastructureRepositoriesTrait,
{
    // 既存確認
    if let Some(_) = repositories
        .tag_bookmark()
        .find_by_user_project_tag(user_id, project_id, tag_id)
        .await?
    {
        return Err(ServiceError::AlreadyExists(
            "Tag bookmark already exists".to_string()
        ));
    }

    // 最大order_indexを取得
    let max_order = repositories
        .tag_bookmark()
        .get_max_order_index(user_id, project_id)
        .await?;

    let bookmark = TagBookmark {
        id: TagBookmarkId::new(),
        user_id: user_id.clone(),
        project_id: project_id.clone(),
        tag_id: tag_id.clone(),
        order_index: max_order + 1,
        created_at: Utc::now(),
        updated_at: Utc::now(),
    };

    // SQLite + Automerge 両方に保存
    repositories.tag_bookmark().create(&bookmark).await?;

    Ok(bookmark)
}
```

## データフロー

### ブックマーク追加フロー

```
UI (sidebar-tag-list-controller)
  ↓ クリック
TagBookmarkOperations.addBookmark(projectId, tagId)
  ↓
TagBookmarkService.addBookmark(projectId, tagId)
  ↓
1. ローカルストア更新 (楽観的更新)
  ↓
2. Tauriコマンド呼び出し
  ↓
add_tag_bookmark(user_id, project_id, tag_id)
  ↓
並列実行:
  ├─ SQLite: INSERT into user_tag_bookmarks
  └─ Automerge: /user_preferences/{user_id}/tag_bookmarks/{project_id}/{tag_id}
  ↓
成功 or エラー時ロールバック
```

### 初期化フロー（アプリ起動時）

```
App起動
  ↓
TagBookmarkService.initializeBookmarks()
  ↓
Tauriコマンド: list_tag_bookmarks(user_id)
  ↓
SQLiteから読み込み（高速）
  ↓
TagBookmarkStore.setBookmarks(bookmarks)
  ↓
UIに反映
  ↓
(バックグラウンド) Automergeと同期
```

## マイグレーション

### 既存データからの移行

現在の実装には永続化されたデータがないため、マイグレーション不要。

将来、`Tag.is_bookmarked`のような実装があった場合：

```sql
-- 移行SQL（参考）
INSERT INTO user_tag_bookmarks (id, user_id, project_id, tag_id, order_index, created_at, updated_at)
SELECT
    lower(hex(randomblob(16))),
    'local_user',
    project_id,
    id,
    0,  -- order_indexは後で再設定
    created_at,
    datetime('now')
FROM tags
WHERE is_bookmarked = 1;
```

## テスト戦略

### ユニットテスト

```typescript
describe('TagBookmarkService', () => {
  it('should add bookmark', async () => {
    const service = new TagBookmarkService();
    await service.addBookmark('proj1', 'tag1');

    expect(store.isBookmarked('proj1', 'tag1')).toBe(true);
  });

  it('should prevent duplicate bookmarks', async () => {
    const service = new TagBookmarkService();
    await service.addBookmark('proj1', 'tag1');

    await expect(
      service.addBookmark('proj1', 'tag1')
    ).rejects.toThrow('Already exists');
  });

  it('should reorder bookmarks', async () => {
    const service = new TagBookmarkService();
    await service.addBookmark('proj1', 'tag1');
    await service.addBookmark('proj1', 'tag2');
    await service.addBookmark('proj1', 'tag3');

    await service.reorderBookmarks('proj1', 0, 2);

    const bookmarks = store.getByProject('proj1');
    expect(bookmarks[0].tagId).toBe('tag2');
    expect(bookmarks[1].tagId).toBe('tag3');
    expect(bookmarks[2].tagId).toBe('tag1');
  });
});
```

## 備考

### user_idについて

- 現在は固定値 `"local_user"` を使用
- 将来のマルチデバイス対応時に活用予定
- デバイスIDやクラウド認証との連携を検討中

### 削除時の動作

- **カスケード削除**: プロジェクトが削除されると、関連するブックマークも自動削除
- **タグ削除**: タグが削除されても、ブックマークは残る（UIで非表示）

### パフォーマンス最適化

1. **インデックス**: `(user_id, project_id, order_index)`で高速ソート
2. **初期化**: アプリ起動時に全ブックマークを一括読み込み
3. **キャッシュ**: ストアでメモリキャッシュ

## 関連ドキュメント

- [User Preferences カテゴリ](../user-preferences.md)
- [Tag エンティティ](../projects/tag.md)
- [Automerge構造](../automerge-structure.md)
