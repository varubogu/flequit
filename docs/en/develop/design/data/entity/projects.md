# Project Entity Definitions

Defines all entities related to projects, tasks, subtasks, tags, members, and recurrence. See `_template.md` for the common format.

## Project — projects

**Role**: Core project management entity. Parent container for tasks and members.

### Fields

| Logical name | Physical name | Rust type | Constraints | Default | Foreign key | Description |
| --- | --- | --- | --- | --- | --- | --- |
| Project ID | id | ProjectId | PK, NN | - | - | Unique identifier |
| Project name | name | String | NN | - | - | - |
| Description | description | Option\<String\> | - | NULL | - | - |
| Color | color | Option\<String\> | - | NULL | - | - |
| Display order | order_index | i32 | NN | 0 | - | - |
| Archived state | is_archived | bool | NN | false | - | - |
| Status | status | Option\<String\> | - | NULL | - | - |
| Owner ID | owner_id | Option\<UserId\> | - | NULL | users.id | - |
| Created at | created_at | DateTime\<Utc\> | NN | - | - | - |
| Updated at | updated_at | DateTime\<Utc\> | NN | - | - | - |

### Constraints

- PRIMARY KEY: `id`
- FOREIGN KEY: `owner_id -> users.id`
- NOT NULL: `id, name, order_index, is_archived, created_at, updated_at`

### Indexed Columns

`owner_id`, `order_index`, `created_at`

### Relations

- task_lists, tasks, tags, members

---

## TaskList — task_lists

**Role**: List that categorizes tasks within a project. Used for Kanban columns, GTD lists, and similar groupings.

### Fields

| Logical name | Physical name | Rust type | Constraints | Default | Foreign key | Description |
| --- | --- | --- | --- | --- | --- | --- |
| ID | id | TaskListId | PK, NN | - | - | - |
| Project ID | project_id | ProjectId | NN | - | projects.id | - |
| Name | name | String | NN | - | - | - |
| Description | description | Option\<String\> | - | NULL | - | - |
| Display order | order_index | i32 | NN | 0 | - | - |
| Archived state | is_archived | bool | NN | false | - | - |
| Created at | created_at | DateTime\<Utc\> | NN | - | - | - |
| Updated at | updated_at | DateTime\<Utc\> | NN | - | - | - |

### Constraints

- PRIMARY KEY: `id`
- FOREIGN KEY: `project_id -> projects.id`
- NOT NULL: `id, project_id, name, order_index, is_archived, created_at, updated_at`

### Indexed Columns

`project_id`, `order_index`, `created_at`

### Relations

- projects, tasks

### Notes

Tasks may also belong directly to a project without a task list.

---

## Task — tasks

**Role**: Core task management entity. Holds work item details and state.

### Fields

| Logical name | Physical name | Rust type | Constraints | Default | Foreign key | Description |
| --- | --- | --- | --- | --- | --- | --- |
| Task ID | id | TaskId | PK, NN | - | - | - |
| Project ID | project_id | ProjectId | NN | - | projects.id | - |
| Task list ID | task_list_id | Option\<TaskListId\> | - | NULL | task_lists.id | Optional |
| Title | title | String | NN | - | - | - |
| Description | description | Option\<String\> | - | NULL | - | - |
| Status | status | String | NN | "Todo" | - | - |
| Priority | priority | String | NN | "Medium" | - | - |
| Importance | importance | String | NN | "Medium" | - | - |
| Due date | due_date | Option\<DateTime\<Utc\>\> | - | NULL | - | - |
| Planned start date | plan_start_date | Option\<DateTime\<Utc\>\> | - | NULL | - | - |
| Planned end date | plan_end_date | Option\<DateTime\<Utc\>\> | - | NULL | - | - |
| Actual start date | do_start_date | Option\<DateTime\<Utc\>\> | - | NULL | - | - |
| Actual end date | do_end_date | Option\<DateTime\<Utc\>\> | - | NULL | - | - |
| Display order | order_index | i32 | NN | 0 | - | - |
| Archived state | is_archived | bool | NN | false | - | - |
| Created at | created_at | DateTime\<Utc\> | NN | - | - | - |
| Updated at | updated_at | DateTime\<Utc\> | NN | - | - | - |

