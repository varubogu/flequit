//! データベースマイグレーション
//!
//! SQLiteデータベーススキーマの作成・更新を管理

use sea_orm::{ConnectionTrait, DatabaseConnection, DbErr, Statement};

/// マイグレーションを実行
pub async fn run_migrations(db: &DatabaseConnection) -> Result<(), DbErr> {
    // マイグレーションテーブルの作成
    create_migration_table(db).await?;

    // 各テーブルの作成
    create_settings_table(db).await?;
    create_accounts_table(db).await?;
    create_projects_table(db).await?;
    create_task_lists_table(db).await?;
    create_tasks_table(db).await?;
    create_subtasks_table(db).await?;
    create_tags_table(db).await?;

    Ok(())
}

/// マイグレーション履歴テーブルの作成
async fn create_migration_table(db: &DatabaseConnection) -> Result<(), DbErr> {
    let sql = r#"
        CREATE TABLE IF NOT EXISTS migrations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            version TEXT NOT NULL UNIQUE,
            applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    "#;

    db.execute(Statement::from_string(
        sea_orm::DatabaseBackend::Sqlite,
        sql.to_string(),
    ))
    .await?;

    Ok(())
}

/// 設定テーブルの作成
async fn create_settings_table(db: &DatabaseConnection) -> Result<(), DbErr> {
    let sql = r#"
        CREATE TABLE IF NOT EXISTS settings (
            id TEXT PRIMARY KEY,
            app_settings TEXT NOT NULL,
            created_at DATETIME NOT NULL,
            updated_at DATETIME NOT NULL
        );
    "#;

    db.execute(Statement::from_string(
        sea_orm::DatabaseBackend::Sqlite,
        sql.to_string(),
    ))
    .await?;

    Ok(())
}

/// アカウントテーブルの作成
async fn create_accounts_table(db: &DatabaseConnection) -> Result<(), DbErr> {
    let sql = r#"
        CREATE TABLE IF NOT EXISTS accounts (
            id TEXT PRIMARY KEY,
            email TEXT NOT NULL,
            provider TEXT NOT NULL,
            provider_account_id TEXT NOT NULL,
            is_active BOOLEAN NOT NULL DEFAULT 0,
            created_at DATETIME NOT NULL,
            updated_at DATETIME NOT NULL
        );
        
        CREATE INDEX IF NOT EXISTS idx_accounts_email ON accounts(email);
        CREATE INDEX IF NOT EXISTS idx_accounts_provider ON accounts(provider);
        CREATE INDEX IF NOT EXISTS idx_accounts_is_active ON accounts(is_active);
        CREATE INDEX IF NOT EXISTS idx_accounts_created_at ON accounts(created_at);
        CREATE UNIQUE INDEX IF NOT EXISTS idx_accounts_provider_account ON accounts(provider, provider_account_id);
    "#;

    db.execute(Statement::from_string(
        sea_orm::DatabaseBackend::Sqlite,
        sql.to_string(),
    ))
    .await?;

    Ok(())
}

/// プロジェクトテーブルの作成
async fn create_projects_table(db: &DatabaseConnection) -> Result<(), DbErr> {
    let sql = r#"
        CREATE TABLE IF NOT EXISTS projects (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            color TEXT,
            order_index INTEGER NOT NULL,
            is_archived BOOLEAN NOT NULL DEFAULT 0,
            status TEXT,
            owner_id TEXT,
            created_at DATETIME NOT NULL,
            updated_at DATETIME NOT NULL
        );
        
        CREATE INDEX IF NOT EXISTS idx_projects_name ON projects(name);
        CREATE INDEX IF NOT EXISTS idx_projects_order_index ON projects(order_index);
        CREATE INDEX IF NOT EXISTS idx_projects_is_archived ON projects(is_archived);
        CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
        CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON projects(owner_id);
        CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at);
    "#;

    db.execute(Statement::from_string(
        sea_orm::DatabaseBackend::Sqlite,
        sql.to_string(),
    ))
    .await?;

    Ok(())
}

/// タスクリストテーブルの作成
async fn create_task_lists_table(db: &DatabaseConnection) -> Result<(), DbErr> {
    let sql = r#"
        CREATE TABLE IF NOT EXISTS task_lists (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            color TEXT,
            order_index INTEGER NOT NULL,
            is_archived BOOLEAN NOT NULL DEFAULT 0,
            created_at DATETIME NOT NULL,
            updated_at DATETIME NOT NULL,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
        );
        
        CREATE INDEX IF NOT EXISTS idx_task_lists_project_id ON task_lists(project_id);
        CREATE INDEX IF NOT EXISTS idx_task_lists_order_index ON task_lists(order_index);
        CREATE INDEX IF NOT EXISTS idx_task_lists_is_archived ON task_lists(is_archived);
    "#;

    db.execute(Statement::from_string(
        sea_orm::DatabaseBackend::Sqlite,
        sql.to_string(),
    ))
    .await?;

    Ok(())
}

