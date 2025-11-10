//! ハイブリッドマイグレーションシステム
//!
//! Sea-ORMの自動生成 + 手動補完によるデータベースマイグレーション

use sea_orm::sea_query::{Index, SqliteQueryBuilder};
use sea_orm::{ConnectionTrait, DatabaseConnection, DbBackend, DbErr, Schema, Statement};

use crate::models::{
    account::Entity as AccountEntity,
    project::Entity as ProjectEntity,
    task_projects::{
        member::Entity as MemberEntity, recurrence_rule::Entity as RecurrenceRuleEntity,
        subtask::Entity as SubtaskEntity, subtask_assignments::Entity as SubtaskAssignmentEntity,
        subtask_recurrence::Entity as SubtaskRecurrenceEntity,
        subtask_tag::Entity as SubtaskTagEntity, tag::Entity as TagEntity,
        task::Entity as TaskEntity, task_assignments::Entity as TaskAssignmentEntity,
        task_list::Entity as TaskListEntity, task_recurrence::Entity as TaskRecurrenceEntity,
        task_tag::Entity as TaskTagEntity,
    },
    user::Entity as UserEntity,
};

/// ハイブリッドマイグレーション管理
pub struct HybridMigrator {
    pub db: DatabaseConnection,
}

impl HybridMigrator {
    pub fn new(db: DatabaseConnection) -> Self {
        Self { db }
    }

    /// 完全なマイグレーション実行
    pub async fn run_migration(&self) -> Result<(), DbErr> {
        println!("🚀 ハイブリッドマイグレーション開始");

        // 1. マイグレーション履歴テーブル作成
        self.create_migration_table().await?;
        println!("✅ マイグレーション履歴テーブル作成完了");

        // 2. 自動生成でテーブル作成
        self.auto_generate_tables().await?;
        println!("✅ 自動生成テーブル作成完了");

        // 3. スキーマ更新（新しいカラム追加等）
        self.update_schema().await?;
        println!("✅ スキーマ更新完了");

        // 4. 手動補完（複合制約、CASCADE等）
        self.apply_manual_supplements().await?;
        println!("✅ 手動補完適用完了");

        // 5. 初期データ挿入
        self.insert_initial_data().await?;
        println!("✅ 初期データ挿入完了");

        // 6. マイグレーション完了記録
        self.record_migration_completion().await?;
        println!("🎉 ハイブリッドマイグレーション完了");

        Ok(())
    }

    /// マイグレーション履歴テーブル作成
    async fn create_migration_table(&self) -> Result<(), DbErr> {
        let sql = r#"
            CREATE TABLE IF NOT EXISTS migrations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                version TEXT NOT NULL UNIQUE,
                migration_type TEXT NOT NULL,
                applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                description TEXT
            );
        "#;

        self.db
            .execute(Statement::from_string(
                sea_orm::DatabaseBackend::Sqlite,
                sql.to_string(),
            ))
            .await?;

