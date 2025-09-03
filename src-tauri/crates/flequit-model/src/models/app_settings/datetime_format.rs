//! 統合日時フォーマット管理モデル
//!
//! このモジュールは統合日時表示フォーマットを管理する構造体を定義します。

use crate::types::datetime_format_types::DateTimeFormatGroup;
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
/// # use flequit_model::models::datetime_format::DateTimeFormat;
/// # use flequit_model::types::datetime_format_types::DateTimeFormatGroup;
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
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
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
