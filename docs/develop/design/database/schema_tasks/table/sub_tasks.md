# table: tasks.subtasks

| Column Name | Data Type | NULL |      Default      | Primary Key | Foreign Key | Unique |                Check Constraint                |    Description     |
| ----------- | --------- | ---- | ----------------- | ----------- | ----------- | ------ | ---------------------------------------------- | ------------------ |
| id          | TEXT      | NO   |                   | YES         |             | YES    |                                                | Subtask ID         |
| task_id     | TEXT      | NO   |                   |             | tasks(id)   |        |                                                | Parent task ID     |
| title       | TEXT      | NO   |                   |             |             |        |                                                | Subtask title      |
| status      | TEXT      | NO   |                   |             |             |        | IN ('not_started', 'in_progress', 'completed') | Subtask status     |
| order_index | INTEGER   | NO   |                   |             |             |        |                                                | Display order      |
| created_at  | TIMESTAMP | NO   | CURRENT_TIMESTAMP |             |             |        |                                                | Creation timestamp |
| updated_at  | TIMESTAMP | NO   | CURRENT_TIMESTAMP |             |             |        |                                                | Update timestamp   |
