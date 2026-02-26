# SubtaskTag (サブタスクタグ関連付け) - subtask_tags

## 概要

サブタスクとタグの関連付けを管理するエンティティ。プロジェクト横断でのデータ管理のため、project_id を含む複合主キーで管理する。

## フィールド定義

| 論理名           | 物理名     | Rustでの型    | 説明                         | PK  | UK  | NN  | デフォルト値 | 外部キー    | PostgreSQL型 | SQLite型 | TypeScript型 |
| ---------------- | ---------- | ------------- | ---------------------------- | --- | --- | --- | ------------ | ----------- | ------------ | -------- | ------------ |
| プロジェクトID   | project_id | ProjectId     | プロジェクトID               | ✓   | -   | ✓   | -            | projects.id | UUID         | TEXT     | string       |
| サブタスクID     | subtask_id | SubTaskId     | タグ付きサブタスクID         | ✓   | -   | ✓   | -            | subtasks.id | UUID         | TEXT     | string       |
| タグID           | tag_id     | TagId         | 適用タグID                   | ✓   | -   | ✓   | -            | tags.id     | UUID         | TEXT     | string       |
| 関連付け作成日時 | created_at | DateTime<Utc> | 関連付け作成日時（ISO 8601） | -   | -   | ✓   | -            | -           | TIMESTAMPTZ  | TEXT     | string       |

## 制約

- PRIMARY KEY: (project_id, subtask_id, tag_id)
- FOREIGN KEY: project_id → projects.id
- FOREIGN KEY: subtask_id → subtasks.id
- FOREIGN KEY: tag_id → tags.id
- NOT NULL: project_id, subtask_id, tag_id, created_at

## インデックス

```sql
CREATE INDEX IF NOT EXISTS idx_subtask_tags_project_id ON subtask_tags(project_id);
CREATE INDEX IF NOT EXISTS idx_subtask_tags_subtask_id ON subtask_tags(subtask_id);
CREATE INDEX IF NOT EXISTS idx_subtask_tags_tag_id ON subtask_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_subtask_tags_created_at ON subtask_tags(created_at);
```

## 関連テーブル

- projects: 所属プロジェクト
- subtasks: タグ付きサブタスク
- tags: 適用タグ

## 設計原則

### なぜ project_id が必要か

1. **サブタスクとタグはプロジェクトに所属**
   - subtasks テーブルには project_id が存在
   - tags テーブルにも project_id が存在
   - 関連付けテーブルにも project_id が必須

2. **プロジェクト横断でのデータ管理**
   - 複数プロジェクトのサブタスクとタグを扱う場合、project_id で特定が必要
   - ID衝突リスクの回避

3. **データ整合性の保証**
   - FOREIGN KEY 制約で projects テーブルとの整合性を保証
   - プロジェクトを跨いだ不正な関連付けを防止

## TypeScript での型定義

```typescript
interface SubtaskTag {
  projectId: string; // 必須
  subtaskId: string; // 必須
  tagId: string; // 必須
  createdAt: Date;
}
```

## Service での使用例

```typescript
// タグ付け操作では projectId が必須
async addTagToSubtask(projectId: string, subtaskId: string, tagId: string): Promise<void>
async removeTagFromSubtask(projectId: string, subtaskId: string, tagId: string): Promise<void>
async getTagsBySubtask(projectId: string, subtaskId: string): Promise<Tag[]>
```

## 備考

サブタスクとタグの多対多関係を管理。(project_id, subtask_id, tag_id) の複合主キーで重複を防止し、プロジェクト横断でのデータ管理を可能にする。
