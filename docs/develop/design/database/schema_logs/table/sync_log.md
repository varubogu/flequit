# table: sync_log

## description

Table for storing synchronization logs

## structure

| Column Name  | Data Type | NULL | Default           | Primary Key | Foreign Key | Unique | Check Constraint                        | Description        |
| ------------ | --------- | ---- | ----------------- | ----------- | ----------- | ------ | --------------------------------------- | ------------------ |
| id           | TEXT      | NO   |                   | YES         |             | YES    |                                         | Sync log ID        |
| sync_type    | TEXT      | NO   |                   |             |             |        | IN ('full', 'incremental')              | Sync type          |
| status       | TEXT      | NO   |                   |             |             |        | IN ('success', 'failed', 'in_progress') | Sync status        |
| error_detail | TEXT      | YES  |                   |             |             |        |                                         | Error details      |
| started_at   | TIMESTAMP | NO   | CURRENT_TIMESTAMP |             |             |        |                                         | Start timestamp    |
| completed_at | TIMESTAMP | YES  |                   |             |             |        |                                         | Complete timestamp |
