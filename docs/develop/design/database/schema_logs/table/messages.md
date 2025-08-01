# table: messages

## description

Table for storing program execution logs

## structure

| Column Name | Data Type | NULL | Default           | Primary Key | Foreign Key | Unique | Check Constraint                         | Description        |
| ----------- | --------- | ---- | ----------------- | ----------- | ----------- | ------ | ---------------------------------------- | ------------------ |
| id          | TEXT      | NO   |                   | YES         |             | YES    |                                          | Log ID             |
| level       | TEXT      | NO   |                   |             |             |        | IN ('info', 'warning', 'error', 'debug') | Log level          |
| message     | TEXT      | NO   |                   |             |             |        |                                          | Log message        |
| metadata    | JSON      | YES  |                   |             |             |        |                                          | Additional data    |
| created_at  | TIMESTAMP | NO   | CURRENT_TIMESTAMP |             |             |        |                                          | Creation timestamp |
