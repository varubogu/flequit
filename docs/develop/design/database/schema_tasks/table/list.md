# table: tasks.lists

| Column Name | Data Type | NULL |      Default      | Primary Key | Foreign Key  | Unique | Check Constraint |    Description     |
| ----------- | --------- | ---- | ----------------- | ----------- | ------------ | ------ | ---------------- | ------------------ |
| id          | TEXT      | NO   |                   | YES         |              | YES    |                  | List ID            |
| project_id  | TEXT      | NO   |                   |             | projects(id) |        |                  | Parent project ID  |
| name        | TEXT      | NO   |                   |             |              |        |                  | List name          |
| description | TEXT      | YES  |                   |             |              |        |                  | List description   |
| order_index | INTEGER   | NO   |                   |             |              |        |                  | Display order      |
| is_archived | BOOLEAN   | NO   | FALSE             |             |              |        |                  | Archive status     |
| created_at  | TIMESTAMP | NO   | CURRENT_TIMESTAMP |             |              |        |                  | Creation timestamp |
| updated_at  | TIMESTAMP | NO   | CURRENT_TIMESTAMP |             |              |        |                  | Update timestamp   |