### Constraints

- PRIMARY KEY: `id`
- FOREIGN KEY: `project_id -> projects.id`, `task_list_id -> task_lists.id`
- NOT NULL: `id, project_id, title, status, priority, importance, order_index, is_archived, created_at, updated_at`

### Indexed Columns

`project_id`, `task_list_id`, `status`, `due_date`, `order_index`, `created_at`

### Relations

- projects, task_lists, subtasks, task_assignments, task_tags, task_recurrences

### Notes

Date management separates planned values (`plan`) from actual values (`do`).

---

## SubTask — subtasks

**Role**: Work item that breaks down a task. Belongs to a parent task and has its own completion state and status.

### Fields

| Logical name | Physical name | Rust type | Constraints | Default | Foreign key | Description |
| --- | --- | --- | --- | --- | --- | --- |
| Subtask ID | id | SubTaskId | PK, NN | - | - | - |
| Task ID | task_id | TaskId | NN | - | tasks.id | Parent task |
| Title | title | String | NN | - | - | - |
| Description | description | Option\<String\> | - | NULL | - | - |
| Status | status | String | NN | "not_started" | - | - |
| Priority | priority | Option\<i32\> | - | NULL | - | - |
| Planned start date | plan_start_date | Option\<DateTime\<Utc\>\> | - | NULL | - | - |
| Planned end date | plan_end_date | Option\<DateTime\<Utc\>\> | - | NULL | - | - |
| Actual start date | do_start_date | Option\<DateTime\<Utc\>\> | - | NULL | - | - |
| Actual end date | do_end_date | Option\<DateTime\<Utc\>\> | - | NULL | - | - |
| Range date flag | is_range_date | Option\<bool\> | - | NULL | - | - |
| Display order | order_index | i32 | NN | 0 | - | - |
| Completed state | completed | bool | NN | false | - | - |
| Created at | created_at | DateTime\<Utc\> | NN | - | - | - |
| Updated at | updated_at | DateTime\<Utc\> | NN | - | - | - |

### Constraints

- PRIMARY KEY: `id`
- FOREIGN KEY: `task_id -> tasks.id`
- NOT NULL: `id, task_id, title, status, order_index, completed, created_at, updated_at`

### Indexed Columns

`task_id`, `status`, `order_index`, `completed`, `created_at`

### Relations

- tasks, subtask_assignments, subtask_tags, subtask_recurrences

---

## Tag — tags

**Role**: Label that categorizes tasks and subtasks within a project. Has color information.

### Fields

| Logical name | Physical name | Rust type | Constraints | Default | Foreign key | Description |
| --- | --- | --- | --- | --- | --- | --- |
| Tag ID | id | TagId | PK, NN | - | - | - |
| Project ID | project_id | ProjectId | NN | - | projects.id | - |
| Tag name | name | String | NN | - | - | - |
| Background color | color | String | NN | "#808080" | - | HEX |
| Text color | text_color | String | NN | "#FFFFFF" | - | HEX |
| Display order | order_index | i32 | NN | 0 | - | - |
| Created at | created_at | DateTime\<Utc\> | NN | - | - | - |
| Updated at | updated_at | DateTime\<Utc\> | NN | - | - | - |

### Constraints

- PRIMARY KEY: `id`
- FOREIGN KEY: `project_id -> projects.id`
- NOT NULL: `id, project_id, name, color, text_color, order_index, created_at, updated_at`

### Indexed Columns

`project_id`, `order_index`, `created_at`

### Relations

- projects, task_tags, subtask_tags

---

## TagBookmark (project scope) — tag_bookmarks

**Role**: Project-scoped tag pinned in the sidebar. Uses the composite primary key `(project_id, tag_id)` for cross-project display.

### Fields

| Logical name | Physical name | Rust type | Constraints | Default | Foreign key | Description |
| --- | --- | --- | --- | --- | --- | --- |
| Project ID | project_id | ProjectId | PK, NN | - | projects.id | - |
| Tag ID | tag_id | TagId | PK, NN | - | tags.id | - |
| Display order | order_index | i32 | NN | 0 | - | - |
| Created at | created_at | DateTime\<Utc\> | NN | - | - | - |

