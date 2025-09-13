//! テストビルド用マイグレーション実行バイナリ
//!
//! build.rsから呼び出され、指定されたパスにSQLiteデータベースを作成し、
//! マイグレーションを実行する。

use flequit_infrastructure_sqlite::infrastructure::{
    database_manager::DatabaseManager, hybrid_migration::HybridMigrator,
};
use std::env;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let args: Vec<String> = env::args().collect();

    if args.len() < 2 || args.len() > 3 {
        eprintln!("Usage: migration_runner <database_path> [--force]");
        std::process::exit(1);
    }

    let db_path = &args[1];
    let force_mode = args.len() == 3 && args[2] == "--force";
    
    if force_mode {
        println!("🔄 強制マイグレーション実行開始: {}", db_path);
    } else {
        println!("🔧 マイグレーション実行開始: {}", db_path);
    }

    // 環境変数でデータベースパスを指定
    env::set_var("FLEQUIT_DB_PATH", db_path);

    // DatabaseManagerを作成（シングルトンではない新しいインスタンスが必要）
    let db_manager = DatabaseManager::new_for_test(db_path);

    // マイグレーション実行
    let migrator = HybridMigrator::new(db_manager.get_connection().await?.clone());
    
    if force_mode {
        migrator.force_remigration().await?;
    } else {
        migrator.run_migration().await?;
    }

    println!("✅ マイグレーション完了: {}", db_path);

    Ok(())
}
