//! 初期スキーママイグレーション
//!
//! Flequitアプリケーションの全テーブルとインデックスを作成します。
//! 現在のHybridMigratorの処理を統合したものです。

use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // 外部キー制約を有効化
        manager
            .get_connection()
            .execute_unprepared("PRAGMA foreign_keys = ON;")
            .await?;

        // 1. 基本テーブルの作成
        create_basic_tables(manager).await?;

        // 2. プロジェクト関連テーブルの作成
        create_project_tables(manager).await?;

        // 3. タスク関連テーブルの作成
        create_task_tables(manager).await?;

        // 4. 繰り返し関連テーブルの作成（複合外部キー付き）
        create_recurrence_tables(manager).await?;

        // 5. ジャンクションテーブルの作成
        create_junction_tables(manager).await?;

        // 6. 複合インデックスの作成
        create_composite_indexes(manager).await?;

        // 7. 追加インデックスの作成
        create_additional_indexes(manager).await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // 外部キー制約を一時的に無効化
        manager
            .get_connection()
            .execute_unprepared("PRAGMA foreign_keys = OFF;")
            .await?;

        // テーブルを逆順で削除
        let drop_tables = vec![
            "task_recurrence",
            "subtask_recurrence",
            "recurrence_weekday_conditions",
            "recurrence_date_conditions",
            "recurrence_days_of_week",
            "recurrence_details",
            "recurrence_adjustments",
            "recurrence_rules",
            "subtask_assignments",
            "task_assignments",
            "subtask_tags",
            "task_tags",
            "tags",
            "subtasks",
            "tasks",
            "task_lists",
            "members",
            "user_tag_bookmarks",
            "projects",
            "accounts",
            "users",
        ];

        for table in drop_tables {
            manager
                .get_connection()
                .execute_unprepared(&format!("DROP TABLE IF EXISTS {};", table))
                .await?;
        }

        // 外部キー制約を再度有効化
        manager
            .get_connection()
            .execute_unprepared("PRAGMA foreign_keys = ON;")
            .await?;

        Ok(())
    }
}

/// 基本テーブルの作成（users, accounts）
async fn create_basic_tables(manager: &SchemaManager<'_>) -> Result<(), DbErr> {
    // usersテーブル
    manager
        .get_connection()
        .execute_unprepared(
            r#"
            CREATE TABLE IF NOT EXISTS users (
                id VARCHAR NOT NULL PRIMARY KEY,
                username VARCHAR NOT NULL UNIQUE,
                email VARCHAR,
                display_name VARCHAR,
                avatar_url VARCHAR,
                created_at TIMESTAMP NOT NULL,
                updated_at TIMESTAMP NOT NULL,
                deleted BOOLEAN NOT NULL DEFAULT FALSE,
                updated_by VARCHAR NOT NULL
            );
            "#,
        )
        .await?;

    // accountsテーブル
    manager
        .get_connection()
        .execute_unprepared(
            r#"
            CREATE TABLE IF NOT EXISTS accounts (
                id VARCHAR NOT NULL PRIMARY KEY,
                user_id VARCHAR NOT NULL,
                provider VARCHAR NOT NULL,
                provider_id VARCHAR NOT NULL,
                email VARCHAR,
                is_active BOOLEAN NOT NULL DEFAULT TRUE,
                created_at TIMESTAMP NOT NULL,
                updated_at TIMESTAMP NOT NULL,
                deleted BOOLEAN NOT NULL DEFAULT FALSE,
                updated_by VARCHAR NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            );
            "#,
        )
        .await?;

    Ok(())
}

