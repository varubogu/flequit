# TaskAssignment (タスク担当者関連付け) - task_assignments

## 概要

タスクと担当ユーザーの関連付けを管理するエンティティ。プロジェクト横断でのデータ管理のため、project_id を含む複合主キーで管理する。

## フィールド定義

| 論理名           | 物理名     | Rustでの型    | 説明                         | PK  | UK  | NN  | デフォルト値 | 外部キー    | PostgreSQL型 | SQLite型 | TypeScript型 |
| ---------------- | ---------- | ------------- | ---------------------------- | --- | --- | --- | ------------ | ----------- | ------------ | -------- | ------------ |
| プロジェクトID   | project_id | ProjectId     | プロジェクトID               | ✓   | -   | ✓   | -            | projects.id | UUID         | TEXT     | string       |
| タスクID         | task_id    | TaskId        | 担当タスクID                 | ✓   | -   | ✓   | -            | tasks.id    | UUID         | TEXT     | string       |
| ユーザーID       | user_id    | UserId        | 担当ユーザーID               | ✓   | -   | ✓   | -            | users.id    | UUID         | TEXT     | string       |
| 関連付け作成日時 | created_at | DateTime<Utc> | 関連付け作成日時（ISO 8601） | -   | -   | ✓   | -            | -           | TIMESTAMPTZ  | TEXT     | string       |

## 制約

- PRIMARY KEY: (project_id, task_id, user_id)
- FOREIGN KEY: project_id → projects.id
- FOREIGN KEY: task_id → tasks.id
- FOREIGN KEY: user_id → users.id
- NOT NULL: project_id, task_id, user_id, created_at

## インデックス

```sql
CREATE INDEX IF NOT EXISTS idx_task_assignments_project_id ON task_assignments(project_id);
CREATE INDEX IF NOT EXISTS idx_task_assignments_task_id ON task_assignments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_assignments_user_id ON task_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_task_assignments_created_at ON task_assignments(created_at);
```

## 関連テーブル

- projects: 所属プロジェクト
- tasks: 担当タスク
- users: 担当ユーザー

## 設計原則

### なぜ project_id が必要か

1. **タスクとユーザーはプロジェクトに所属**
   - tasks テーブルには project_id が存在
   - users テーブルもプロジェクト参加者として管理される
   - 関連付けテーブルにも project_id が必須

2. **プロジェクト横断でのデータ管理**
   - 複数プロジェクトのタスクとユーザーを扱う場合、project_id で特定が必要
   - ID衝突リスクの回避

3. **データ整合性の保証**
   - FOREIGN KEY 制約で projects テーブルとの整合性を保証
   - プロジェクトを跨いだ不正な関連付けを防止

## TypeScript での型定義

```typescript
interface TaskAssignment {
  projectId: string; // 必須
  taskId: string; // 必須
  userId: string; // 必須
  createdAt: Date;
}
```

## Service での使用例

```typescript
// 担当者割り当て操作では projectId が必須
async assignUserToTask(projectId: string, taskId: string, userId: string): Promise<void>
async unassignUserFromTask(projectId: string, taskId: string, userId: string): Promise<void>
async getUsersByTask(projectId: string, taskId: string): Promise<User[]>
```

## 備考

タスクとユーザーの多対多関係を管理。(project_id, task_id, user_id) の複合主キーで重複を防止し、プロジェクト横断でのデータ管理を可能にする。
