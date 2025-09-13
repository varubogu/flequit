//! SubtaskTag用SQLiteリポジトリ

use super::super::database_manager::DatabaseManager;
use crate::errors::sqlite_error::SQLiteError;
use crate::models::subtask_tag::{Column, Entity as SubtaskTagEntity};
use crate::models::SqliteModelConverter;
use async_trait::async_trait;
use chrono::Utc;
use flequit_model::models::task_projects::subtask_tag::SubTaskTag;
use flequit_model::types::id_types::{ProjectId, SubTaskId, TagId};
use flequit_repository::repositories::project_relation_repository_trait::ProjectRelationRepository;
use flequit_types::errors::repository_error::RepositoryError;
use sea_orm::{
    ActiveModelTrait, ActiveValue::Set, ColumnTrait, ConnectionTrait, EntityTrait, PaginatorTrait,
    QueryFilter,
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
        let db = db_manager
            .get_connection()
            .await
            .map_err(|e| RepositoryError::from(e))?;

        let models = SubtaskTagEntity::find()
            .filter(Column::SubtaskId.eq(subtask_id.to_string()))
            .all(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

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
        let db = db_manager
            .get_connection()
            .await
            .map_err(|e| RepositoryError::from(e))?;

        let models = SubtaskTagEntity::find()
            .filter(Column::TagId.eq(tag_id.to_string()))
            .all(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        let subtask_ids = models
            .into_iter()
            .map(|model| SubTaskId::from(model.subtask_id))
            .collect();

        Ok(subtask_ids)
    }

    /// サブタスクとタグの関連付けを追加
    pub async fn add_relation(
        &self,
        project_id: &ProjectId,
        subtask_id: &SubTaskId,
        tag_id: &TagId,
    ) -> Result<(), RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(|e| RepositoryError::from(e))?;

        // 既存の関連が存在するかチェック
        let existing = SubtaskTagEntity::find()
            .filter(Column::SubtaskId.eq(subtask_id.to_string()))
            .filter(Column::TagId.eq(tag_id.to_string()))
            .one(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        if existing.is_none() {
            // 関連が存在しない場合のみ追加
            let active_model = crate::models::subtask_tag::ActiveModel {
                project_id: Set(project_id.to_string()),
                subtask_id: Set(subtask_id.to_string()),
                tag_id: Set(tag_id.to_string()),
                created_at: Set(Utc::now()),
            };

            active_model
                .insert(db)
                .await
                .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;
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
        let db = db_manager
            .get_connection()
            .await
            .map_err(|e| RepositoryError::from(e))?;

        SubtaskTagEntity::delete_many()
            .filter(Column::SubtaskId.eq(subtask_id.to_string()))
            .filter(Column::TagId.eq(tag_id.to_string()))
            .exec(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        Ok(())
    }

    /// 指定サブタスクの全ての関連付けを削除
    pub async fn remove_all_relations_by_subtask_id(
        &self,
        subtask_id: &SubTaskId,
    ) -> Result<(), RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(|e| RepositoryError::from(e))?;

        SubtaskTagEntity::delete_many()
            .filter(Column::SubtaskId.eq(subtask_id.to_string()))
            .exec(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        Ok(())
    }

    /// 指定タグの全ての関連付けを削除
    pub async fn remove_all_relations_by_tag_id(
        &self,
        tag_id: &TagId,
    ) -> Result<(), RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(|e| RepositoryError::from(e))?;

        SubtaskTagEntity::delete_many()
            .filter(Column::TagId.eq(tag_id.to_string()))
            .exec(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        Ok(())
    }

    /// サブタスクのタグ関連付けを一括更新（既存をすべて削除して新しい関連を追加）
    pub async fn update_subtask_tag_relations<C>(
        &self,
        db: &C,
        project_id: &ProjectId,
        subtask_id: &SubTaskId,
        tag_ids: &[TagId],
    ) -> Result<(), SQLiteError>
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
            let active_model = crate::models::subtask_tag::ActiveModel {
                project_id: Set(project_id.to_string()),
                subtask_id: Set(subtask_id.to_string()),
                tag_id: Set(tag_id.to_string()),
                created_at: Set(Utc::now()),
            };

            active_model.insert(db).await?;
        }

        Ok(())
    }
}

#[async_trait]
impl ProjectRelationRepository<SubTaskTag, SubTaskId, TagId> for SubtaskTagLocalSqliteRepository {
    async fn add(
        &self,
        project_id: &ProjectId,
        parent_id: &SubTaskId,
        child_id: &TagId,
    ) -> Result<(), RepositoryError> {
        self.add_relation(project_id, parent_id, child_id).await
    }

    async fn remove(
        &self,
        _project_id: &ProjectId,
        parent_id: &SubTaskId,
        child_id: &TagId,
    ) -> Result<(), RepositoryError> {
        self.remove_relation(parent_id, child_id).await
    }

    async fn remove_all(
        &self,
        _project_id: &ProjectId,
        parent_id: &SubTaskId,
    ) -> Result<(), RepositoryError> {
        self.remove_all_relations_by_subtask_id(parent_id).await
    }

    async fn find_relations(
        &self,
        _project_id: &ProjectId,
        parent_id: &SubTaskId,
    ) -> Result<Vec<SubTaskTag>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(|e| RepositoryError::from(e))?;

        let models = SubtaskTagEntity::find()
            .filter(Column::SubtaskId.eq(parent_id.to_string()))
            .all(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        let mut domain_models = Vec::new();
        for model in models {
            let domain_model = model
                .to_domain_model()
                .await
                .map_err(|e| RepositoryError::ConversionError(e))?;
            domain_models.push(domain_model);
        }

        Ok(domain_models)
    }

    async fn exists(
        &self,
        _project_id: &ProjectId,
        parent_id: &SubTaskId,
    ) -> Result<bool, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(|e| RepositoryError::from(e))?;

        let count = SubtaskTagEntity::find()
            .filter(Column::SubtaskId.eq(parent_id.to_string()))
            .count(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        Ok(count > 0)
    }

    async fn count(
        &self,
        _project_id: &ProjectId,
        parent_id: &SubTaskId,
    ) -> Result<u64, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(|e| RepositoryError::from(e))?;

        let count = SubtaskTagEntity::find()
            .filter(Column::SubtaskId.eq(parent_id.to_string()))
            .count(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        Ok(count)
    }

    async fn find_all(&self, _project_id: &ProjectId) -> Result<Vec<SubTaskTag>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(|e| RepositoryError::from(e))?;

        let models = SubtaskTagEntity::find()
            .all(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        let mut domain_models = Vec::new();
        for model in models {
            let domain_model = model
                .to_domain_model()
                .await
                .map_err(|e| RepositoryError::ConversionError(e))?;
            domain_models.push(domain_model);
        }

        Ok(domain_models)
    }

    async fn find_relation(
        &self,
        _project_id: &ProjectId,
        parent_id: &SubTaskId,
        child_id: &TagId,
    ) -> Result<Option<SubTaskTag>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(|e| RepositoryError::from(e))?;

        let model = SubtaskTagEntity::find()
            .filter(Column::SubtaskId.eq(parent_id.to_string()))
            .filter(Column::TagId.eq(child_id.to_string()))
            .one(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        match model {
            Some(m) => {
                let domain_model = m
                    .to_domain_model()
                    .await
                    .map_err(|e| RepositoryError::ConversionError(e))?;
                Ok(Some(domain_model))
            }
            None => Ok(None),
        }
    }
}