/// プロジェクト関連テーブルの作成
async fn create_project_tables(manager: &SchemaManager<'_>) -> Result<(), DbErr> {
    // projectsテーブル
    manager
        .get_connection()
        .execute_unprepared(
            r#"
            CREATE TABLE IF NOT EXISTS projects (
                id VARCHAR NOT NULL PRIMARY KEY,
                owner_id VARCHAR NOT NULL,
                name VARCHAR NOT NULL,
                description VARCHAR,
                is_archived BOOLEAN NOT NULL DEFAULT FALSE,
                created_at TIMESTAMP NOT NULL,
                updated_at TIMESTAMP NOT NULL,
                deleted BOOLEAN NOT NULL DEFAULT FALSE,
                updated_by VARCHAR NOT NULL,
                FOREIGN KEY (owner_id) REFERENCES users (id)
            );
            "#,
        )
        .await?;

    // membersテーブル
    manager
        .get_connection()
        .execute_unprepared(
            r#"
            CREATE TABLE IF NOT EXISTS members (
                project_id VARCHAR NOT NULL,
                user_id VARCHAR NOT NULL,
                role VARCHAR NOT NULL,
                joined_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP NOT NULL,
                updated_at TIMESTAMP NOT NULL,
                deleted BOOLEAN NOT NULL DEFAULT FALSE,
                updated_by VARCHAR NOT NULL,
                CONSTRAINT pk_members PRIMARY KEY (project_id, user_id),
                FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            );
            "#,
        )
        .await?;

    // user_tag_bookmarksテーブル
    manager
        .get_connection()
        .execute_unprepared(
            r#"
            CREATE TABLE IF NOT EXISTS user_tag_bookmarks (
                user_id VARCHAR NOT NULL,
                project_id VARCHAR NOT NULL,
                tag_id VARCHAR NOT NULL,
                order_index INTEGER NOT NULL,
                created_at TIMESTAMP NOT NULL,
                updated_at TIMESTAMP NOT NULL,
                CONSTRAINT pk_user_tag_bookmarks PRIMARY KEY (user_id, project_id, tag_id),
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
                FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
            );
            "#,
        )
        .await?;

    Ok(())
}

/// タスク関連テーブルの作成
async fn create_task_tables(manager: &SchemaManager<'_>) -> Result<(), DbErr> {
    // task_listsテーブル
    manager
        .get_connection()
        .execute_unprepared(
            r#"
            CREATE TABLE IF NOT EXISTS task_lists (
                project_id VARCHAR NOT NULL,
                id VARCHAR NOT NULL,
                name VARCHAR NOT NULL,
                description VARCHAR,
                list_order INTEGER NOT NULL,
                created_at TIMESTAMP NOT NULL,
                updated_at TIMESTAMP NOT NULL,
                deleted BOOLEAN NOT NULL DEFAULT FALSE,
                updated_by VARCHAR NOT NULL,
                CONSTRAINT pk_task_lists PRIMARY KEY (project_id, id),
                FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
            );
            "#,
        )
        .await?;

    // tasksテーブル
    manager
        .get_connection()
        .execute_unprepared(
            r#"
            CREATE TABLE IF NOT EXISTS tasks (
                project_id VARCHAR NOT NULL,
                id VARCHAR NOT NULL,
                list_id VARCHAR NOT NULL,
                title VARCHAR NOT NULL,
                description VARCHAR,
                status VARCHAR NOT NULL,
                priority VARCHAR,
                start_date TIMESTAMP,
                end_date TIMESTAMP,
                task_order INTEGER NOT NULL,
                created_at TIMESTAMP NOT NULL,
                updated_at TIMESTAMP NOT NULL,
                deleted BOOLEAN NOT NULL DEFAULT FALSE,
                updated_by VARCHAR NOT NULL,
                CONSTRAINT pk_tasks PRIMARY KEY (project_id, id),
                FOREIGN KEY (project_id, list_id) REFERENCES task_lists (project_id, id) ON DELETE CASCADE
            );
            "#,
        )
        .await?;

    // subtasksテーブル
    manager
        .get_connection()
        .execute_unprepared(
            r#"
            CREATE TABLE IF NOT EXISTS subtasks (
                project_id VARCHAR NOT NULL,
                id VARCHAR NOT NULL,
                task_id VARCHAR NOT NULL,
                title VARCHAR NOT NULL,
                description VARCHAR,
                is_completed BOOLEAN NOT NULL DEFAULT FALSE,
                subtask_order INTEGER NOT NULL,
                do_start_date TIMESTAMP,
                do_end_date TIMESTAMP,
                created_at TIMESTAMP NOT NULL,
                updated_at TIMESTAMP NOT NULL,
                deleted BOOLEAN NOT NULL DEFAULT FALSE,
                updated_by VARCHAR NOT NULL,
                CONSTRAINT pk_subtasks PRIMARY KEY (project_id, id),
                FOREIGN KEY (project_id, task_id) REFERENCES tasks (project_id, id) ON DELETE CASCADE
            );
            "#,
        )
        .await?;

    // tagsテーブル
    manager
        .get_connection()
        .execute_unprepared(
            r#"
            CREATE TABLE IF NOT EXISTS tags (
                project_id VARCHAR NOT NULL,
                id VARCHAR NOT NULL,
                name VARCHAR NOT NULL,
                color VARCHAR,
                created_at TIMESTAMP NOT NULL,
                updated_at TIMESTAMP NOT NULL,
                deleted BOOLEAN NOT NULL DEFAULT FALSE,
                updated_by VARCHAR NOT NULL,
                CONSTRAINT pk_tags PRIMARY KEY (project_id, id),
                FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
            );
            "#,
        )
        .await?;

    Ok(())
}

