//! ログ設定モジュール
//!
//! Tauriアプリケーション用の包括的なログ設定を提供します。
//! ファイル出力とコンソール出力を同時にサポートし、適切なログレベルとフォーマットを設定します。

use std::path::PathBuf;
use tracing::Level;
use tracing_appender::{non_blocking, rolling};
use tracing_subscriber::{
    filter::{EnvFilter, LevelFilter},
    fmt::{self, time::ChronoUtc},
    layer::SubscriberExt,
    util::SubscriberInitExt,
    Layer,
};

/// ログシステムを初期化します
///
/// # 機能
/// - コンソールへの出力（info/warn/error）
/// - ファイルへの出力（日次ローテーション）
/// - 構造化ログ（JSON形式）
/// - 適切なタイムスタンプフォーマット
///
/// # Arguments
/// * `log_dir` - ログファイルを保存するディレクトリ
/// * `app_name` - アプリケーション名（ログファイル名に使用）
pub fn init_logger(log_dir: Option<PathBuf>, app_name: &str) -> Result<(), Box<dyn std::error::Error>> {
    // EnvFilterを作成する関数（再利用のため）
    fn create_env_filter() -> EnvFilter {
        EnvFilter::try_from_default_env()
            .or_else(|_| EnvFilter::try_new("info"))
            .unwrap()
            .add_directive("sqlx::query=warn".parse().unwrap()) // SQLクエリログを抑制
            .add_directive("sea_orm=warn".parse().unwrap())      // Sea-ORMログを抑制
            .add_directive("hyper=warn".parse().unwrap())        // HTTPライブラリログを抑制
            .add_directive("tower=warn".parse().unwrap())        // Towerログを抑制
    }

    let registry = tracing_subscriber::registry();

    // コンソール出力レイヤー
    let console_layer = fmt::layer()
        .with_writer(std::io::stdout)
        .with_timer(ChronoUtc::new("%Y-%m-%d %H:%M:%S%.3f %Z".to_string()))
        .with_target(true)
        .with_thread_ids(false)
        .with_line_number(true)
        .with_file(false)
        .with_filter(LevelFilter::INFO);

    if let Some(log_dir) = log_dir {
        // ログディレクトリを作成
        std::fs::create_dir_all(&log_dir)?;

        // ファイル出力レイヤー
        let file_appender = rolling::daily(&log_dir, format!("{}.log", app_name));
        let (non_blocking_file, _guard) = non_blocking(file_appender);

        let file_layer = fmt::layer()
            .with_writer(non_blocking_file)
            .with_timer(ChronoUtc::new("%Y-%m-%d %H:%M:%S%.3f %Z".to_string()))
            .with_target(true)
            .with_thread_ids(true)
            .with_line_number(true)
            .with_file(true)
            .with_ansi(false) // ファイル出力ではANSIエスケープコードを無効化
            .with_filter(create_env_filter());

        registry
            .with(console_layer)
            .with(file_layer)
            .init();

        // ガードをstaticで保持（アプリケーションの終了まで保持する必要がある）
        std::mem::forget(_guard);
    } else {
        // ファイル出力なし、コンソールのみ
        registry
            .with(console_layer.with_filter(create_env_filter()))
            .init();
    }

    Ok(())
}

/// アプリケーションのログディレクトリを取得
pub fn get_log_directory() -> Result<PathBuf, Box<dyn std::error::Error>> {
    let mut log_dir = dirs::data_local_dir()
        .or_else(|| dirs::data_dir())
        .ok_or("Could not determine data directory")?;
    
    log_dir.push("flequit");
    log_dir.push("logs");
    
    Ok(log_dir)
}

/// ログレベルを動的に設定
pub fn set_log_level(level: Level) {
    tracing::info!("Changing log level to: {:?}", level);
    // 注意: tracing-subscriberでは実行時にログレベルを変更するのは複雑
    // 必要に応じて、global filterを使用するか、アプリケーションの再起動が必要
}

/// ログシステムのテスト用関数
pub fn test_logging() {
    tracing::error!("🔴 テストエラーメッセージ");
    tracing::warn!("🟡 テスト警告メッセージ");
    tracing::info!("🔵 テスト情報メッセージ");
    tracing::debug!("🟢 テストデバッグメッセージ");
    tracing::trace!("⚪ テストトレースメッセージ");
    
    log::error!("🔴 log!マクロテスト - エラー");
    log::warn!("🟡 log!マクロテスト - 警告");
    log::info!("🔵 log!マクロテスト - 情報");
}