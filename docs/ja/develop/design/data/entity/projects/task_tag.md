# TaskTag (タスクタグ関連付け) - task_tags

## 概要

タスクとタグの関連付けを管理するエンティティ。プロジェクト横断でのデータ管理のため、project_id を含む複合主キーで管理する。

## フィールド定義

| 論理名           | 物理名     | Rustでの型    | 説明                         | PK  | UK  | NN  | デフォルト値 | 外部キー    | PostgreSQL型 | SQLite型 | TypeScript型 |
| ---------------- | ---------- | ------------- | ---------------------------- | --- | --- | --- | ------------ | ----------- | ------------ | -------- | ------------ |
| プロジェクトID   | project_id | ProjectId     | プロジェクトID               | ✓   | -   | ✓   | -            | projects.id | UUID         | TEXT     | string       |
| タスクID         | task_id    | TaskId        | タグ付きタスクID             | ✓   | -   | ✓   | -            | tasks.id    | UUID         | TEXT     | string       |
| タグID           | tag_id     | TagId         | 適用タグID                   | ✓   | -   | ✓   | -            | tags.id     | UUID         | TEXT     | string       |
| 関連付け作成日時 | created_at | DateTime<Utc> | 関連付け作成日時（ISO 8601） | -   | -   | ✓   | -            | -           | TIMESTAMPTZ  | TEXT     | string       |

## 制約

- PRIMARY KEY: (project_id, task_id, tag_id)
- FOREIGN KEY: project_id → projects.id
- FOREIGN KEY: task_id → tasks.id
- FOREIGN KEY: tag_id → tags.id
- NOT NULL: project_id, task_id, tag_id, created_at

## インデックス

```sql
CREATE INDEX IF NOT EXISTS idx_task_tags_project_id ON task_tags(project_id);
CREATE INDEX IF NOT EXISTS idx_task_tags_task_id ON task_tags(task_id);
CREATE INDEX IF NOT EXISTS idx_task_tags_tag_id ON task_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_task_tags_created_at ON task_tags(created_at);
```

## 関連テーブル

- projects: 所属プロジェクト
- tasks: タグ付きタスク
- tags: 適用タグ

## 設計原則

### なぜ project_id が必要か

1. **タスクとタグはプロジェクトに所属**
   - tasks テーブルには project_id が存在
   - tags テーブルにも project_id が存在
   - 関連付けテーブルにも project_id が必須

2. **プロジェクト横断でのデータ管理**
   - 複数プロジェクトのタスクとタグを扱う場合、project_id で特定が必要
   - ID衝突リスクの回避

3. **データ整合性の保証**
   - FOREIGN KEY 制約で projects テーブルとの整合性を保証
   - プロジェクトを跨いだ不正な関連付けを防止

## TypeScript での型定義

```typescript
interface TaskTag {
  projectId: string; // 必須
  taskId: string; // 必須
  tagId: string; // 必須
  createdAt: Date;
}
```

## Service での使用例

```typescript
// タグ付け操作では projectId が必須
async addTagToTask(projectId: string, taskId: string, tagId: string): Promise<void>
async removeTagFromTask(projectId: string, taskId: string, tagId: string): Promise<void>
async getTagsByTask(projectId: string, taskId: string): Promise<Tag[]>
```

## 備考

タスクとタグの多対多関係を管理。(project_id, task_id, tag_id) の複合主キーで重複を防止し、プロジェクト横断でのデータ管理を可能にする。
