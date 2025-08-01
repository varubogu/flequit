# table: profiles

## description

Table for storing user profile information.

## structure

| Column Name     | Data Type    | NULL | Default           | Primary Key | Foreign Key | Unique | Check Constraint | Description                       |
| --------------- | ------------ | ---- | ----------------- | ----------- | ----------- | ------ | ---------------- | --------------------------------- |
| id              | INTEGER      | NO   |                   | YES         |             | YES    |                  | Unique identifier for the profile |
| user_id         | INTEGER      | NO   |                   |             | users(id)   |        |                  | User ID (foreign key)             |
| display_name    | VARCHAR(255) | YES  |                   |             |             |        |                  | Display name                      |
| bio             | TEXT         | YES  |                   |             |             |        |                  | Biography text                    |
| profile_picture | VARCHAR(255) | YES  |                   |             |             |        |                  | URL of the profile picture        |
| created_at      | TIMESTAMP    | NO   | CURRENT_TIMESTAMP |             |             |        |                  | Profile creation timestamp        |
| updated_at      | TIMESTAMP    | NO   | CURRENT_TIMESTAMP |             |             |        |                  | Profile update timestamp          |

## indexes

- `idx_user_id`: Index on user_id

## foreign key constraints

- `fk_user_id`: user_id references the id in the users table

## notes

- The display_name does not need to be unique, but a user cannot have multiple profiles.
- The profile picture is optional, and if not specified, a default image will be used.
