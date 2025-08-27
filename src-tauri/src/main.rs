// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    // ログ初期化
    if let Err(e) = init_logging() {
        eprintln!("Failed to initialize logging: {}", e);
    }

    // アプリケーション開始ログ
    tracing::info!("🚀 Flequit application starting...");
    
    // テストログ（デバッグ用）
    flequit_lib::logger::test_logging();
    
    flequit_lib::run()
}

fn init_logging() -> Result<(), Box<dyn std::error::Error>> {
    let log_dir = flequit_lib::logger::get_log_directory().ok();
    flequit_lib::logger::init_logger(log_dir, "flequit")?;
    Ok(())
}
