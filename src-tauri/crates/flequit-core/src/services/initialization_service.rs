use flequit_types::errors::service_error::ServiceError;
use flequit_model::models::accounts::account::Account;
use flequit_model::models::task_projects::project::ProjectTree;
use flequit_model::models::app_settings::settings::Settings;
use flequit_repository::repositories::base_repository_trait::Repository;
use flequit_repository::repositories::app_settings::settings_repository_trait::SettingsRepositoryTrait;
use flequit_infrastructure::InfrastructureRepositoriesTrait;

pub struct InitializedResult {
    pub settings: Settings,
    pub accounts: Vec<Account>,
    pub projects: Vec<ProjectTree>,
}

pub async fn load_all_data(repositories: &dyn InfrastructureRepositoriesTrait) -> Result<InitializedResult, ServiceError> {
    // 他のservice関数を組み合わせて全データを取得
    let settings = load_local_settings(repositories).await?.unwrap_or_default();
    let accounts = load_all_account(repositories).await?;
    let project_trees = load_all_project_trees(repositories).await?;

    Ok(InitializedResult {
        settings,
        accounts,
        projects: project_trees,
    })
}

pub async fn load_local_settings(repositories: &dyn InfrastructureRepositoriesTrait) -> Result<Option<Settings>, ServiceError> {

    // ローカル設定取得ロジック：設定データベースから取得
    let settings = repositories
        .settings()
        .get_settings()
        .await
        .map_err(|e| ServiceError::InternalError(format!("Repository error: {:?}", e)))?;

    Ok(settings)
}

pub async fn load_current_account(repositories: &dyn InfrastructureRepositoriesTrait) -> Result<Option<Account>, ServiceError> {

    // 現在のアカウント取得ロジック：アクティブなアカウントを探す
    // まずアクティブなアカウントがあるかチェック
    let accounts = repositories
        .accounts()
        .find_all()
        .await
        .map_err(|e| ServiceError::InternalError(format!("Repository error: {:?}", e)))?;

    // is_activeフラグがtrueのアカウントを優先して返す
    let active_account = accounts.iter().find(|account| account.is_active).cloned();

    if active_account.is_some() {
        Ok(active_account)
    } else {
        // アクティブなアカウントがない場合は、最新のアカウントを返す
        let mut sorted_accounts = accounts;
        sorted_accounts.sort_by(|a, b| b.created_at.cmp(&a.created_at));
        Ok(sorted_accounts.into_iter().next())
    }
}

pub async fn load_all_project_trees(repositories: &dyn InfrastructureRepositoriesTrait) -> Result<Vec<ProjectTree>, ServiceError> {

    // 1. 全プロジェクトを取得
    let projects = repositories
        .projects()
        .find_all()
        .await
        .map_err(|e| ServiceError::InternalError(format!("Repository error: {:?}", e)))?;

    let mut project_trees = Vec::new();

    // 2. 各プロジェクトに対してTaskListTreeを取得してProjectTreeを構築
    for project in projects {
        // TaskListTreeを取得
        let task_lists =
            crate::services::task_list_service::get_task_lists_with_tasks(repositories, &project.id).await?;

        let project_tree = ProjectTree {
            id: project.id.clone(),
            name: project.name,
            description: project.description,
            color: project.color,
            order_index: project.order_index,
            is_archived: project.is_archived,
            status: project.status,
            owner_id: project.owner_id,
            created_at: project.created_at,
            updated_at: project.updated_at,
            task_lists,
        };

        project_trees.push(project_tree);
    }

    Ok(project_trees)
}

pub async fn load_all_account(repositories: &dyn InfrastructureRepositoriesTrait) -> Result<Vec<Account>, ServiceError> {
    repositories
        .accounts()
        .find_all()
        .await
        .map_err(|e| ServiceError::InternalError(format!("Repository error: {:?}", e)))
}
