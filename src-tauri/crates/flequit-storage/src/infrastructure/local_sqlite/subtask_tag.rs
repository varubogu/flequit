//! SubtaskTag用SQLiteリポジトリ

use super::database_manager::DatabaseManager;
use crate::errors::repository_error::RepositoryError;
use crate::models::sqlite::subtask_tag::{Column, Entity as SubtaskTagEntity};
use flequit_model::types::id_types::{SubTaskId, TagId};
use chrono::Utc;
use sea_orm::{
    ActiveModelTrait, ActiveValue::Set, ColumnTrait, ConnectionTrait, EntityTrait, QueryFilter,
};
use std::sync::Arc;
use tokio::sync::RwLock;

#[derive(Debug)]
pub struct SubtaskTagLocalSqliteRepository {
    db_manager: Arc<RwLock<DatabaseManager>>,
}

impl SubtaskTagLocalSqliteRepository {
    pub fn new(db_manager: Arc<RwLock<DatabaseManager>>) -> Self {
        Self { db_manager }
    }

    /// 指定サブタスクのタグIDリストを取得
    pub async fn find_tag_ids_by_subtask_id(
        &self,
        subtask_id: &SubTaskId,
    ) -> Result<Vec<TagId>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await?;

        let models = SubtaskTagEntity::find()
            .filter(Column::SubtaskId.eq(subtask_id.to_string()))
            .all(db)
            .await?;

        let tag_ids = models
            .into_iter()
            .map(|model| TagId::from(model.tag_id))
            .collect();

        Ok(tag_ids)
    }

    /// 指定タグに関連するサブタスクIDリストを取得
    pub async fn find_subtask_ids_by_tag_id(
        &self,
        tag_id: &TagId,
    ) -> Result<Vec<SubTaskId>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await?;

        let models = SubtaskTagEntity::find()
            .filter(Column::TagId.eq(tag_id.to_string()))
            .all(db)
            .await?;

        let subtask_ids = models
            .into_iter()
            .map(|model| SubTaskId::from(model.subtask_id))
            .collect();

        Ok(subtask_ids)
    }

    /// サブタスクとタグの関連付けを追加
    pub async fn add_relation(
        &self,
        subtask_id: &SubTaskId,
        tag_id: &TagId,
    ) -> Result<(), RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await?;

        // 既存の関連が存在するかチェック
        let existing = SubtaskTagEntity::find()
            .filter(Column::SubtaskId.eq(subtask_id.to_string()))
            .filter(Column::TagId.eq(tag_id.to_string()))
            .one(db)
            .await?;

        if existing.is_none() {
            // 関連が存在しない場合のみ追加
            let active_model = crate::models::sqlite::subtask_tag::ActiveModel {
                subtask_id: Set(subtask_id.to_string()),
                tag_id: Set(tag_id.to_string()),
                created_at: Set(Utc::now()),
            };

            active_model.insert(db).await?;
        }

        Ok(())
    }

    /// サブタスクとタグの関連付けを削除
    pub async fn remove_relation(
        &self,
        subtask_id: &SubTaskId,
        tag_id: &TagId,
    ) -> Result<(), RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await?;

        SubtaskTagEntity::delete_many()
            .filter(Column::SubtaskId.eq(subtask_id.to_string()))
            .filter(Column::TagId.eq(tag_id.to_string()))
            .exec(db)
            .await?;

        Ok(())
    }

    /// 指定サブタスクの全ての関連付けを削除
    pub async fn remove_all_relations_by_subtask_id(
        &self,
        subtask_id: &SubTaskId,
    ) -> Result<(), RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await?;

        SubtaskTagEntity::delete_many()
            .filter(Column::SubtaskId.eq(subtask_id.to_string()))
            .exec(db)
            .await?;

        Ok(())
    }

    /// 指定タグの全ての関連付けを削除
    pub async fn remove_all_relations_by_tag_id(
        &self,
        tag_id: &TagId,
    ) -> Result<(), RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await?;

        SubtaskTagEntity::delete_many()
            .filter(Column::TagId.eq(tag_id.to_string()))
            .exec(db)
            .await?;

        Ok(())
    }

    /// サブタスクのタグ関連付けを一括更新（既存をすべて削除して新しい関連を追加）
    pub async fn update_subtask_tag_relations<C>(
        &self,
        db: &C,
        subtask_id: &SubTaskId,
        tag_ids: &[TagId],
    ) -> Result<(), RepositoryError>
    where
        C: ConnectionTrait,
    {
        // 既存の関連付けを削除
        SubtaskTagEntity::delete_many()
            .filter(Column::SubtaskId.eq(subtask_id.to_string()))
            .exec(db)
            .await?;

        // 新しい関連付けを追加
        for tag_id in tag_ids {
            let active_model = crate::models::sqlite::subtask_tag::ActiveModel {
                subtask_id: Set(subtask_id.to_string()),
                tag_id: Set(tag_id.to_string()),
                created_at: Set(Utc::now()),
            };

            active_model.insert(db).await?;
        }

        Ok(())
    }
}
