//! 設定管理モデル
//! 
//! このモジュールはアプリケーションの設定情報を管理する構造体を定義します。
//! 
//! ## 概要
//! 
//! 設定管理では以下3つの主要構造体を提供：
//! - `LocalSettings`: ローカル環境固有の設定（テーマ、言語等）
//! - `Setting`: 汎用的なキー・バリュー型設定
//! - `SettingResponse`: 設定操作のレスポンス用構造体

use serde::{Serialize, Deserialize};

use crate::models::{command::setting::{LocalSettingsCommand, SettingCommand}, CommandModelConverter};

/// ローカル環境固有の設定情報を表現する構造体
/// 
/// アプリケーション初期化時に使用される基本的な環境設定を管理します。
/// ユーザーの環境設定やプリファレンスに関わる情報を含みます。
/// 
/// # フィールド
/// 
/// * `theme` - UIテーマ設定（"light", "dark", "system"等）
/// * `language` - 表示言語設定（"ja", "en"等、ISO 639-1形式）
/// 
/// # 使用場面
/// 
/// - アプリケーション起動時の初期化
/// - ユーザー設定画面での表示・変更
/// - 設定のローカルファイル保存・読み込み
/// 
/// # 設計思想
/// 
/// - **軽量性**: 頻繁にアクセスされる基本設定のみを含む
/// - **初期化特化**: アプリケーション起動時の迅速な読み込み
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LocalSettings {
    /// UIテーマ設定（"light", "dark", "system"等）
    pub theme: String,
    /// 表示言語設定（"ja", "en"等、ISO 639-1形式）
    pub language: String,
}

/// 汎用的なキー・バリュー型設定情報を表現する構造体
/// 
/// アプリケーションの拡張可能な設定項目を管理します。
/// 文字列ベースで柔軟性を重視した設計となっています。
/// 
/// # フィールド
/// 
/// * `id` - 設定項目の一意識別子
/// * `key` - 設定キー（ドット記法推奨："ui.theme", "notification.email"等）
/// * `value` - 設定値（文字列として保存、型変換は利用側で実施）
/// * `data_type` - 値の型情報（"string", "number", "boolean", "json"等）
/// * `created_at` - 設定作成日時（文字列形式）
/// * `updated_at` - 最終更新日時（文字列形式）
/// 
/// # 型変換について
/// 
/// `data_type`フィールドにより型情報を保持し、
/// アプリケーション側で適切な型変換を行う設計です。
/// 
/// # 使用例
/// 
/// ```rust
/// let setting = Setting {
///     id: "setting_theme".to_string(),
///     key: "ui.theme".to_string(),
///     value: "dark".to_string(),
///     data_type: "string".to_string(),
///     created_at: "2023-12-01T10:30:00Z".to_string(),
///     updated_at: "2023-12-01T10:30:00Z".to_string(),
/// };
/// ```
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Setting {
    /// 設定項目の一意識別子
    pub id: String,
    /// 設定キー（ドット記法推奨："ui.theme", "notification.email"等）
    pub key: String,
    /// 設定値（文字列として保存、型変換は利用側で実施）
    pub value: String,
    /// 値の型情報（"string", "number", "boolean", "json"等）
    pub data_type: String,
    /// 設定作成日時（文字列形式）
    pub created_at: String,
    /// 最終更新日時（文字列形式）
    pub updated_at: String,
}

/// 設定操作のレスポンス用構造体
/// 
/// 設定の取得・更新・削除操作の結果を統一的に返すための構造体です。
/// 成功・失敗の状態とともに、データやメッセージを含みます。
/// 
/// # フィールド
/// 
/// * `success` - 操作の成功・失敗フラグ
/// * `data` - 取得または更新された設定データ（操作に応じてOptional）
/// * `message` - エラー情報や追加メッセージ（Optional）
/// 
/// # 使用場面
/// 
/// - 設定取得APIのレスポンス
/// - 設定更新操作の結果通知
/// - エラーハンドリング用のメッセージ返却
#[derive(Debug, Serialize, Deserialize)]
pub struct SettingResponse {
    /// 操作の成功・失敗フラグ
    pub success: bool,
    /// 取得または更新された設定データ（操作に応じてOptional）
    pub data: Option<Setting>,
    /// エラー情報や追加メッセージ
    pub message: Option<String>,
}

impl CommandModelConverter<LocalSettingsCommand> for LocalSettings {
    async fn to_command_model(&self) -> Result<LocalSettingsCommand, String> {
        Ok(LocalSettingsCommand {
            theme: self.theme.clone(),
            language: self.language.clone(),
        })
    }
}

impl CommandModelConverter<SettingCommand> for Setting {
    async fn to_command_model(&self) -> Result<SettingCommand, String> {
        Ok(SettingCommand {
            id: self.id.clone(),
            key: self.key.clone(),
            value: self.value.clone(),
            data_type: self.data_type.clone(),
            created_at: self.created_at.clone(),
            updated_at: self.updated_at.clone(),
        })
    }
}