//! 日時フォーマット管理モデル
//!
//! このモジュールはアプリケーション全体で使用される日時表示フォーマットを管理する構造体を定義します。
//!
//! ## 概要
//!
//! 日時フォーマット管理では以下3つの主要構造体を提供：
//! - `DateTimeFormat`: 統合フォーマット管理（プリセット・カスタム共通）
//! - `AppPresetFormat`: アプリケーション標準プリセットフォーマット
//! - `CustomDateTimeFormat`: ユーザー定義カスタムフォーマット

use super::super::types::datetime_format_types::DateTimeFormatGroup;
use serde::{Deserialize, Serialize};

/// 統合日時フォーマット情報を表現する構造体
///
/// アプリケーション内で使用される日時表示フォーマットの統一管理を行います。
/// プリセットフォーマットとカスタムフォーマットの両方を扱う汎用構造体です。
///
/// # フィールド
///
/// * `id` - フォーマットの一意識別子（UUID文字列またはプリセットの負数文字列）
/// * `name` - フォーマット表示名（ユーザーが選択時に見る名前）
/// * `format` - 実際の日時フォーマット文字列（chrono形式）
/// * `group` - フォーマットグループ（プリセット・カスタム等の分類）
/// * `order` - 表示順序（昇順ソート用、UI選択肢での順番）
///
/// # ID規則
///
/// - **プリセット**: 負の整数の文字列表現（"-1", "-2"等）
/// - **カスタム**: UUID文字列（"550e8400-e29b-41d4-a716-446655440000"等）
///
/// # 設計思想
///
/// - **統一管理**: プリセットとカスタムを区別なく扱える
/// - **多言語対応**: 国際化を前提とした表示名管理
/// - **UI最適化**: フロントエンドでの選択・表示に最適化
/// - **拡張性**: 新しいフォーマットグループの追加が容易
///
/// # 使用例
///
/// ```rust,no_run
/// # use flequit_lib::models::datetime_format::DateTimeFormat;
/// # use flequit_lib::types::datetime_format_types::DateTimeFormatGroup;
///
/// // プリセットフォーマット
/// let preset_format = DateTimeFormat {
///     id: "-1".to_string(),
///     name: "標準（YYYY-MM-DD HH:mm）".to_string(),
///     format: "%Y-%m-%d %H:%M".to_string(),
///     group: DateTimeFormatGroup::Preset,
///     order: 1,
/// };
///
/// // カスタムフォーマット
/// let custom_format = DateTimeFormat {
///     id: "550e8400-e29b-41d4-a716-446655440000".to_string(),
///     name: "業務用フォーマット".to_string(),
///     format: "%Y年%m月%d日（%a）%H時%M分".to_string(),
///     group: DateTimeFormatGroup::CustomFormat,
///     order: 10,
/// };
/// ```
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DateTimeFormat {
    /// フォーマットの一意識別子（UUID文字列またはプリセットの負数文字列）
    pub id: String, // UUIDまたは負の整数の文字列表現
    /// フォーマット表示名（ユーザーが選択時に見る名前）
    pub name: String,
    /// 実際の日時フォーマット文字列（chrono形式）
    pub format: String,
    /// フォーマットグループ（プリセット・カスタム等の分類）
    pub group: DateTimeFormatGroup,
    /// 表示順序（昇順ソート用、UI選択肢での順番）
    pub order: i32,
}

