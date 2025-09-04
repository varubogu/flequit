//! Project AutoMergeモデル
//! 
//! SQLite projectテーブルと同じ構造を持つAutoMerge用データ構造

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

/// Project AutoMergeモデル
/// SQLite projects テーブルに対応
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct AutoMergeProject {
    /// プロジェクトの一意識別子
    pub id: String,
    /// プロジェクト名
    pub name: String,
    /// プロジェクト説明
    pub description: Option<String>,
    /// UI表示用のカラーコード
    pub color: Option<String>,
    /// 表示順序
    pub order_index: i32,
    /// アーカイブ状態フラグ
    pub is_archived: bool,
    /// プロジェクトステータス（文字列形式、Optional）
    pub status: Option<String>,
    /// プロジェクトオーナーのユーザーID
    pub owner_id: Option<String>,
    /// 作成日時
    pub created_at: DateTime<Utc>,
    /// 更新日時
    pub updated_at: DateTime<Utc>,
}

impl AutoMergeProject {
    /// 新しいプロジェクトを作成
    pub fn new(
        id: String,
        name: String,
        description: Option<String>,
        color: Option<String>,
        order_index: i32,
        status: Option<String>,
        owner_id: Option<String>,
    ) -> Self {
        let now = Utc::now();
        Self {
            id,
            name,
            description,
            color,
            order_index,
            is_archived: false,
            status,
            owner_id,
            created_at: now,
            updated_at: now,
        }
    }

    /// プロジェクト情報を更新
    pub fn update(&mut self, 
        name: Option<String>,
        description: Option<Option<String>>,
        color: Option<Option<String>>,
        order_index: Option<i32>,
        is_archived: Option<bool>,
        status: Option<Option<String>>,
        owner_id: Option<Option<String>>,
    ) {
        if let Some(name) = name {
            self.name = name;
        }
        if let Some(description) = description {
            self.description = description;
        }
        if let Some(color) = color {
            self.color = color;
        }
        if let Some(order_index) = order_index {
            self.order_index = order_index;
        }
        if let Some(is_archived) = is_archived {
            self.is_archived = is_archived;
        }
        if let Some(status) = status {
            self.status = status;
        }
        if let Some(owner_id) = owner_id {
            self.owner_id = owner_id;
        }
        self.updated_at = Utc::now();
    }
}

impl Default for AutoMergeProject {
    fn default() -> Self {
        Self::new(
            String::new(),
            String::new(),
            None,
            None,
            0,
            None,
            None,
        )
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_new_project() {
        let project = AutoMergeProject::new(
            "project-1".to_string(),
            "Test Project".to_string(),
            Some("Test Description".to_string()),
            Some("#FF0000".to_string()),
            0,
            Some("active".to_string()),
            Some("user-1".to_string()),
        );

        assert_eq!(project.id, "project-1");
        assert_eq!(project.name, "Test Project");
        assert_eq!(project.description, Some("Test Description".to_string()));
        assert!(!project.is_archived);
    }

    #[test]
    fn test_update_project() {
        let mut project = AutoMergeProject::default();
        let original_updated_at = project.updated_at;

        // 少し時間を空ける
        std::thread::sleep(std::time::Duration::from_millis(1));

        project.update(
            Some("Updated Name".to_string()),
            Some(Some("Updated Description".to_string())),
            None,
            Some(10),
            Some(true),
            None,
            None,
        );

        assert_eq!(project.name, "Updated Name");
        assert_eq!(project.description, Some("Updated Description".to_string()));
        assert_eq!(project.order_index, 10);
        assert!(project.is_archived);
        assert!(project.updated_at > original_updated_at);
    }
}