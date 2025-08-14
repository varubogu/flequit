//! 自動生成と手動SQLの比較用実装
//!
//! Sea-ORMの自動生成でできること・できないことを具体的に確認

use sea_orm::{DatabaseConnection, DbErr, Schema, DbBackend};
use sea_orm::sea_query::{Index, ForeignKey, ForeignKeyAction, ColumnDef, SqliteQueryBuilder};

use crate::models::sqlite::{
    setting::Entity as SettingsEntity,
    account::Entity as AccountEntity,
    project::Entity as ProjectEntity,
    task_list::Entity as TaskListEntity,
    task::Entity as TaskEntity,
    subtask::Entity as SubtaskEntity,
    tag::Entity as TagEntity,
};

/// 1. 自動生成される部分（Sea-ORMのSchema Builder）
pub async fn auto_generated_tables(db: &DatabaseConnection) -> Result<(), DbErr> {
    let schema = Schema::new(DbBackend::Sqlite);
    
    // ✅ これらは自動生成される
    let statements = vec![
        schema.create_table_from_entity(SettingsEntity),
        schema.create_table_from_entity(AccountEntity),
        schema.create_table_from_entity(ProjectEntity), 
        schema.create_table_from_entity(TaskListEntity),
        schema.create_table_from_entity(TaskEntity),
        schema.create_table_from_entity(SubtaskEntity),
        schema.create_table_from_entity(TagEntity),
    ];

    for stmt in statements {
        let sql = stmt.to_string(SqliteQueryBuilder);
        println!("自動生成SQL: {}", sql);
        db.execute(db.get_database_backend().build(&stmt)).await?;
    }

    Ok(())
}

/// 2. 手動補完が必要な部分
pub async fn manual_supplement_required(db: &DatabaseConnection) -> Result<(), DbErr> {
    
    // ❌ 複合ユニークインデックス（手動補完必須）
    let account_unique_index = Index::create()
        .name("idx_accounts_provider_account")
        .table(AccountEntity)
        .col(crate::models::sqlite::account::Column::Provider)
        .col(crate::models::sqlite::account::Column::ProviderId)
        .unique()
        .to_owned();
    
    db.execute(db.get_database_backend().build(&account_unique_index)).await?;

    // ❌ FOREIGN KEY with CASCADE（手動補完必須）
    // 注意: Sea-ORMのSchema Builderでは外部キーのCASCADEオプションが生成されないため、
    // ALTER TABLE文で追加する必要がある
    
    let cascade_constraints = vec![
        // task_lists.project_id -> projects.id ON DELETE CASCADE
        "ALTER TABLE task_lists ADD CONSTRAINT fk_task_lists_project 
         FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;",
        
        // tasks.project_id -> projects.id ON DELETE CASCADE  
        "ALTER TABLE tasks ADD CONSTRAINT fk_tasks_project
         FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;",
         
        // tasks.list_id -> task_lists.id ON DELETE CASCADE
        "ALTER TABLE tasks ADD CONSTRAINT fk_tasks_list
         FOREIGN KEY (list_id) REFERENCES task_lists(id) ON DELETE CASCADE;",
         
        // subtasks.task_id -> tasks.id ON DELETE CASCADE
        "ALTER TABLE subtasks ADD CONSTRAINT fk_subtasks_task
         FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE;",
    ];

    for sql in cascade_constraints {
        db.execute_unprepared(sql).await?;
    }

    Ok(())
}

/// 3. 比較結果の出力
pub fn print_comparison() {
    println!("=== Sea-ORM自動生成 vs 手動SQL比較 ===\n");

    println!("✅ 自動生成で対応可能:");
    println!("- 基本的なテーブル構造（CREATE TABLE）");
    println!("- PRIMARY KEY制約");
    println!("- 単一カラムのINDEX（#[sea_orm(indexed)]）");
    println!("- UNIQUE制約（#[sea_orm(unique)]）");
    println!("- NOT NULL制約");
    println!("- 基本的なデータ型");
    println!("- 基本的なFOREIGN KEY制約\n");

    println!("❌ 手動補完が必要:");
    println!("- 複合ユニークインデックス");
    println!("- FOREIGN KEY の CASCADE/SET NULL オプション");
    println!("- カスタムインデックス名");
    println!("- DEFAULT CURRENT_TIMESTAMP");
    println!("- 複雑なCHECK制約");
    println!("- 初期データの挿入\n");

    println!("⚠️  移行時の注意点:");
    println!("- 既存データの整合性チェック");
    println!("- マイグレーション履歴の管理");
    println!("- パフォーマンステスト（インデックス効果の検証）");
    println!("- ロールバック戦略の準備");
}

/// 4. 推奨実装パターン
pub struct HybridMigration {
    pub use_auto_generation: bool,
    pub manual_supplements: Vec<String>,
}

impl HybridMigration {
    pub fn new() -> Self {
        Self {
            use_auto_generation: true,
            manual_supplements: vec![
                "複合ユニークインデックス".to_string(),
                "CASCADE制約".to_string(),
                "カスタムDEFAULT値".to_string(),
            ],
        }
    }

    pub async fn run(&self, db: &DatabaseConnection) -> Result<(), DbErr> {
        if self.use_auto_generation {
            println!("🔄 自動生成でテーブル作成中...");
            auto_generated_tables(db).await?;
            
            println!("🔧 手動補完を適用中...");
            manual_supplement_required(db).await?;
            
            println!("✅ ハイブリッドマイグレーション完了");
        }
        
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use sea_orm::{Database, DatabaseConnection};

    async fn setup_test_db() -> DatabaseConnection {
        Database::connect("sqlite::memory:").await.unwrap()
    }

    #[tokio::test]
    async fn test_hybrid_migration() {
        let db = setup_test_db().await;
        let migration = HybridMigration::new();
        
        // 実際のマイグレーション実行
        migration.run(&db).await.unwrap();
        
        // テーブル存在確認などのテストを追加可能
    }
}