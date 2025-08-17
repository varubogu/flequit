//! ハイブリッドマイグレーションの使用例
//!
//! cargo run --example hybrid_migration_example

use flequit::repositories::local_sqlite::{
    DatabaseManager,
    hybrid_migration::HybridMigrator,
    migration_cli::run_migration_command,
};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    env_logger::init();
    
    let database_path = "examples/hybrid_test.db";
    
    println!("🚀 ハイブリッドマイグレーション使用例");
    
    // 1. 基本的な使用方法
    basic_migration_example(database_path).await?;
    
    // 2. CLI使用例
    cli_example(database_path).await?;
    
    // 3. 開発ワークフロー例
    development_workflow_example(database_path).await?;

    Ok(())
}

/// 基本的なマイグレーション例
async fn basic_migration_example(database_path: &str) -> Result<(), Box<dyn std::error::Error>> {
    println!("\n📝 1. 基本的なマイグレーション");
    
    // DatabaseManagerを使用（自動でマイグレーション実行）
    let db_manager = DatabaseManager::new(database_path);
    let _db = db_manager.get_connection().await?;
    
    println!("✅ DatabaseManager経由でマイグレーション完了");
    
    Ok(())
}

/// CLI使用例
async fn cli_example(database_path: &str) -> Result<(), Box<dyn std::error::Error>> {
    println!("\n📝 2. CLI使用例");
    
    // 状態確認
    run_migration_command("status", database_path).await?;
    
    // 履歴確認
    run_migration_command("history", database_path).await?;
    
    println!("✅ CLI操作完了");
    
    Ok(())
}

/// 開発ワークフロー例
async fn development_workflow_example(database_path: &str) -> Result<(), Box<dyn std::error::Error>> {
    println!("\n📝 3. 開発ワークフロー例");
    
    let db_manager = DatabaseManager::new(database_path);
    let db = db_manager.get_connection().await?;
    let migrator = HybridMigrator::new(db.clone());
    
    // 開発中のスキーマ変更時
    println!("🔄 開発中のスキーマ変更をシミュレート");
    
    // 1. 現在の状態確認
    let is_current = migrator.check_migration_status().await?;
    println!("📋 現在の状態: {}", if is_current { "最新" } else { "要更新" });
    
    // 2. 必要に応じてマイグレーション実行
    if !is_current {
        migrator.run_migration().await?;
        println!("✅ マイグレーション実行完了");
    }
    
    // 3. エンティティ追加時の対応例
    simulate_entity_addition().await?;
    
    println!("✅ 開発ワークフロー完了");
    
    Ok(())
}

/// エンティティ追加時のシミュレーション
async fn simulate_entity_addition() -> Result<(), Box<dyn std::error::Error>> {
    println!("🆕 新エンティティ追加シミュレーション");
    
    println!("  1. 新しいエンティティ定義を作成");
    println!("  2. #[sea_orm(indexed)]などの属性を設定");
    println!("  3. 必要に応じて手動補完用の制約を hybrid_migration.rs に追加");
    println!("  4. マイグレーション実行");
    
    // 実際の実装では：
    // - 新しいエンティティファイル作成
    // - hybrid_migration.rs の entities ベクターに追加
    // - 必要な制約を manual_supplements に追加
    
    println!("✅ 新エンティティ追加プロセス完了");
    
    Ok(())
}

/// 実際の使用パターン例
#[allow(dead_code)]
async fn production_usage_pattern() -> Result<(), Box<dyn std::error::Error>> {
    println!("\n📝 本番使用パターン例");
    
    // アプリケーション起動時
    let database_path = "app_data/flequit.db";
    let db_manager = DatabaseManager::new(database_path);
    
    // 接続取得（自動でマイグレーションチェック・実行）
    let db = db_manager.get_connection().await?;
    println!("🚀 アプリケーション開始 - データベース準備完了");
    
    // リポジトリ初期化
    use flequit::repositories::local_sqlite::settings_repository::SettingsRepository;
    let settings_repo = SettingsRepository::new(db_manager);
    
    // 設定初期化
    let _settings = settings_repo.initialize_settings().await?;
    println!("⚙️  設定初期化完了");
    
    // アプリケーション終了時
    let _cleanup = db_manager.close().await;
    println!("🛑 アプリケーション終了 - データベース接続クローズ");
    
    Ok(())
}