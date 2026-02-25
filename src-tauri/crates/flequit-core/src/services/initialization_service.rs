use flequit_infrastructure::InfrastructureRepositoriesTrait;
use flequit_model::models::accounts::account::Account;
use flequit_model::models::task_projects::project::{Project, ProjectTree};
use flequit_model::models::users::user::User;
use flequit_model::types::id_types::{AccountId, ProjectId, UserId};
use flequit_repository::repositories::base_repository_trait::Repository;
use flequit_types::errors::service_error::ServiceError;

pub struct InitializedResult {
    pub accounts: Vec<Account>,
    pub projects: Vec<ProjectTree>,
}

const DEFAULT_LOCAL_USER_HANDLE_BASE: &str = "local_user";
const DEFAULT_LOCAL_USER_DISPLAY_NAME: &str = "Local user";
const DEFAULT_LOCAL_ACCOUNT_DISPLAY_NAME: &str = "Local Account";
const DEFAULT_LOCAL_ACCOUNT_PROVIDER: &str = "local";
const DEFAULT_LOCAL_ACCOUNT_PROVIDER_ID_BASE: &str = "local_account";
const DEFAULT_LOCAL_USER_TIMEZONE: &str = "UTC";
const DEFAULT_PROJECT_NAME: &str = "My Tasks";

fn select_current_account(accounts: &[Account]) -> Option<Account> {
    accounts
        .iter()
        .find(|account| account.is_active && !account.deleted)
        .cloned()
        .or_else(|| {
            accounts
                .iter()
                .filter(|account| !account.deleted)
                .max_by_key(|account| account.created_at)
                .cloned()
        })
        .or_else(|| {
            accounts
                .iter()
                .max_by_key(|account| account.created_at)
                .cloned()
        })
}

fn select_primary_user(users: &[User]) -> Option<User> {
    users
        .iter()
        .find(|user| user.is_active && !user.deleted)
        .cloned()
        .or_else(|| users.iter().find(|user| !user.deleted).cloned())
        .or_else(|| users.iter().max_by_key(|user| user.created_at).cloned())
}

fn resolve_primary_user_id(users: &[User], accounts: &[Account]) -> Option<UserId> {
    if let Some(current_account) = select_current_account(accounts) {
        if users
            .iter()
            .any(|user| user.id == current_account.user_id && !user.deleted)
        {
            return Some(current_account.user_id);
        }
    }

    select_primary_user(users)
        .map(|user| user.id)
        .or_else(|| select_current_account(accounts).map(|account| account.user_id))
}

fn build_unique_user_handle(users: &[User], base: &str) -> String {
    if !users.iter().any(|user| user.handle_id == base) {
        return base.to_string();
    }

    let mut suffix: usize = 1;
    loop {
        let candidate = format!("{}_{}", base, suffix);
        if !users.iter().any(|user| user.handle_id == candidate) {
            return candidate;
        }
        suffix += 1;
    }
}

fn build_unique_provider_id(accounts: &[Account], base: &str) -> String {
    if !accounts
        .iter()
        .any(|account| account.provider_id.as_deref() == Some(base))
    {
        return base.to_string();
    }

    let mut suffix: usize = 1;
    loop {
        let candidate = format!("{}_{}", base, suffix);
        if !accounts
            .iter()
            .any(|account| account.provider_id.as_deref() == Some(candidate.as_str()))
        {
            return candidate;
        }
        suffix += 1;
    }
}