/// タスクテーブルの作成
async fn create_tasks_table(db: &DatabaseConnection) -> Result<(), DbErr> {
    let sql = r#"
        CREATE TABLE IF NOT EXISTS tasks (
            id TEXT PRIMARY KEY,
            sub_task_id TEXT,
            project_id TEXT NOT NULL,
            list_id TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            status TEXT NOT NULL,
            priority INTEGER NOT NULL,
            start_date DATETIME,
            end_date DATETIME,
            is_range_date BOOLEAN,
            recurrence_rule TEXT,
            assigned_user_ids TEXT,
            tag_ids TEXT,
            order_index INTEGER NOT NULL,
            is_archived BOOLEAN NOT NULL DEFAULT 0,
            created_at DATETIME NOT NULL,
            updated_at DATETIME NOT NULL,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
            FOREIGN KEY (list_id) REFERENCES task_lists(id) ON DELETE CASCADE
        );
        
        CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
        CREATE INDEX IF NOT EXISTS idx_tasks_list_id ON tasks(list_id);
        CREATE INDEX IF NOT EXISTS idx_tasks_title ON tasks(title);
        CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
        CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
        CREATE INDEX IF NOT EXISTS idx_tasks_start_date ON tasks(start_date);
        CREATE INDEX IF NOT EXISTS idx_tasks_end_date ON tasks(end_date);
        CREATE INDEX IF NOT EXISTS idx_tasks_order_index ON tasks(order_index);
        CREATE INDEX IF NOT EXISTS idx_tasks_is_archived ON tasks(is_archived);
        CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at);
    "#;

    db.execute(Statement::from_string(
        sea_orm::DatabaseBackend::Sqlite,
        sql.to_string(),
    ))
    .await?;

    Ok(())
}

/// サブタスクテーブルの作成
async fn create_subtasks_table(db: &DatabaseConnection) -> Result<(), DbErr> {
    let sql = r#"
        CREATE TABLE IF NOT EXISTS subtasks (
            id TEXT PRIMARY KEY,
            task_id TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            status TEXT NOT NULL,
            priority INTEGER,
            start_date DATETIME,
            end_date DATETIME,
            is_range_date BOOLEAN,
            recurrence_rule TEXT,
            assigned_user_ids TEXT,
            tag_ids TEXT,
            order_index INTEGER NOT NULL,
            completed BOOLEAN NOT NULL DEFAULT 0,
            created_at DATETIME NOT NULL,
            updated_at DATETIME NOT NULL,
            FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
        );
        
        CREATE INDEX IF NOT EXISTS idx_subtasks_task_id ON subtasks(task_id);
        CREATE INDEX IF NOT EXISTS idx_subtasks_status ON subtasks(status);
        CREATE INDEX IF NOT EXISTS idx_subtasks_priority ON subtasks(priority);
        CREATE INDEX IF NOT EXISTS idx_subtasks_start_date ON subtasks(start_date);
        CREATE INDEX IF NOT EXISTS idx_subtasks_end_date ON subtasks(end_date);
        CREATE INDEX IF NOT EXISTS idx_subtasks_order_index ON subtasks(order_index);
        CREATE INDEX IF NOT EXISTS idx_subtasks_completed ON subtasks(completed);
    "#;

    db.execute(Statement::from_string(
        sea_orm::DatabaseBackend::Sqlite,
        sql.to_string(),
    ))
    .await?;

    Ok(())
}

/// タグテーブルの作成
async fn create_tags_table(db: &DatabaseConnection) -> Result<(), DbErr> {
    let sql = r#"
        CREATE TABLE IF NOT EXISTS tags (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL UNIQUE,
            color TEXT,
            order_index INTEGER,
            usage_count INTEGER NOT NULL DEFAULT 0,
            created_at DATETIME NOT NULL,
            updated_at DATETIME NOT NULL
        );
        
        CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);
        CREATE INDEX IF NOT EXISTS idx_tags_color ON tags(color);
        CREATE INDEX IF NOT EXISTS idx_tags_order_index ON tags(order_index);
        CREATE INDEX IF NOT EXISTS idx_tags_usage_count ON tags(usage_count);
    "#;

    db.execute(Statement::from_string(
        sea_orm::DatabaseBackend::Sqlite,
        sql.to_string(),
    ))
    .await?;

    Ok(())
}