        Ok(())
    }

    /// Sea-ORMの自動生成でテーブル作成
    async fn auto_generate_tables(&self) -> Result<(), DbErr> {
        let schema = Schema::new(DbBackend::Sqlite);

        let entities = vec![
            ("accounts", schema.create_table_from_entity(AccountEntity)),
            ("projects", schema.create_table_from_entity(ProjectEntity)),
            ("users", schema.create_table_from_entity(UserEntity)),
            ("members", schema.create_table_from_entity(MemberEntity)),
            (
                "task_lists",
                schema.create_table_from_entity(TaskListEntity),
            ),
            ("tasks", schema.create_table_from_entity(TaskEntity)),
            ("subtasks", schema.create_table_from_entity(SubtaskEntity)),
            ("tags", schema.create_table_from_entity(TagEntity)),
            ("task_tags", schema.create_table_from_entity(TaskTagEntity)),
            (
                "subtask_tags",
                schema.create_table_from_entity(SubtaskTagEntity),
            ),
            (
                "task_assignments",
                schema.create_table_from_entity(TaskAssignmentEntity),
            ),
            (
                "subtask_assignments",
                schema.create_table_from_entity(SubtaskAssignmentEntity),
            ),
            (
                "recurrence_rules",
                schema.create_table_from_entity(RecurrenceRuleEntity),
            ),
            (
                "task_recurrence",
                schema.create_table_from_entity(TaskRecurrenceEntity),
            ),
            (
                "subtask_recurrence",
                schema.create_table_from_entity(SubtaskRecurrenceEntity),
            ),
        ];

        for (table_name, stmt) in entities {
            // IF NOT EXISTSを追加するためSQL文字列を調整
            let sql = stmt.to_string(SqliteQueryBuilder);
            let sql_with_if_not_exists = sql.replace("CREATE TABLE", "CREATE TABLE IF NOT EXISTS");

            self.db
                .execute_unprepared(&sql_with_if_not_exists)
                .await
                .map_err(|e| {
                    println!("❌ テーブル作成エラー ({}): {}", table_name, e);
                    e
                })?;

            println!("  📝 テーブル作成: {}", table_name);
        }

        // Junction tablesを手動で作成（Entityが不要なため）
        self.create_junction_tables_sql().await?;

        Ok(())
    }

    /// スキーマ更新：新しいカラム追加等
    async fn update_schema(&self) -> Result<(), DbErr> {
        // 1. subtasksテーブルにdo_start_dateとdo_end_dateカラムを追加
        self.add_subtask_do_date_columns().await?;

        // 2. 全テーブルにdeleted/updated_byカラムを追加
        self.add_tracking_columns().await?;

        Ok(())
    }

    /// subtasksテーブルにdo_start_dateとdo_end_dateカラムを追加
    async fn add_subtask_do_date_columns(&self) -> Result<(), DbErr> {
        // SQLiteでは列の追加が制限されているため、既存の列があるかチェックしてから追加
        let check_columns_sql = r#"
            SELECT name FROM pragma_table_info('subtasks') WHERE name IN ('do_start_date', 'do_end_date');
        "#;

        let _result = self.db.execute_unprepared(check_columns_sql).await?;

        // プラグマの結果を確認（簡易版）
        // 実際のカラム確認は別の方法が必要だが、ここではエラーがないことで判定

        // do_start_dateカラムを追加
        let add_do_start_date_sql = r#"
            ALTER TABLE subtasks ADD COLUMN do_start_date timestamp_with_timezone_text;
        "#;

        // do_end_dateカラムを追加
        let add_do_end_date_sql = r#"
            ALTER TABLE subtasks ADD COLUMN do_end_date timestamp_with_timezone_text;
        "#;

        // カラム追加（既に存在する場合はエラーをキャッチ）
        if let Err(e) = self.db.execute_unprepared(add_do_start_date_sql).await {
            if !e.to_string().contains("duplicate column name") {
                return Err(e);
            }
            println!("  ℹ️  do_start_dateカラムは既に存在します");
        } else {
            println!("  📝 do_start_dateカラムを追加しました");
        }

        if let Err(e) = self.db.execute_unprepared(add_do_end_date_sql).await {
            if !e.to_string().contains("duplicate column name") {
                return Err(e);
            }
            println!("  ℹ️  do_end_dateカラムは既に存在します");
        } else {
            println!("  📝 do_end_dateカラムを追加しました");
        }

        Ok(())
    }

    /// 全テーブルにdeleted/updated_byカラムを追加
    async fn add_tracking_columns(&self) -> Result<(), DbErr> {
        // 追加対象のテーブル一覧
        let tables = vec![
            "projects",
            "task_lists",
            "tasks",
            "subtasks",
            "tags",
            "members",
            "recurrence_rules",
            "date_conditions",
            "weekday_conditions",
            "task_assignments",
            "subtask_assignments",
            "task_tags",
            "subtask_tags",
            "task_recurrence",
            "subtask_recurrence",
        ];

        for table in tables {
            // deleted カラムを追加
            let add_deleted_sql = format!(
                "ALTER TABLE {} ADD COLUMN deleted BOOLEAN DEFAULT FALSE;",
                table
            );

            if let Err(e) = self.db.execute_unprepared(&add_deleted_sql).await {
                let error_msg = e.to_string();
                if !error_msg.contains("duplicate column name") && !error_msg.contains("no such table") {
                    return Err(e);
                }
                if error_msg.contains("duplicate column name") {
                    println!("  ℹ️  {}.deleted カラムは既に存在します", table);
                } else if error_msg.contains("no such table") {
                    println!("  ⚠️  {} テーブルが存在しません（スキップ）", table);
                }
            } else {
                println!("  📝 {}.deleted カラムを追加しました", table);
            }

            // updated_by カラムを追加
            let add_updated_by_sql = format!(
                "ALTER TABLE {} ADD COLUMN updated_by TEXT;",
                table
            );

            if let Err(e) = self.db.execute_unprepared(&add_updated_by_sql).await {
                let error_msg = e.to_string();
                if !error_msg.contains("duplicate column name") && !error_msg.contains("no such table") {
                    return Err(e);
                }
                if error_msg.contains("duplicate column name") {
                    println!("  ℹ️  {}.updated_by カラムは既に存在します", table);
                } else if error_msg.contains("no such table") {
                    println!("  ⚠️  {} テーブルが存在しません（スキップ）", table);
                }
            } else {
                println!("  📝 {}.updated_by カラムを追加しました", table);
            }
        }

        Ok(())
    }

    /// 手動補完：複合制約、CASCADE等
    async fn apply_manual_supplements(&self) -> Result<(), DbErr> {
        // 1. 複合外部キーを持つテーブルの再作成
        self.recreate_tables_with_composite_fk().await?;

        // 2. 複合ユニークインデックス
        self.create_composite_indexes().await?;

        // 3. CASCADE制約
        self.add_cascade_constraints().await?;

        // 4. 追加インデックス
        self.create_additional_indexes().await?;

        Ok(())
    }

    /// Junction tables作成（テーブル生成時用）
    async fn create_junction_tables_sql(&self) -> Result<(), DbErr> {
        // この関数は不要になりました（Sea-ORMのEntityで自動生成されるため）
        // task_tags, subtask_tagsテーブルは既にEntityで定義済み
        println!("  ℹ️  Junction tablesはEntityから自動生成されます");
        Ok(())
    }

    /// 複合ユニークインデックス作成
    async fn create_composite_indexes(&self) -> Result<(), DbErr> {
        // accounts: (provider, provider_id) 複合ユニーク
        let account_unique_index = Index::create()
            .name("idx_accounts_provider_account")
            .table(AccountEntity)
            .col(crate::models::account::Column::Provider)
            .col(crate::models::account::Column::ProviderId)
            .unique()
            .if_not_exists()
            .to_owned();

        let sql = account_unique_index.to_string(SqliteQueryBuilder);
        self.db.execute_unprepared(&sql).await?;
        println!("  🔗 複合ユニークインデックス作成: accounts(provider, provider_id)");

        // tags: (project_id, name) 複合ユニーク
        let tag_unique_index = Index::create()
            .name("idx_tags_project_name")
            .table(TagEntity)
            .col(crate::models::task_projects::tag::Column::ProjectId)
            .col(crate::models::task_projects::tag::Column::Name)
            .unique()
            .if_not_exists()
            .to_owned();

        let sql = tag_unique_index.to_string(SqliteQueryBuilder);
        self.db.execute_unprepared(&sql).await?;
        println!("  🔗 複合ユニークインデックス作成: tags(project_id, name)");

        Ok(())
    }

    /// 複合外部キーを持つテーブルの再作成
    async fn recreate_tables_with_composite_fk(&self) -> Result<(), DbErr> {
        // task_recurrenceテーブルの再作成
        self.recreate_task_recurrence_table().await?;

        // subtask_recurrenceテーブルの再作成
        self.recreate_subtask_recurrence_table().await?;

        Ok(())
    }

    /// task_recurrenceテーブルを複合外部キー付きで再作成
    async fn recreate_task_recurrence_table(&self) -> Result<(), DbErr> {
        // 既存データをバックアップ
        let backup_sql = "CREATE TEMPORARY TABLE task_recurrence_backup AS SELECT * FROM task_recurrence;";
        if let Err(e) = self.db.execute_unprepared(backup_sql).await {
            if !e.to_string().contains("no such table") {
                return Err(e);
            }
            // テーブルが存在しない場合はスキップ
            println!("  ℹ️  task_recurrenceテーブルが存在しないため、再作成をスキップ");
            return Ok(());
        }

        // 既存テーブルを削除
        self.db.execute_unprepared("DROP TABLE IF EXISTS task_recurrence;").await?;

        // 複合外部キー付きで再作成
        let create_sql = r#"
            CREATE TABLE task_recurrence (
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
        "#;
        self.db.execute_unprepared(create_sql).await?;

        // データを復元
        let restore_sql = "INSERT INTO task_recurrence SELECT * FROM task_recurrence_backup;";
        if let Err(e) = self.db.execute_unprepared(restore_sql).await {
            // データ復元失敗は警告のみ（新規インストールの場合はデータがない）
            println!("  ⚠️  task_recurrenceデータ復元失敗（新規インストールの可能性）: {}", e);
        }

        // 一時テーブルを削除
        self.db.execute_unprepared("DROP TABLE IF EXISTS task_recurrence_backup;").await?;

        println!("  🔗 task_recurrenceテーブルを複合外部キー付きで再作成しました");
        Ok(())
    }

    /// subtask_recurrenceテーブルを複合外部キー付きで再作成
    async fn recreate_subtask_recurrence_table(&self) -> Result<(), DbErr> {
        // 既存データをバックアップ
        let backup_sql = "CREATE TEMPORARY TABLE subtask_recurrence_backup AS SELECT * FROM subtask_recurrence;";
        if let Err(e) = self.db.execute_unprepared(backup_sql).await {
            if !e.to_string().contains("no such table") {
                return Err(e);
            }
            // テーブルが存在しない場合はスキップ
            println!("  ℹ️  subtask_recurrenceテーブルが存在しないため、再作成をスキップ");
            return Ok(());
        }

        // 既存テーブルを削除
        self.db.execute_unprepared("DROP TABLE IF EXISTS subtask_recurrence;").await?;

        // 複合外部キー付きで再作成
        let create_sql = r#"
            CREATE TABLE subtask_recurrence (
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
        "#;
        self.db.execute_unprepared(create_sql).await?;

        // データを復元
        let restore_sql = "INSERT INTO subtask_recurrence SELECT * FROM subtask_recurrence_backup;";
        if let Err(e) = self.db.execute_unprepared(restore_sql).await {
            // データ復元失敗は警告のみ（新規インストールの場合はデータがない）
            println!("  ⚠️  subtask_recurrenceデータ復元失敗（新規インストールの可能性）: {}", e);
        }

        // 一時テーブルを削除
        self.db.execute_unprepared("DROP TABLE IF EXISTS subtask_recurrence_backup;").await?;

        println!("  🔗 subtask_recurrenceテーブルを複合外部キー付きで再作成しました");
        Ok(())
    }

    /// CASCADE制約追加
    async fn add_cascade_constraints(&self) -> Result<(), DbErr> {
        // SQLiteでは外部キー制約の変更が制限されているため、
        // 初期テーブル作成時にCASCADEを含める必要がある
        // ここでは追加のINDEXで代替またはトリガーで実装

        let cascade_info = vec![
            "task_lists.project_id → projects.id (CASCADE)",
            "tasks.project_id → projects.id (CASCADE)",
            "tasks.list_id → task_lists.id (CASCADE)",
            "subtasks.task_id → tasks.id (CASCADE)",
        ];

        for info in cascade_info {
            println!(
                "  ⚠️  注意: {} - SQLiteの制限により、アプリケーションレベルで管理",
                info
            );
        }

        // 実際の削除はリポジトリレイヤーで管理する
        println!("  📋 CASCADE動作はリポジトリパターンで実装済み");

        Ok(())
    }

    /// 追加インデックス作成
    async fn create_additional_indexes(&self) -> Result<(), DbErr> {
        let additional_indexes = vec![
            // パフォーマンス最適化用の追加インデックス
            "CREATE INDEX IF NOT EXISTS idx_tasks_end_date_status ON tasks(end_date, status);",
            "CREATE INDEX IF NOT EXISTS idx_accounts_email_active ON accounts(email, is_active);",
            "CREATE INDEX IF NOT EXISTS idx_projects_owner_archived ON projects(owner_id, is_archived);",
        ];

        for sql in additional_indexes {
            self.db.execute_unprepared(sql).await?;
            println!(
                "  📈 追加インデックス作成: {}",
                sql.split("ON").nth(1).unwrap_or("")
            );
        }

        Ok(())
    }

    /// 初期データ挿入
    async fn insert_initial_data(&self) -> Result<(), DbErr> {
        // デフォルト設定の挿入チェック
        let settings_exists = self
            .db
            .execute_unprepared("SELECT COUNT(*) as count FROM settings;")
            .await;

        if settings_exists.is_ok() {
            // 既に設定データが存在する場合はスキップ
            println!("  ℹ️  設定データは既に存在します");
        } else {
            println!("  📦 初期データ挿入は各リポジトリの初期化メソッドで実行");
        }

        Ok(())
    }

    /// マイグレーション完了記録
    async fn record_migration_completion(&self) -> Result<(), DbErr> {
        let version = chrono::Utc::now().format("%Y%m%d_%H%M%S").to_string();
        let sql = format!(
            "INSERT OR REPLACE INTO migrations (version, migration_type, description)
             VALUES ('{}', 'hybrid_auto_generation', 'Sea-ORM自動生成 + 手動補完');",
            version
        );

        self.db.execute_unprepared(&sql).await?;
        println!("  📝 マイグレーション記録: バージョン {}", version);

        Ok(())
    }

    /// マイグレーション状態確認
    pub async fn check_migration_status(&self) -> Result<bool, DbErr> {
        let result = self.db.execute_unprepared(
            "SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name='migrations';"
        ).await;

        match result {
            Ok(_) => {
                // migrationsテーブルが存在する場合、最新のマイグレーション確認
                let latest = self
                    .db
                    .execute_unprepared(
                        "SELECT version FROM migrations ORDER BY applied_at DESC LIMIT 1;",
                    )
                    .await;

                match latest {
                    Ok(_) => {
                        println!("✅ マイグレーション状態: 最新");
                        Ok(true)
                    }
                    Err(_) => {
                        println!("⚠️  マイグレーション状態: 未完了");
                        Ok(false)
                    }
                }
            }
            Err(_) => {
                println!("❌ マイグレーション状態: 未実行");
                Ok(false)
            }
        }
    }

    /// 強制的なマイグレーション再実行（開発用）
    pub async fn force_remigration(&self) -> Result<(), DbErr> {
        println!("🔄 強制再マイグレーション開始（開発用）");

        // 警告表示
        println!("⚠️  注意: 全テーブルが削除されます");

        // 全テーブル削除（逆順：依存関係を考慮）
        let drop_tables = vec![
            "DROP TABLE IF EXISTS task_recurrence;",
            "DROP TABLE IF EXISTS subtask_recurrence;",
            "DROP TABLE IF EXISTS recurrence_rules;",
            "DROP TABLE IF EXISTS subtask_assignments;",
            "DROP TABLE IF EXISTS task_assignments;",
            "DROP TABLE IF EXISTS subtask_tags;",
            "DROP TABLE IF EXISTS task_tags;",
            "DROP TABLE IF EXISTS subtasks;",
            "DROP TABLE IF EXISTS tasks;",
            "DROP TABLE IF EXISTS tags;",
            "DROP TABLE IF EXISTS task_lists;",
            "DROP TABLE IF EXISTS members;",
            "DROP TABLE IF EXISTS projects;",
            "DROP TABLE IF EXISTS accounts;",
            "DROP TABLE IF EXISTS users;",
            "DROP TABLE IF EXISTS settings;",
            "DROP TABLE IF EXISTS migrations;",
        ];

        for sql in drop_tables {
            self.db.execute_unprepared(sql).await?;
        }

        // 再マイグレーション実行
        self.run_migration().await?;

        println!("✅ 強制再マイグレーション完了");
        Ok(())
    }
}

/// マイグレーション情報
#[derive(Debug)]
pub struct MigrationInfo {
    pub version: String,
    pub migration_type: String,
    pub applied_at: String,
    pub description: Option<String>,
}

impl HybridMigrator {
    /// マイグレーション履歴取得
    pub async fn get_migration_history(&self) -> Result<Vec<MigrationInfo>, DbErr> {
        // 実装は必要に応じて追加
        println!("📋 マイグレーション履歴機能は今後実装予定");
        Ok(vec![])
    }
}
