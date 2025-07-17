# table: flequit_tasks.tags

| Column Name | Data Type | NULL |      Default      | Primary Key | Foreign Key | Unique | Check Constraint |    Description     |
| ----------- | --------- | ---- | ----------------- | ----------- | ----------- | ------ | ---------------- | ------------------ |
| id          | TEXT      | NO   |                   | YES         |             | YES    |                  | Tag ID             |
| name        | TEXT      | NO   |                   |             |             |        |                  | Tag name           |
| color       | TEXT      | YES  |                   |             |             |        |                  | Color code         |
| created_at  | TIMESTAMP | NO   | CURRENT_TIMESTAMP |             |             |        |                  | Creation timestamp |
