# TaskTag (タスクタグ関連付け) - task_tags

## Overview
Entity for managing associations between tasks and tags. Managed with composite primary key including project_id for cross-project data management.

## Field Definitions

| Logical Name | Physical Name | Rust Type | Description | PK | UK | NN | Default Value | Foreign Key | PostgreSQL Type | SQLite Type | TypeScript Type |
|--------------|---------------|-----------|-------------|----|----|----|---------------|-------------|-----------------|-------------|-----------------|
| Project ID | project_id | ProjectId | Project ID | ✓ | - | ✓ | - | projects.id | UUID | TEXT | string |
| Task ID | task_id | TaskId | Tagged task ID | ✓ | - | ✓ | - | tasks.id | UUID | TEXT | string |
| Tag ID | tag_id | TagId | Applied tag ID | ✓ | - | ✓ | - | tags.id | UUID | TEXT | string |
| Association Created At | created_at | DateTime<Utc> | Association creation timestamp (ISO 8601) | - | - | ✓ | - | - | TIMESTAMPTZ | TEXT | string |

## Constraints
- PRIMARY KEY: (project_id, task_id, tag_id)
- FOREIGN KEY: project_id → projects.id
- FOREIGN KEY: task_id → tasks.id
- FOREIGN KEY: tag_id → tags.id
- NOT NULL: project_id, task_id, tag_id, created_at

## Indexes
```sql
CREATE INDEX IF NOT EXISTS idx_task_tags_project_id ON task_tags(project_id);
CREATE INDEX IF NOT EXISTS idx_task_tags_task_id ON task_tags(task_id);
CREATE INDEX IF NOT EXISTS idx_task_tags_tag_id ON task_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_task_tags_created_at ON task_tags(created_at);
```

## Related Tables
- projects: Associated project
- tasks: Tagged task
- tags: Applied tag

## Design Principles

### Why project_id is Required

1. **Tasks and Tags Belong to Projects**
   - project_id exists in tasks table
   - project_id also exists in tags table
   - project_id is mandatory in association tables

2. **Cross-Project Data Management**
   - When handling tasks and tags across multiple projects, project_id is needed for identification
   - Avoids ID collision risks

3. **Data Integrity Guarantee**
   - Ensures integrity with projects table through FOREIGN KEY constraints
   - Prevents invalid associations across projects

## TypeScript Type Definition

```typescript
interface TaskTag {
  projectId: string;  // Required
  taskId: string;     // Required
  tagId: string;      // Required
  createdAt: Date;
}
```

## Service Usage Example

```typescript
// projectId is required for tagging operations
async addTagToTask(projectId: string, taskId: string, tagId: string): Promise<void>
async removeTagFromTask(projectId: string, taskId: string, tagId: string): Promise<void>
async getTagsByTask(projectId: string, taskId: string): Promise<Tag[]>
```

## Notes
Manages many-to-many relationship between tasks and tags. Prevents duplicates with composite primary key (project_id, task_id, tag_id) and enables cross-project data management.
