use crate::errors::service_error::ServiceError;
use crate::models::account::Account;
use crate::models::command::initialize::InitializedResult;
use crate::models::project::{Project, ProjectTree};
use crate::models::setting::{LocalSettings, Settings};
use crate::models::TreeCommandConverter;
use crate::repositories::base_repository_trait::Repository;
use crate::repositories::setting_repository_trait::SettingRepositoryTrait;
use crate::repositories::Repositories;

pub async fn load_all_data() -> Result<InitializedResult, ServiceError> {
    // 他のservice関数を組み合わせて全データを取得
    let local_settings = load_local_settings().await?;
    let accounts = load_all_account().await?;
    let project_trees = load_all_project_trees().await?;

    // LocalSettingsからSettingsを構築
    let mut settings = Settings::default();
    if let Some(local_settings) = local_settings {
        settings.theme = local_settings.theme;
        settings.language = local_settings.language;
    }

    // ProjectTreeをProjectTreeCommandに変換
    let mut project_tree_commands = Vec::new();
    for project_tree in project_trees {
        project_tree_commands.push(project_tree.to_command_model().await.map_err(|e| ServiceError::InternalError(e))?);
    }

    Ok(InitializedResult {
        settings,
        accounts,
        projects: project_tree_commands,
    })
}

pub async fn load_local_settings() -> Result<Option<LocalSettings>, ServiceError> {
    let repository = Repositories::new().await?;

    // ローカル設定取得ロジック：設定データベースから取得
    let settings = repository
        .settings
        .get_settings()
        .await
        .map_err(|e| ServiceError::InternalError(format!("Repository error: {:?}", e)))?;

    let local_settings = if let Some(settings) = settings {
        LocalSettings {
            theme: settings.theme,
            language: settings.language,
        }
    } else {
        LocalSettings {
            theme: "system".to_string(),
            language: "ja".to_string(),
        }
    };

    Ok(Some(local_settings))
}

pub async fn load_current_account() -> Result<Option<Account>, ServiceError> {
    let repository = Repositories::new().await?;

    // 現在のアカウント取得ロジック：アクティブなアカウントを探す
    // まずアクティブなアカウントがあるかチェック
    let accounts = repository
        .accounts
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

pub async fn load_all_project_trees() -> Result<Vec<ProjectTree>, ServiceError> {
    let repository = Repositories::new().await?;

    // 1. 全プロジェクトを取得
    let projects = repository
        .projects
        .find_all()
        .await
        .map_err(|e| ServiceError::InternalError(format!("Repository error: {:?}", e)))?;

    let mut project_trees = Vec::new();

    // 2. 各プロジェクトに対してTaskListTreeを取得してProjectTreeを構築
    for project in projects {
        // TaskListTreeを取得
        let task_lists = crate::services::task_list_service::get_task_lists_with_tasks(&project.id).await?;

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

pub async fn load_all_account() -> Result<Vec<Account>, ServiceError> {
    let repository = Repositories::new().await?;
    repository
        .accounts
        .find_all()
        .await
        .map_err(|e| ServiceError::InternalError(format!("Repository error: {:?}", e)))
}
