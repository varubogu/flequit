//! テストビルド用マイグレーション実行バイナリ
//!
//! build.rsから呼び出され、指定されたパスにSQLiteデータベースを作成し、
//! マイグレーションを実行する。

use std::env;
use flequit_storage::repositories::local_sqlite::{
    database_manager::DatabaseManager,
    hybrid_migration::HybridMigrator
};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let args: Vec<String> = env::args().collect();

    if args.len() != 2 {
        eprintln!("Usage: migration_runner <database_path>");
        std::process::exit(1);
    }

    let db_path = &args[1];
    println!("🔧 マイグレーション実行開始: {}", db_path);

    // 環境変数でデータベースパスを指定
    env::set_var("FLEQUIT_DB_PATH", db_path);

    // DatabaseManagerを作成（シングルトンではない新しいインスタンスが必要）
    let db_manager = DatabaseManager::new_for_test(db_path);

    // マイグレーション実行
    let migrator = HybridMigrator::new(db_manager.get_connection().await?.clone());
    migrator.run_migration().await?;

    println!("✅ マイグレーション完了: {}", db_path);

    Ok(())
}
