use flequit_model::models::app_settings::datetime_format::DateTimeFormat;
use flequit_model::types::datetime_format_types::DateTimeFormatGroup;
use serde::{Deserialize, Serialize};

/// DateTimeFormat用Automergeエンティティ定義
///
/// 日時フォーマット設定のAutoMergeデータ構造
/// 分散環境での同期とコンフリクト解決に対応
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct DateTimeFormatDocument {
    /// 日時フォーマットID
    pub id: String,

    /// フォーマット名（表示用）
    pub name: String,

    /// 実際の日時フォーマット文字列（cron形式）
    pub format: String,

    /// フォーマットグループ
    pub group: DateTimeFormatGroup,

    /// 表示順序
    pub order: i32,
}

impl DateTimeFormatDocument {
    /// ドメインモデルからAutomergeドキュメントに変換
    pub fn from_domain_model(format: DateTimeFormat) -> Self {
        Self {
            id: format.id,
            name: format.name,
            format: format.format,
            group: format.group,
            order: format.order,
        }
    }

    /// Automergeドキュメントからドメインモデルに変換
    pub fn to_domain_model(&self) -> Result<DateTimeFormat, String> {
        Ok(DateTimeFormat {
            id: self.id.clone(),
            name: self.name.clone(),
            format: self.format.clone(),
            group: self.group.clone(),
            order: self.order,
        })
    }
}