async fn ensure_minimum_data<R>(repositories: &R) -> Result<(), ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    let mut users = repositories.users().find_all().await?;
    let mut accounts = repositories.accounts().find_all().await?;
    let mut projects = repositories.projects().find_all().await?;

    let mut created_entities: Vec<String> = Vec::new();

    if users.iter().all(|user| user.deleted) {
        let now = chrono::Utc::now();
        let user_id = resolve_primary_user_id(&users, &accounts).unwrap_or_else(UserId::new);
        let handle_id = build_unique_user_handle(&users, DEFAULT_LOCAL_USER_HANDLE_BASE);

        let default_user = User {
            id: user_id.clone(),
            handle_id,
            display_name: DEFAULT_LOCAL_USER_DISPLAY_NAME.to_string(),
            email: None,
            avatar_url: None,
            bio: None,
            timezone: Some(DEFAULT_LOCAL_USER_TIMEZONE.to_string()),
            is_active: true,
            created_at: now,
            updated_at: now,
            deleted: false,
            updated_by: user_id.clone(),
        };

        repositories.users().save(&default_user, &user_id, &now).await?;
        created_entities.push(format!("user({})", default_user.id));
        users.push(default_user);
    }

    if accounts.iter().all(|account| account.deleted) {
        let now = chrono::Utc::now();
        let user_id = resolve_primary_user_id(&users, &accounts).ok_or_else(|| {
            ServiceError::InternalError("No user available for default account creation".to_string())
        })?;

        let default_account = Account {
            id: AccountId::new(),
            user_id: user_id.clone(),
            email: None,
            display_name: Some(DEFAULT_LOCAL_ACCOUNT_DISPLAY_NAME.to_string()),
            avatar_url: None,
            provider: DEFAULT_LOCAL_ACCOUNT_PROVIDER.to_string(),
            provider_id: Some(build_unique_provider_id(
                &accounts,
                DEFAULT_LOCAL_ACCOUNT_PROVIDER_ID_BASE,
            )),
            is_active: true,
            created_at: now,
            updated_at: now,
            deleted: false,
            updated_by: user_id.clone(),
        };

        repositories
            .accounts()
            .save(&default_account, &user_id, &now)
            .await?;
        created_entities.push(format!("account({})", default_account.id));
        accounts.push(default_account);
    }

    if projects.iter().all(|project| project.deleted) {
        let now = chrono::Utc::now();
        let owner_user_id = resolve_primary_user_id(&users, &accounts).ok_or_else(|| {
            ServiceError::InternalError("No user available for default project creation".to_string())
        })?;

        let next_order_index = projects
            .iter()
            .map(|project| project.order_index)
            .max()
            .map_or(0, |max_index| max_index + 1);

        let default_project = Project {
            id: ProjectId::new(),
            name: DEFAULT_PROJECT_NAME.to_string(),
            description: None,
            color: None,
            order_index: next_order_index,
            is_archived: false,
            status: None,
            owner_id: Some(owner_user_id.clone()),
            created_at: now,
            updated_at: now,
            deleted: false,
            updated_by: owner_user_id.clone(),
        };

        repositories
            .projects()
            .save(&default_project, &owner_user_id, &now)
            .await?;
        created_entities.push(format!("project({})", default_project.id));
        projects.push(default_project);
    }

    if created_entities.is_empty() {
        tracing::info!(target: "services::initialization", "Initial data check completed (no changes)");
    } else {
        tracing::info!(
            target: "services::initialization",
            created = ?created_entities,
            "Initial data created"
        );
    }

    Ok(())
}

pub async fn load_all_data<R>(repositories: &R) -> Result<InitializedResult, ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    // 他のservice関数を組み合わせて全データを取得
    let accounts = load_all_account(repositories).await?;
    let project_trees = load_all_project_trees(repositories).await?;

    Ok(InitializedResult {
        accounts,
        projects: project_trees,
    })
}

pub async fn load_current_account<R>(repositories: &R) -> Result<Option<Account>, ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    ensure_minimum_data(repositories).await?;

    let accounts = repositories.accounts().find_all().await?;
    Ok(select_current_account(&accounts))
}

pub async fn load_all_project_trees<R>(repositories: &R) -> Result<Vec<ProjectTree>, ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    ensure_minimum_data(repositories).await?;

    // 1. 全プロジェクトを取得
    let projects = repositories.projects().find_all().await?;

    let mut project_trees = Vec::new();

    // 2. 各プロジェクトに対してTaskListTreeを取得してProjectTreeを構築
    for project in projects {
        // TaskListTreeを取得
        let task_lists = crate::services::task_list_service::get_task_lists_with_tasks(
            repositories,
            &project.id,
        )
        .await?;

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
            deleted: project.deleted,
            updated_by: project.updated_by,
            task_lists,
        };

        project_trees.push(project_tree);
    }

    Ok(project_trees)
}

pub async fn load_all_account<R>(repositories: &R) -> Result<Vec<Account>, ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    ensure_minimum_data(repositories).await?;
    Ok(repositories.accounts().find_all().await?)
}