/// 繰り返し関連テーブルの作成（複合外部キー付き）
async fn create_recurrence_tables(manager: &SchemaManager<'_>) -> Result<(), DbErr> {
    // recurrence_rulesテーブル
    manager
        .get_connection()
        .execute_unprepared(
            r#"
            CREATE TABLE IF NOT EXISTS recurrence_rules (
                project_id VARCHAR NOT NULL,
                id VARCHAR NOT NULL,
                frequency VARCHAR NOT NULL,
                interval_value INTEGER NOT NULL,
                start_date TIMESTAMP NOT NULL,
                end_date TIMESTAMP,
                created_at TIMESTAMP NOT NULL,
                updated_at TIMESTAMP NOT NULL,
                deleted BOOLEAN NOT NULL DEFAULT FALSE,
                updated_by VARCHAR NOT NULL,
                CONSTRAINT pk_recurrence_rules PRIMARY KEY (project_id, id),
                FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
            );
            "#,
        )
        .await?;

    // recurrence_adjustmentsテーブル
    manager
        .get_connection()
        .execute_unprepared(
            r#"
            CREATE TABLE IF NOT EXISTS recurrence_adjustments (
                project_id VARCHAR NOT NULL,
                id VARCHAR NOT NULL,
                recurrence_rule_id VARCHAR NOT NULL,
                created_at TIMESTAMP NOT NULL,
                updated_at TIMESTAMP NOT NULL,
                deleted BOOLEAN NOT NULL DEFAULT FALSE,
                updated_by VARCHAR NOT NULL,
                CONSTRAINT pk_recurrence_adjustments PRIMARY KEY (project_id, id),
                FOREIGN KEY (project_id, recurrence_rule_id) REFERENCES recurrence_rules (project_id, id) ON DELETE CASCADE
            );
            "#,
        )
        .await?;

    // recurrence_detailsテーブル
    manager
        .get_connection()
        .execute_unprepared(
            r#"
            CREATE TABLE IF NOT EXISTS recurrence_details (
                project_id VARCHAR NOT NULL,
                recurrence_rule_id VARCHAR NOT NULL,
                specific_date INTEGER,
                week_of_period VARCHAR,
                weekday_of_week VARCHAR,
                created_at TIMESTAMP NOT NULL,
                updated_at TIMESTAMP NOT NULL,
                deleted BOOLEAN NOT NULL DEFAULT FALSE,
                updated_by VARCHAR NOT NULL,
                CONSTRAINT pk_recurrence_details PRIMARY KEY (project_id, recurrence_rule_id),
                FOREIGN KEY (project_id, recurrence_rule_id) REFERENCES recurrence_rules (project_id, id) ON DELETE CASCADE
            );
            "#,
        )
        .await?;

    // recurrence_days_of_weekテーブル
    manager
        .get_connection()
        .execute_unprepared(
            r#"
            CREATE TABLE IF NOT EXISTS recurrence_days_of_week (
                project_id VARCHAR NOT NULL,
                recurrence_rule_id VARCHAR NOT NULL,
                day_of_week VARCHAR NOT NULL,
                created_at TIMESTAMP NOT NULL,
                updated_at TIMESTAMP NOT NULL,
                deleted BOOLEAN NOT NULL DEFAULT FALSE,
                updated_by VARCHAR NOT NULL,
                CONSTRAINT pk_recurrence_days_of_week PRIMARY KEY (project_id, recurrence_rule_id, day_of_week),
                FOREIGN KEY (project_id, recurrence_rule_id) REFERENCES recurrence_rules (project_id, id) ON DELETE CASCADE
            );
            "#,
        )
        .await?;

    // recurrence_date_conditionsテーブル
    manager
        .get_connection()
        .execute_unprepared(
            r#"
            CREATE TABLE IF NOT EXISTS recurrence_date_conditions (
                project_id VARCHAR NOT NULL,
                id VARCHAR NOT NULL,
                recurrence_adjustment_id VARCHAR,
                recurrence_detail_id VARCHAR,
                relation VARCHAR NOT NULL,
                reference_date TIMESTAMP NOT NULL,
                created_at TIMESTAMP NOT NULL,
                updated_at TIMESTAMP NOT NULL,
                deleted BOOLEAN NOT NULL DEFAULT FALSE,
                updated_by VARCHAR NOT NULL,
                CONSTRAINT pk_recurrence_date_conditions PRIMARY KEY (project_id, id),
                FOREIGN KEY (project_id, recurrence_adjustment_id) REFERENCES recurrence_adjustments (project_id, id) ON DELETE CASCADE,
                FOREIGN KEY (project_id, recurrence_detail_id) REFERENCES recurrence_details (project_id, recurrence_rule_id) ON DELETE CASCADE
            );
            "#,
        )
        .await?;

    // recurrence_weekday_conditionsテーブル
    manager
        .get_connection()
        .execute_unprepared(
            r#"
            CREATE TABLE IF NOT EXISTS recurrence_weekday_conditions (
                project_id VARCHAR NOT NULL,
                id VARCHAR NOT NULL,
                recurrence_adjustment_id VARCHAR NOT NULL,
                if_weekday VARCHAR NOT NULL,
                then_direction VARCHAR NOT NULL,
                then_target VARCHAR NOT NULL,
                then_weekday VARCHAR,
                then_days INTEGER,
                created_at TIMESTAMP NOT NULL,
                updated_at TIMESTAMP NOT NULL,
                deleted BOOLEAN NOT NULL DEFAULT FALSE,
                updated_by VARCHAR NOT NULL,
                CONSTRAINT pk_recurrence_weekday_conditions PRIMARY KEY (project_id, id),
                FOREIGN KEY (project_id, recurrence_adjustment_id) REFERENCES recurrence_adjustments (project_id, id) ON DELETE CASCADE
            );
            "#,
        )
        .await?;

    // task_recurrenceテーブル
    manager
        .get_connection()
        .execute_unprepared(
            r#"
            CREATE TABLE IF NOT EXISTS task_recurrence (
                project_id VARCHAR NOT NULL,
                task_id VARCHAR NOT NULL,
                recurrence_rule_id VARCHAR NOT NULL,
                created_at TIMESTAMP NOT NULL,
                updated_at TIMESTAMP NOT NULL,
                deleted BOOLEAN NOT NULL DEFAULT FALSE,
                updated_by VARCHAR NOT NULL,
                CONSTRAINT pk_task_recurrence PRIMARY KEY (project_id, task_id, recurrence_rule_id),
                FOREIGN KEY (project_id, task_id) REFERENCES tasks (project_id, id) ON DELETE CASCADE,
                FOREIGN KEY (project_id, recurrence_rule_id) REFERENCES recurrence_rules (project_id, id) ON DELETE CASCADE
            );
            "#,
        )
        .await?;

    // subtask_recurrenceテーブル
    manager
        .get_connection()
        .execute_unprepared(
            r#"
            CREATE TABLE IF NOT EXISTS subtask_recurrence (
                project_id VARCHAR NOT NULL,
                subtask_id VARCHAR NOT NULL,
                recurrence_rule_id VARCHAR NOT NULL,
                created_at TIMESTAMP NOT NULL,
                updated_at TIMESTAMP NOT NULL,
                deleted BOOLEAN NOT NULL DEFAULT FALSE,
                updated_by VARCHAR NOT NULL,
                CONSTRAINT pk_subtask_recurrence PRIMARY KEY (project_id, subtask_id, recurrence_rule_id),
                FOREIGN KEY (project_id, subtask_id) REFERENCES subtasks (project_id, id) ON DELETE CASCADE,
                FOREIGN KEY (project_id, recurrence_rule_id) REFERENCES recurrence_rules (project_id, id) ON DELETE CASCADE
            );
            "#,
        )
        .await?;

    Ok(())
}

