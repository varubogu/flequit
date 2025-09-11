//! 設定管理エラー定義

use thiserror::Error;

/// 設定管理に関するエラー
#[derive(Error, Debug)]
pub enum SettingsError {
    #[error("設定ファイルが見つかりません: {path}")]
    FileNotFound { path: String },

    #[error("設定ファイルの読み取りに失敗しました: {source}")]
    ReadError {
        #[from]
        source: std::io::Error,
    },

    #[error("YAML解析に失敗しました: {source}")]
    YamlParseError {
        #[from]
        source: serde_yaml::Error,
    },

    #[error("設定値の検証に失敗しました: {message}")]
    ValidationError { message: String },

    #[error("設定ディレクトリの作成に失敗しました: {path}")]
    DirectoryCreationError { path: String },

    #[error("設定ファイルの書き込みに失敗しました: {path}")]
    WriteError { path: String },

    #[error("設定パスの取得に失敗しました")]
    PathError,
}

/// 設定管理の結果型
pub type SettingsResult<T> = Result<T, SettingsError>;