### Constraints

- PRIMARY KEY: `(project_id, tag_id)`
- FOREIGN KEY: `project_id -> projects.id`, `tag_id -> tags.id`
- NOT NULL: all columns

### Indexed Columns

`order_index`, `created_at` (PK is automatic)

### Notes

For user settings stored as `user_tag_bookmarks`, see `user-preferences.md`.

---

## Member — members

**Role**: User participation state and permissions for a project. Manages a many-to-many relation with a composite primary key.

### Fields

| Logical name | Physical name | Rust type | Constraints | Default | Foreign key | Description |
| --- | --- | --- | --- | --- | --- | --- |
| Project ID | project_id | ProjectId | PK, NN | - | projects.id | - |
| User ID | user_id | UserId | PK, NN | - | users.id | - |
| Permission role | role | String | NN | "Member" | - | - |
| Joined at | joined_at | DateTime\<Utc\> | NN | - | - | - |
| Updated at | updated_at | DateTime\<Utc\> | NN | - | - | - |

### Constraints

- PRIMARY KEY: `(project_id, user_id)`
- FOREIGN KEY: `project_id -> projects.id`, `user_id -> users.id`

### Indexed Columns

`project_id`, `user_id`, `role`, `joined_at`

---

## TaskAssignment — task_assignments

**Role**: Many-to-many association between tasks and assigned users. Includes `project_id` in the three-column composite primary key for cross-project management.

### Fields

| Logical name | Physical name | Rust type | Constraints | Default | Foreign key | Description |
| --- | --- | --- | --- | --- | --- | --- |
| Project ID | project_id | ProjectId | PK, NN | - | projects.id | - |
| Task ID | task_id | TaskId | PK, NN | - | tasks.id | - |
| User ID | user_id | UserId | PK, NN | - | users.id | - |
| Created at | created_at | DateTime\<Utc\> | NN | - | - | - |

### Constraints

- PRIMARY KEY: `(project_id, task_id, user_id)`
- FOREIGN KEY: each column references its corresponding table

### Indexed Columns

`project_id`, `task_id`, `user_id`, `created_at`

---

## SubtaskAssignment — subtask_assignments

**Role**: Many-to-many association between subtasks and assigned users. Uses the same three-column composite primary key pattern.

### Fields

| Logical name | Physical name | Rust type | Constraints | Default | Foreign key | Description |
| --- | --- | --- | --- | --- | --- | --- |
| Project ID | project_id | ProjectId | PK, NN | - | projects.id | - |
| Subtask ID | subtask_id | SubTaskId | PK, NN | - | subtasks.id | - |
| User ID | user_id | UserId | PK, NN | - | users.id | - |
| Created at | created_at | DateTime\<Utc\> | NN | - | - | - |

### Constraints

- PRIMARY KEY: `(project_id, subtask_id, user_id)`
- FOREIGN KEY: each column references its corresponding table

### Indexed Columns

`project_id`, `subtask_id`, `user_id`, `created_at`

---

## TaskTag — task_tags

**Role**: Many-to-many association between tasks and tags. Uses the same three-column composite primary key.

### Fields

| Logical name | Physical name | Rust type | Constraints | Default | Foreign key | Description |
| --- | --- | --- | --- | --- | --- | --- |
| Project ID | project_id | ProjectId | PK, NN | - | projects.id | - |
| Task ID | task_id | TaskId | PK, NN | - | tasks.id | - |
| Tag ID | tag_id | TagId | PK, NN | - | tags.id | - |
| Created at | created_at | DateTime\<Utc\> | NN | - | - | - |

### Constraints and Indexes

- PRIMARY KEY: `(project_id, task_id, tag_id)` / FK: corresponding tables
- Indexes: `project_id`, `task_id`, `tag_id`, `created_at`

---

## SubtaskTag — subtask_tags

**Role**: Many-to-many association between subtasks and tags. Uses the same three-column composite primary key.

### Fields

