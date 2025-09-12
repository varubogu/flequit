use async_trait::async_trait;
use flequit_model::models::task_projects::recurrence_rule::RecurrenceRule;
use flequit_types::errors::repository_error::RepositoryError;

/// 繰り返しルールリポジトリのトレイト
#[async_trait]
pub trait RecurrenceRuleRepositoryTrait: Send + Sync {
    /// 指定したIDの繰り返しルールを取得
    async fn get_recurrence_rule(
        &self,
        id: &str,
    ) -> Result<Option<RecurrenceRule>, RepositoryError>;

    /// すべての繰り返しルールを取得
    async fn get_all_recurrence_rules(&self) -> Result<Vec<RecurrenceRule>, RepositoryError>;

    /// 繰り返しルールを新規追加
    async fn add_recurrence_rule(&self, rule: &RecurrenceRule) -> Result<(), RepositoryError>;

    /// 繰り返しルールを更新
    async fn update_recurrence_rule(&self, rule: &RecurrenceRule) -> Result<(), RepositoryError>;

    /// 繰り返しルールを削除
    async fn delete_recurrence_rule(&self, id: &str) -> Result<(), RepositoryError>;
}
