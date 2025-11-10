//! RecurrenceRule用SQLiteリポジトリ

use super::super::database_manager::DatabaseManager;
use crate::errors::sqlite_error::SQLiteError;
use crate::models::task_projects::recurrence_rule::{
    ActiveModel as RecurrenceRuleActiveModel, Column, Entity as RecurrenceRuleEntity,
};
use crate::models::{DomainToSqliteConverterWithProjectId, SqliteModelConverter};
use async_trait::async_trait;
use chrono::{DateTime, Utc};
use flequit_model::models::task_projects::recurrence_rule::RecurrenceRule;
use flequit_model::types::id_types::{ProjectId, RecurrenceRuleId, UserId};
use flequit_repository::repositories::project_repository_trait::ProjectRepository;
use flequit_repository::repositories::task_projects::recurrence_rule_repository_trait::RecurrenceRuleRepositoryTrait;
use flequit_types::errors::repository_error::RepositoryError;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, EntityTrait, PaginatorTrait, QueryFilter, QueryOrder,
};
use std::sync::Arc;
use tokio::sync::RwLock;

/// SQLite実装のRecurrenceRuleリポジトリ
///
/// `RecurrenceRuleRepositoryTrait`を実装し、
/// SQLiteデータベースを使用したRecurrenceRule管理を提供する。
///
/// # 特徴
///
/// - **SQLiteベース**: リレーショナルデータベースによる高速検索
/// - **トランザクション**: ACID特性による一貫性保証
/// - **インデックス**: 主要フィールドでの高速検索
/// - **リレーション**: 関連データとの整合性管理
/// - **ID管理**: RecurrenceRuleはプロジェクトに依存しないグローバルなリソース
#[derive(Debug)]
pub struct RecurrenceRuleLocalSqliteRepository {
    db_manager: Arc<RwLock<DatabaseManager>>,
}

impl RecurrenceRuleLocalSqliteRepository {
    /// 新しいRecurrenceRuleRepositoryを作成
    pub fn new(db_manager: Arc<RwLock<DatabaseManager>>) -> Self {
        Self { db_manager }
    }

    /// 名前でRecurrenceRuleを検索
    pub async fn find_by_unit(&self, unit: &str) -> Result<Vec<RecurrenceRule>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(|e| RepositoryError::from(e))?;

        let models = RecurrenceRuleEntity::find()
            .filter(Column::Unit.eq(unit))
            .order_by_asc(Column::CreatedAt)
            .all(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        let mut rules = Vec::new();
        for model in models {
            let rule = model
                .to_domain_model()
                .await
                .map_err(|e: String| RepositoryError::from(SQLiteError::ConversionError(e)))?;
            rules.push(rule);
        }

        Ok(rules)
    }

    /// 間隔でRecurrenceRuleを検索
    pub async fn find_by_interval(
        &self,
        interval: i32,
    ) -> Result<Vec<RecurrenceRule>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(|e| RepositoryError::from(e))?;

        let models = RecurrenceRuleEntity::find()
            .filter(Column::Interval.eq(interval))
            .order_by_asc(Column::CreatedAt)
            .all(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        let mut rules = Vec::new();
        for model in models {
            let rule = model
                .to_domain_model()
                .await
                .map_err(|e: String| RepositoryError::from(SQLiteError::ConversionError(e)))?;
            rules.push(rule);
        }

        Ok(rules)
    }

    /// 最大回数が設定されたRecurrenceRuleを検索
    pub async fn find_with_max_occurrences(&self) -> Result<Vec<RecurrenceRule>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(|e| RepositoryError::from(e))?;

        let models = RecurrenceRuleEntity::find()
            .filter(Column::MaxOccurrences.is_not_null())
            .order_by_asc(Column::CreatedAt)
            .all(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        let mut rules = Vec::new();
        for model in models {
            let rule = model
                .to_domain_model()
                .await
                .map_err(|e: String| RepositoryError::from(SQLiteError::ConversionError(e)))?;
            rules.push(rule);
        }

        Ok(rules)
    }
}

impl RecurrenceRuleRepositoryTrait for RecurrenceRuleLocalSqliteRepository {}

