# table: tasks.projects

| Column Name | Data Type | NULL | Default           | Primary Key | Foreign Key | Unique | Check Constraint | Description         |
| ----------- | --------- | ---- | ----------------- | ----------- | ----------- | ------ | ---------------- | ------------------- |
| id          | TEXT      | NO   |                   | YES         |             | YES    |                  | Project ID          |
| name        | TEXT      | NO   |                   |             |             |        |                  | Project name        |
| description | TEXT      | YES  |                   |             |             |        |                  | Project description |
| color       | TEXT      | YES  |                   |             |             |        |                  | Color code          |
| icon        | TEXT      | YES  |                   |             |             |        |                  | Icon identifier     |
| is_archived | BOOLEAN   | NO   | FALSE             |             |             |        |                  | Archive status      |
| created_at  | TIMESTAMP | NO   | CURRENT_TIMESTAMP |             |             |        |                  | Creation timestamp  |
| updated_at  | TIMESTAMP | NO   | CURRENT_TIMESTAMP |             |             |        |                  | Update timestamp    |
