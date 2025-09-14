//! Flequit設定管理クレート
//!
//! このクレートはFlequitアプリケーションの設定管理を統一的に行います。
//!
//! # 主な機能
//!
//! - 設定値の構造体定義
//! - YAML形式での設定ファイル読み書き
//! - OS固有の設定フォルダ管理
//! - 設定値の検証
//!
//! # 使用例
//!
//! ```rust,no_run
//! use flequit_settings::{SettingsManager, Settings};
//!
//! #[tokio::main]
//! async fn main() {
//!     // 設定マネージャーを作成（設定フォルダがない場合は自動作成）
//!     let settings_manager = SettingsManager::new().unwrap();
//!
//!     // 設定を読み込み（ファイルがない場合は自動的にデフォルト設定ファイルを作成）
//!     let settings = settings_manager.load_settings().await.unwrap();
//!
//!     // 設定を変更
//!     let mut new_settings = settings;
//!     new_settings.theme = "dark".to_string();
//!
//!     // 設定を保存
//!     settings_manager.save_settings(&new_settings).await.unwrap();
//! }
//! ```
//!
//! # 自動初期化機能
//!
//! `load_settings()`メソッドは以下の動作を行います：
//!
//! 1. 設定ファイルが存在する場合：ファイルを読み込んで内容を返す
//! 2. 設定ファイルが存在しない場合：
//!    - 設定フォルダが存在しない場合は作成
//!    - デフォルト設定でsettings.ymlファイルを作成
//!    - 作成したデフォルト設定を返す
//!
//! これにより、初回実行時でも自動的に設定ファイルが作成され、
//! ユーザーは設定ファイルの存在を意識することなく設定管理機能を使用できます。

pub mod errors;
pub mod manager;
pub mod models;
pub mod paths;
pub mod types;
pub mod validation;

// 公開API
pub use errors::{SettingsError, SettingsResult};
pub use manager::SettingsManager;
pub use models::datetime_format::DateTimeFormat;
pub use models::due_date_buttons::DueDateButtons;
pub use models::settings::{Settings, PartialSettings};
pub use models::time_label::TimeLabel;
pub use models::view_item::ViewItem;