/// アプリケーション標準プリセットフォーマットを表現する構造体
///
/// システムに組み込まれた標準的な日時フォーマット定義です。
/// 負の整数IDを持ち、ユーザーが削除・変更できない固定フォーマットです。
///
/// # フィールド
///
/// * `id` - プリセットID（負の整数、"-1", "-2"等に対応）
/// * `name` - フォーマット表示名（多言語対応前提）
/// * `format` - chrono形式の日時フォーマット文字列
/// * `group` - フォーマットグループ（通常はPreset）
/// * `order` - 表示順序（UI選択肢での優先順位）
///
/// # ID規則
///
/// プリセットIDは負の整数で管理され、以下のような用途別分類を推奨：
/// - -1〜-10: 基本的な日時フォーマット
/// - -11〜-20: 日付のみフォーマット
/// - -21〜-30: 時刻のみフォーマット
/// - -31以降: 特殊用途フォーマット
///
/// # 設計思想
///
/// - **不変性**: ユーザーが変更・削除できない安定したフォーマット
/// - **国際化**: 多言語環境での標準的な表示形式を提供
/// - **即座に利用可能**: アプリケーション初回起動時から使用可能
///
/// # 使用例
///
/// ```rust,no_run
/// # use flequit_lib::models::datetime_format::AppPresetFormat;
/// # use flequit_lib::types::datetime_format_types::DateTimeFormatGroup;
///
/// let standard_preset = AppPresetFormat {
///     id: -1,
///     name: "標準（YYYY-MM-DD HH:mm）".to_string(),
///     format: "%Y-%m-%d %H:%M".to_string(),
///     group: DateTimeFormatGroup::Preset,
///     order: 1,
/// };
/// ```
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppPresetFormat {
    /// プリセットID（負の整数、"-1", "-2"等に対応）
    pub id: i32, // 負の整数
    /// フォーマット表示名（多言語対応前提）
    pub name: String,
    /// chrono形式の日時フォーマット文字列
    pub format: String,
    /// フォーマットグループ（通常はPreset）
    pub group: DateTimeFormatGroup,
    /// 表示順序（UI選択肢での優先順位）
    pub order: i32,
}

/// ユーザー定義カスタム日時フォーマットを表現する構造体
///
/// ユーザーが独自に作成・編集・削除可能な日時フォーマット定義です。
/// UUID文字列をIDに持ち、個人の好みや特殊な業務要件に対応します。
///
/// # フィールド
///
/// * `id` - カスタムフォーマットID（UUID文字列）
/// * `name` - ユーザーが定義したフォーマット表示名
/// * `format` - chrono形式の日時フォーマット文字列
/// * `group` - フォーマットグループ（常にCustomFormatを想定）
/// * `order` - 表示順序（ユーザーが自由に設定）
///
/// # 設計思想
///
/// - **ユーザー制御**: 作成・編集・削除の完全な制御権
/// - **個別最適化**: 個人や組織固有の表示形式に対応
/// - **永続性**: ローカル/クラウドストレージでの保存
/// - **検証機能**: 無効なフォーマット文字列の検出・警告
///
/// # バリデーション
///
/// カスタムフォーマットは以下の検証が推奨されます：
/// - chronoフォーマット文字列の構文チェック
/// - 実際の日時での表示テスト
/// - 特殊文字・エスケープシーケンスの確認
///
/// # 使用例
///
/// ```rust,no_run
/// # use flequit_lib::models::datetime_format::CustomDateTimeFormat;
/// # use flequit_lib::types::datetime_format_types::DateTimeFormatGroup;
///
/// let business_format = CustomDateTimeFormat {
///     id: "550e8400-e29b-41d4-a716-446655440000".to_string(),
///     name: "営業レポート用".to_string(),
///     format: "%Y年%m月%d日（%a） %H時%M分".to_string(),
///     group: DateTimeFormatGroup::CustomFormat,
///     order: 5,
/// };
/// ```
///
/// # ライフサイクル
///
/// 1. ユーザーがフォーマット作成画面でformat文字列を入力
/// 2. バリデーションでformat文字列の有効性を検証
/// 3. UUIDを生成してCustomDateTimeFormatを作成
/// 4. データベース/設定ファイルに永続化
/// 5. UI選択肢に追加して即座に利用可能
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CustomDateTimeFormat {
    /// カスタムフォーマットID（UUID文字列）
    pub id: String, // UUID
    /// ユーザーが定義したフォーマット表示名
    pub name: String,
    /// chrono形式の日時フォーマット文字列
    pub format: String,
    /// フォーマットグループ（常にCustomFormatを想定）
    pub group: DateTimeFormatGroup, // 常に CustomFormat
    /// 表示順序（ユーザーが自由に設定）
    pub order: i32,
}