#[async_trait]
impl ProjectRepository<RecurrenceRule, RecurrenceRuleId> for RecurrenceRuleLocalSqliteRepository {
    async fn save(
        &self,
        project_id: &ProjectId,
        rule: &RecurrenceRule,
        _user_id: &UserId,
        _timestamp: &DateTime<Utc>,
    ) -> Result<(), RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(|e| RepositoryError::from(e))?;

        // 既存レコードを確認
        let existing =
            RecurrenceRuleEntity::find_by_id((project_id.to_string(), rule.id.to_string()))
                .one(db)
                .await
                .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        if let Some(existing_model) = existing {
            // 更新
            let mut active_model: RecurrenceRuleActiveModel = existing_model.into();
            let mut new_active = rule
                .to_sqlite_model_with_project_id(project_id)
                .await
                .map_err(|e: String| RepositoryError::from(SQLiteError::ConversionError(e)))?;
            // IDとProjectIdは明示的に保持
            new_active.id = sea_orm::Set(rule.id.to_string());
            new_active.project_id = sea_orm::Set(project_id.to_string());

            active_model.unit = new_active.unit;
            active_model.interval = new_active.interval;
            active_model.end_date = new_active.end_date;
            active_model.max_occurrences = new_active.max_occurrences;
            active_model.updated_at = new_active.updated_at;

            active_model
                .update(db)
                .await
                .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;
            Ok(())
        } else {
            // 新規作成
            let mut active_model = rule
                .to_sqlite_model_with_project_id(project_id)
                .await
                .map_err(|e: String| RepositoryError::from(SQLiteError::ConversionError(e)))?;
            // IDとProjectIdは明示的に設定
            active_model.id = sea_orm::Set(rule.id.to_string());
            active_model.project_id = sea_orm::Set(project_id.to_string());

            active_model
                .insert(db)
                .await
                .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;
            Ok(())
        }
    }

    async fn find_by_id(
        &self,
        project_id: &ProjectId,
        id: &RecurrenceRuleId,
    ) -> Result<Option<RecurrenceRule>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(|e| RepositoryError::from(e))?;

        if let Some(model) =
            RecurrenceRuleEntity::find_by_id((project_id.to_string(), id.to_string()))
                .one(db)
                .await
                .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?
        {
            let rule = model
                .to_domain_model()
                .await
                .map_err(|e: String| RepositoryError::from(SQLiteError::ConversionError(e)))?;
            Ok(Some(rule))
        } else {
            Ok(None)
        }
    }

    async fn find_all(
        &self,
        project_id: &ProjectId,
    ) -> Result<Vec<RecurrenceRule>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(|e| RepositoryError::from(e))?;

        let models = RecurrenceRuleEntity::find()
            .filter(Column::ProjectId.eq(project_id.to_string()))
            .order_by_asc(Column::CreatedAt)
            .all(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        let mut rules = Vec::new();
        for model in models {
            let rule = model
                .to_domain_model()
                .await
                .map_err(|e: String| RepositoryError::from(SQLiteError::ConversionError(e)))?;
            rules.push(rule);
        }

        Ok(rules)
    }

    async fn delete(
        &self,
        project_id: &ProjectId,
        id: &RecurrenceRuleId,
    ) -> Result<(), RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(|e| RepositoryError::from(e))?;

        RecurrenceRuleEntity::delete_by_id((project_id.to_string(), id.to_string()))
            .exec(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;
        Ok(())
    }

    async fn exists(
        &self,
        project_id: &ProjectId,
        id: &RecurrenceRuleId,
    ) -> Result<bool, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(|e| RepositoryError::from(e))?;
        let count = RecurrenceRuleEntity::find_by_id((project_id.to_string(), id.to_string()))
            .count(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;
        Ok(count > 0)
    }

    async fn count(&self, project_id: &ProjectId) -> Result<u64, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(|e| RepositoryError::from(e))?;
        let count = RecurrenceRuleEntity::find()
            .filter(Column::ProjectId.eq(project_id.to_string()))
            .count(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;
        Ok(count)
    }
}