| Logical name | Physical name | Rust type | Constraints | Default | Foreign key | Description |
| --- | --- | --- | --- | --- | --- | --- |
| Project ID | project_id | ProjectId | PK, NN | - | projects.id | - |
| Subtask ID | subtask_id | SubTaskId | PK, NN | - | subtasks.id | - |
| Tag ID | tag_id | TagId | PK, NN | - | tags.id | - |
| Created at | created_at | DateTime\<Utc\> | NN | - | - | - |

### Constraints and Indexes

- PRIMARY KEY: `(project_id, subtask_id, tag_id)` / FK: corresponding tables
- Indexes: `project_id`, `subtask_id`, `tag_id`, `created_at`

---

## TaskRecurrence — task_recurrences

**Role**: Many-to-many association between tasks and recurrence rules.

### Fields

| Logical name | Physical name | Rust type | Constraints | Default | Foreign key | Description |
| --- | --- | --- | --- | --- | --- | --- |
| Task ID | task_id | TaskId | PK, NN | - | tasks.id | - |
| Recurrence rule ID | recurrence_rule_id | String | PK, NN | - | recurrence_rules.id | - |
| Created at | created_at | DateTime\<Utc\> | NN | - | - | - |

### Constraints and Indexes

- PRIMARY KEY: `(task_id, recurrence_rule_id)` / FK: corresponding tables
- Indexes: `task_id`, `recurrence_rule_id`, `created_at`

---

## SubtaskRecurrence — subtask_recurrences

**Role**: Many-to-many association between subtasks and recurrence rules.

### Fields

| Logical name | Physical name | Rust type | Constraints | Default | Foreign key | Description |
| --- | --- | --- | --- | --- | --- | --- |
| Subtask ID | subtask_id | SubTaskId | PK, NN | - | subtasks.id | - |
| Recurrence rule ID | recurrence_rule_id | String | PK, NN | - | recurrence_rules.id | - |
| Created at | created_at | DateTime\<Utc\> | NN | - | - | - |

### Constraints and Indexes

- PRIMARY KEY: `(subtask_id, recurrence_rule_id)` / FK: corresponding tables
- Indexes: `subtask_id`, `recurrence_rule_id`, `created_at`

---

## DateCondition — date_conditions

**Role**: Date-based condition evaluation (relationship to a reference date).

### Fields

| Logical name | Physical name | Rust type | Constraints | Default | Foreign key | Description |
| --- | --- | --- | --- | --- | --- | --- |
| Condition ID | id | String | PK, NN | - | - | - |
| Relation | relation | String | NN | - | - | before / after / same, etc. |
| Reference date | reference_date | DateTime\<Utc\> | NN | - | - | - |

### Constraints and Indexes

- PRIMARY KEY: `id`
- Indexes: `relation`, `reference_date`

---

## WeekdayCondition — weekday_conditions

**Role**: Weekday-based condition adjustment (business-day adjustment, fixed weekday tasks, etc.).

### Fields

| Logical name | Physical name | Rust type | Constraints | Default | Foreign key | Description |
| --- | --- | --- | --- | --- | --- | --- |
| Condition ID | id | String | PK, NN | - | - | - |
| Weekday to check | if_weekday | String | NN | - | - | - |
| Adjustment direction | then_direction | String | NN | - | - | before / after / nearest, etc. |
| Adjustment target | then_target | String | NN | - | - | weekday / specific weekday / number of days, etc. |
| Adjustment weekday | then_weekday | Option\<String\> | - | NULL | - | When target=specific weekday |
| Adjustment days | then_days | Option\<i32\> | - | NULL | - | When target=number of days |

### Constraints and Indexes

- PRIMARY KEY: `id`
- Indexes: `if_weekday`, `then_target`

---

## Design Principle: Association Entities and `project_id`

All association entities (`*_assignments`, `*_tags`) include `project_id` in the composite primary key. Reasons:

1. **Ownership**: tasks, subtasks, tags, and users all belong to a project
2. **Cross-project data management**: when handling data from multiple projects centrally, `project_id` is required for identification
3. **Data integrity**: foreign key constraints prevent invalid associations across projects
