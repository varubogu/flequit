# SubtaskTag (サブタスクタグ関連付け) - subtask_tags

## Overview

Entity for managing associations between subtasks and tags. Managed with composite primary key including project_id for cross-project data management.

## Field Definitions

| Logical Name           | Physical Name | Rust Type     | Description                               | PK  | UK  | NN  | Default Value | Foreign Key | PostgreSQL Type | SQLite Type | TypeScript Type |
| ---------------------- | ------------- | ------------- | ----------------------------------------- | --- | --- | --- | ------------- | ----------- | --------------- | ----------- | --------------- |
| Project ID             | project_id    | ProjectId     | Project ID                                | ✓   | -   | ✓   | -             | projects.id | UUID            | TEXT        | string          |
| SubTask ID             | subtask_id    | SubTaskId     | Tagged subtask ID                         | ✓   | -   | ✓   | -             | subtasks.id | UUID            | TEXT        | string          |
| Tag ID                 | tag_id        | TagId         | Applied tag ID                            | ✓   | -   | ✓   | -             | tags.id     | UUID            | TEXT        | string          |
| Association Created At | created_at    | DateTime<Utc> | Association creation timestamp (ISO 8601) | -   | -   | ✓   | -             | -           | TIMESTAMPTZ     | TEXT        | string          |

## Constraints

- PRIMARY KEY: (project_id, subtask_id, tag_id)
- FOREIGN KEY: project_id → projects.id
- FOREIGN KEY: subtask_id → subtasks.id
- FOREIGN KEY: tag_id → tags.id
- NOT NULL: project_id, subtask_id, tag_id, created_at

## Indexes

```sql
CREATE INDEX IF NOT EXISTS idx_subtask_tags_project_id ON subtask_tags(project_id);
CREATE INDEX IF NOT EXISTS idx_subtask_tags_subtask_id ON subtask_tags(subtask_id);
CREATE INDEX IF NOT EXISTS idx_subtask_tags_tag_id ON subtask_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_subtask_tags_created_at ON subtask_tags(created_at);
```

## Related Tables

- projects: Associated project
- subtasks: Tagged subtask
- tags: Applied tag

## Design Principles

### Why project_id is Required

1. **SubTasks and Tags Belong to Projects**
   - project_id exists in subtasks table
   - project_id also exists in tags table
   - project_id is mandatory in association tables

2. **Cross-Project Data Management**
   - When handling subtasks and tags across multiple projects, project_id is needed for identification
   - Avoids ID collision risks

3. **Data Integrity Guarantee**
   - Ensures integrity with projects table through FOREIGN KEY constraints
   - Prevents invalid associations across projects

## TypeScript Type Definition

```typescript
interface SubtaskTag {
  projectId: string; // Required
  subtaskId: string; // Required
  tagId: string; // Required
  createdAt: Date;
}
```

## Service Usage Example

```typescript
// projectId is required for tagging operations
async addTagToSubtask(projectId: string, subtaskId: string, tagId: string): Promise<void>
async removeTagFromSubtask(projectId: string, subtaskId: string, tagId: string): Promise<void>
async getTagsBySubtask(projectId: string, subtaskId: string): Promise<Tag[]>
```

## Notes

Manages many-to-many relationship between subtasks and tags. Prevents duplicates with composite primary key (project_id, subtask_id, tag_id) and enables cross-project data management.