/// ジャンクションテーブルの作成
async fn create_junction_tables(manager: &SchemaManager<'_>) -> Result<(), DbErr> {
    // task_tagsテーブル
    manager
        .get_connection()
        .execute_unprepared(
            r#"
            CREATE TABLE IF NOT EXISTS task_tags (
                project_id VARCHAR NOT NULL,
                task_id VARCHAR NOT NULL,
                tag_id VARCHAR NOT NULL,
                created_at TIMESTAMP NOT NULL,
                updated_at TIMESTAMP NOT NULL,
                deleted BOOLEAN NOT NULL DEFAULT FALSE,
                updated_by VARCHAR NOT NULL,
                CONSTRAINT pk_task_tags PRIMARY KEY (project_id, task_id, tag_id),
                FOREIGN KEY (project_id, task_id) REFERENCES tasks (project_id, id) ON DELETE CASCADE,
                FOREIGN KEY (project_id, tag_id) REFERENCES tags (project_id, id) ON DELETE CASCADE
            );
            "#,
        )
        .await?;

    // subtask_tagsテーブル
    manager
        .get_connection()
        .execute_unprepared(
            r#"
            CREATE TABLE IF NOT EXISTS subtask_tags (
                project_id VARCHAR NOT NULL,
                subtask_id VARCHAR NOT NULL,
                tag_id VARCHAR NOT NULL,
                created_at TIMESTAMP NOT NULL,
                updated_at TIMESTAMP NOT NULL,
                deleted BOOLEAN NOT NULL DEFAULT FALSE,
                updated_by VARCHAR NOT NULL,
                CONSTRAINT pk_subtask_tags PRIMARY KEY (project_id, subtask_id, tag_id),
                FOREIGN KEY (project_id, subtask_id) REFERENCES subtasks (project_id, id) ON DELETE CASCADE,
                FOREIGN KEY (project_id, tag_id) REFERENCES tags (project_id, id) ON DELETE CASCADE
            );
            "#,
        )
        .await?;

    // task_assignmentsテーブル
    manager
        .get_connection()
        .execute_unprepared(
            r#"
            CREATE TABLE IF NOT EXISTS task_assignments (
                project_id VARCHAR NOT NULL,
                task_id VARCHAR NOT NULL,
                user_id VARCHAR NOT NULL,
                assigned_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP NOT NULL,
                updated_at TIMESTAMP NOT NULL,
                deleted BOOLEAN NOT NULL DEFAULT FALSE,
                updated_by VARCHAR NOT NULL,
                CONSTRAINT pk_task_assignments PRIMARY KEY (project_id, task_id, user_id),
                FOREIGN KEY (project_id, task_id) REFERENCES tasks (project_id, id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            );
            "#,
        )
        .await?;

    // subtask_assignmentsテーブル
    manager
        .get_connection()
        .execute_unprepared(
            r#"
            CREATE TABLE IF NOT EXISTS subtask_assignments (
                project_id VARCHAR NOT NULL,
                subtask_id VARCHAR NOT NULL,
                user_id VARCHAR NOT NULL,
                assigned_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP NOT NULL,
                updated_at TIMESTAMP NOT NULL,
                deleted BOOLEAN NOT NULL DEFAULT FALSE,
                updated_by VARCHAR NOT NULL,
                CONSTRAINT pk_subtask_assignments PRIMARY KEY (project_id, subtask_id, user_id),
                FOREIGN KEY (project_id, subtask_id) REFERENCES subtasks (project_id, id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            );
            "#,
        )
        .await?;

    Ok(())
}

/// 複合インデックスの作成
async fn create_composite_indexes(manager: &SchemaManager<'_>) -> Result<(), DbErr> {
    // accounts: (provider, provider_id) 複合ユニーク
    manager
        .get_connection()
        .execute_unprepared(
            "CREATE UNIQUE INDEX IF NOT EXISTS idx_accounts_provider_account ON accounts(provider, provider_id);",
        )
        .await?;

    // tags: (project_id, name) 複合ユニーク
    manager
        .get_connection()
        .execute_unprepared(
            "CREATE UNIQUE INDEX IF NOT EXISTS idx_tags_project_name ON tags(project_id, name);",
        )
        .await?;

    // user_tag_bookmarks: (user_id, project_id, tag_id) 複合ユニーク（既にPKで定義済み）
    // user_tag_bookmarks: 順序用インデックス
    manager
        .get_connection()
        .execute_unprepared(
            "CREATE INDEX IF NOT EXISTS idx_user_tag_bookmarks_user_project ON user_tag_bookmarks(user_id, project_id, order_index);",
        )
        .await?;

    manager
        .get_connection()
        .execute_unprepared(
            "CREATE INDEX IF NOT EXISTS idx_user_tag_bookmarks_tag ON user_tag_bookmarks(tag_id);",
        )
        .await?;

    Ok(())
}

/// 追加インデックスの作成（パフォーマンス最適化用）
async fn create_additional_indexes(manager: &SchemaManager<'_>) -> Result<(), DbErr> {
    manager
        .get_connection()
        .execute_unprepared(
            "CREATE INDEX IF NOT EXISTS idx_tasks_end_date_status ON tasks(end_date, status);",
        )
        .await?;

    manager
        .get_connection()
        .execute_unprepared(
            "CREATE INDEX IF NOT EXISTS idx_accounts_email_active ON accounts(email, is_active);",
        )
        .await?;

    manager
        .get_connection()
        .execute_unprepared(
            "CREATE INDEX IF NOT EXISTS idx_projects_owner_archived ON projects(owner_id, is_archived);",
        )
        .await?;

    Ok(())
}
