//! 日付と時刻の表示フォーマットに関連する型を定義します。
use serde::{Deserialize, Serialize};

/// 日付時刻のフォーマットグループを示します。
#[derive(Debug, Clone, Eq, PartialEq, Serialize, Deserialize, Default)]
pub enum DateTimeFormatGroup {
    /// デフォルト設定
    #[default]
    Default,
    /// プリセット選択
    Preset,
    /// カスタム設定
    Custom,
    /// カスタム書式文字列
    CustomFormat,
}
