# table: flequit_tasks.tasks

| Column Name     | Data Type | NULL | Default           | Primary Key | Foreign Key   | Unique | Check Constraint                                                       | Description        |
| --------------- | --------- | ---- | ----------------- | ----------- | ------------- | ------ | ---------------------------------------------------------------------- | ------------------ |
| id              | TEXT      | NO   |                   | YES         |               | YES    |                                                                        | Task ID            |
| sub_task_id     | TEXT      | YES  |                   |             | sub_tasks(id) |        |                                                                        | Subtask ID         |
| list_id         | TEXT      | NO   |                   |             | lists(id)     |        |                                                                        | Parent list ID     |
| title           | TEXT      | NO   |                   |             |               |        |                                                                        | Task title         |
| description     | TEXT      | YES  |                   |             |               |        |                                                                        | Task description   |
| status          | TEXT      | NO   |                   |             |               |        | IN ('not_started', 'in_progress', 'waiting', 'completed', 'cancelled') | Task status        |
| priority        | INTEGER   | NO   | 0                 |             |               |        |                                                                        | Priority level     |
| start_date      | TIMESTAMP | YES  |                   |             |               |        |                                                                        | Start date         |
| end_date        | TIMESTAMP | YES  |                   |             |               |        |                                                                        | End date           |
| due_date        | TIMESTAMP | YES  |                   |             |               |        |                                                                        | Due date           |
| recurrence_rule | TEXT      | YES  |                   |             |               |        |                                                                        | Recurrence rule    |
| order_index     | INTEGER   | NO   |                   |             |               |        |                                                                        | Display order      |
| is_archived     | BOOLEAN   | NO   | FALSE             |             |               |        |                                                                        | Archive status     |
| created_at      | TIMESTAMP | NO   | CURRENT_TIMESTAMP |             |               |        |                                                                        | Creation timestamp |
| updated_at      | TIMESTAMP | NO   | CURRENT_TIMESTAMP |             |               |        |                                                                        | Update timestamp   |
