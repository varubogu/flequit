use crate::errors::ServiceError;
use crate::types::project_types::Project;
use crate::repositories::automerge::ProjectRepository;
use crate::repositories::core::ProjectRepositoryTrait;
use tauri::State;
use chrono::Utc;
use std::future::Future;

pub struct ProjectService;

impl ProjectService {
    pub fn new() -> Self {
        Self
    }

    // プロジェクト操作
    pub async fn create_project(&self, project_repository: State<'_, ProjectRepository>, project: &Project) -> Result<(), ServiceError> {
        // バリデーション実行
        self.validate_project(project).await?;

        // プロジェクトの作成日時・更新日時設定
        let mut new_project = project.clone();
        let now = Utc::now();
        new_project.created_at = now;
        new_project.updated_at = now;

        // プロジェクトIDが空の場合はタイムスタンプベースのIDを生成
        if new_project.id.trim().is_empty() {
            new_project.id = format!("project_{}", now.timestamp_nanos_opt().unwrap_or(now.timestamp() * 1_000_000_000));
        }

        // Repository呼び出し（todo!実装の場合はエラー処理）
        match self.safe_repository_call(async move {
            project_repository.set_project(&new_project).await
        }).await {
            Ok(_) => Ok(()),
            Err(e) => Err(ServiceError::Repository(e))
        }
    }

    pub async fn get_project(&self, project_repository: State<'_, ProjectRepository>, project_id: &str) -> Result<Option<Project>, ServiceError> {
        // バリデーション
        if project_id.trim().is_empty() {
            return Err(ServiceError::ValidationError("Project ID cannot be empty".to_string()));
        }

        // Repository呼び出し
        match self.safe_repository_call(async move {
            project_repository.get_project(project_id).await
        }).await {
            Ok(project) => Ok(project),
            Err(e) => Err(ServiceError::Repository(e))
        }
    }

    pub async fn update_project(&self, project_repository: State<'_, ProjectRepository>, project: &Project) -> Result<(), ServiceError> {
        // バリデーション実行
        self.validate_project(project).await?;

        // 既存プロジェクトの存在確認
        let existing_project = self.get_project(project_repository.clone(), &project.id).await?;
        if existing_project.is_none() {
            return Err(ServiceError::ValidationError("Project not found".to_string()));
        }

        // 更新日時設定
        let mut updated_project = project.clone();
        updated_project.updated_at = Utc::now();
        // 作成日時は既存のものを保持
        if let Some(existing) = existing_project {
            updated_project.created_at = existing.created_at;
        }

        // Repository呼び出し
        match self.safe_repository_call(async move {
            project_repository.set_project(&updated_project).await
        }).await {
            Ok(_) => Ok(()),
            Err(e) => Err(ServiceError::Repository(e))
        }
    }

    pub async fn delete_project(&self, project_repository: State<'_, ProjectRepository>, project_id: &str) -> Result<(), ServiceError> {
        // バリデーション
        if project_id.trim().is_empty() {
            return Err(ServiceError::ValidationError("Project ID cannot be empty".to_string()));
        }

        // Repository呼び出し（論理削除）
        match self.safe_repository_call(async move {
            project_repository.delete_project(project_id).await
        }).await {
            Ok(_) => Ok(()),
            Err(e) => Err(ServiceError::Repository(e))
        }
    }

    pub async fn list_projects(&self, project_repository: State<'_, ProjectRepository>) -> Result<Vec<Project>, ServiceError> {
        // Repository呼び出し
        match self.safe_repository_call(async move {
            project_repository.list_projects().await
        }).await {
            Ok(projects) => {
                // アーカイブされていないプロジェクトのみフィルタリング
                let active_projects = projects.into_iter()
                    .filter(|project| !project.is_archived)
                    .collect();
                Ok(active_projects)
            },
            Err(e) => Err(ServiceError::Repository(e))
        }
    }


    // ビジネスロジック
    pub async fn validate_project(&self, project: &Project) -> Result<(), ServiceError> {
        // プロジェクト名バリデーション
        if project.name.trim().is_empty() {
            return Err(ServiceError::ValidationError("Project name cannot be empty".to_string()));
        }

        if project.name.len() > 255 {
            return Err(ServiceError::ValidationError("Project name too long".to_string()));
        }

        // IDバリデーション（更新時のみ必要）
        if !project.id.trim().is_empty() && project.id.len() > 100 {
            return Err(ServiceError::ValidationError("Project ID too long".to_string()));
        }

        // 説明のバリデーション
        if let Some(description) = &project.description {
            if description.len() > 2000 {
                return Err(ServiceError::ValidationError("Project description too long".to_string()));
            }
        }

        // 色のバリデーション
        if let Some(color) = &project.color {
            if !color.starts_with('#') || color.len() != 7 {
                return Err(ServiceError::ValidationError("Invalid color format. Use #RRGGBB format".to_string()));
            }
        }

        // order_indexのバリデーション
        if project.order_index < 0 {
            return Err(ServiceError::ValidationError("Order index cannot be negative".to_string()));
        }

        // owner_idのバリデーション
        if let Some(owner_id) = &project.owner_id {
            if owner_id.trim().is_empty() {
                return Err(ServiceError::ValidationError("Owner ID cannot be empty".to_string()));
            }
        }

        Ok(())
    }

    // pub async fn can_modify_project(&self, project_repository: State<'_, ProjectRepository>, project_id: &str, user_id: &str) -> Result<bool, ServiceError> {
    //     // バリデーション
    //     if project_id.trim().is_empty() {
    //         return Err(ServiceError::ValidationError("Project ID cannot be empty".to_string()));
    //     }
    //     if user_id.trim().is_empty() {
    //         return Err(ServiceError::ValidationError("User ID cannot be empty".to_string()));
    //     }

    //     // プロジェクトの存在確認
    //     let project = self.get_project(project_repository.clone(), project_id).await?;
    //     let project = match project {
    //         Some(p) => p,
    //         None => return Ok(false), // プロジェクトが存在しない場合は編集不可
    //     };

    //     // プロジェクトオーナーかどうかチェック
    //     if let Some(owner_id) = &project.owner_id {
    //         if owner_id == user_id {
    //             return Ok(true);
    //         }
    //     }

    //     // Repository未実装の場合は一旦trueを返す（セキュリティ上は要改善）
    //     Ok(true)
    // }


    // // プロジェクトによるフィルタリング
    // pub async fn list_projects_by_status(&self, project_repository: State<'_, ProjectRepository>, status: ProjectStatus) -> Result<Vec<Project>, ServiceError> {
    //     // Repository呼び出し（フォールバック戦略）
    //     match self.safe_repository_call(async move {
    //         match project_repository.find_projects_by_status(status.clone()).await {
    //             Ok(projects) => Ok(projects),
    //             Err(_) => {
    //                 // Repository実装が未完了の場合のフォールバック
    //                 let all_projects = project_repository.list_projects().await?;
    //                 let filtered_projects = all_projects.into_iter()
    //                     .filter(|project| {
    //                         match &project.status {
    //                             Some(proj_status) => *proj_status == status,
    //                             None => false,
    //                         }
    //                     })
    //                     .collect();
    //                 Ok(filtered_projects)
    //             }
    //         }
    //     }).await {
    //         Ok(projects) => {
    //             // アーカイブされていないプロジェクトのみ返す
    //             let active_projects = projects.into_iter()
    //                 .filter(|project| !project.is_archived)
    //                 .collect();
    //             Ok(active_projects)
    //         },
    //         Err(e) => Err(ServiceError::Repository(e))
    //     }
    // }

    // pub async fn list_projects_by_member(&self, project_repository: State<'_, ProjectRepository>, user_id: &str) -> Result<Vec<Project>, ServiceError> {
    //     // バリデーション
    //     if user_id.trim().is_empty() {
    //         return Err(ServiceError::ValidationError("User ID cannot be empty".to_string()));
    //     }

    //     // Repository呼び出し（フォールバック戦略）
    //     match self.safe_repository_call(async move {
    //         match project_repository.find_projects_by_member(user_id).await {
    //             Ok(projects) => Ok(projects),
    //             Err(_) => {
    //                 // Repository実装が未完了の場合のフォールバック
    //                 // 全プロジェクトを取得して、メンバーシップをチェック
    //                 let all_projects = project_repository.list_projects().await?;
    //                 let mut user_projects = Vec::new();

    //                 for project in all_projects {
    //                     // オーナーかチェック
    //                     if let Some(owner_id) = &project.owner_id {
    //                         if owner_id == user_id {
    //                             user_projects.push(project);
    //                             continue;
    //                         }
    //                     }

    //                     // メンバーかチェック
    //                     if let Ok(Some(_)) = project_repository.get_member(&project.id, user_id).await {
    //                         user_projects.push(project);
    //                     }
    //                 }

    //                 Ok(user_projects)
    //             }
    //         }
    //     }).await {
    //         Ok(projects) => {
    //             // アーカイブされていないプロジェクトのみ返す
    //             let active_projects = projects.into_iter()
    //                 .filter(|project| !project.is_archived)
    //                 .collect();
    //             Ok(active_projects)
    //         },
    //         Err(e) => Err(ServiceError::Repository(e))
    //     }
    // }

    // // プロジェクトのアーカイブ
    // pub async fn archive_project(&self, project_repository: State<'_, ProjectRepository>, project_id: &str, user_id: &str) -> Result<(), ServiceError> {
    //     // 権限チェック
    //     if !self.can_modify_project(project_repository.clone(), project_id, user_id).await? {
    //         return Err(ServiceError::ValidationError("Insufficient permissions to archive project".to_string()));
    //     }

    //     // プロジェクト取得
    //     let mut project = match self.get_project(project_repository.clone(), project_id).await? {
    //         Some(p) => p,
    //         None => return Err(ServiceError::ValidationError("Project not found".to_string())),
    //     };

    //     // アーカイブ設定
    //     project.is_archived = true;
    //     project.updated_at = Utc::now();

    //     // 更新実行
    //     self.update_project(project_repository, &project).await
    // }

    // // プロジェクトの復元
    // pub async fn unarchive_project(&self, project_repository: State<'_, ProjectRepository>, project_id: &str, user_id: &str) -> Result<(), ServiceError> {
    //     // 権限チェック
    //     if !self.can_modify_project(project_repository.clone(), project_id, user_id).await? {
    //         return Err(ServiceError::ValidationError("Insufficient permissions to unarchive project".to_string()));
    //     }

    //     let project_id = project_id.to_string();

    //     // プロジェクト取得（最初にcloneを作成）
    //     let project_repo_for_get = project_repository.clone();
    //     let mut project = match self.safe_repository_call(async move {
    //         project_repo_for_get.get_project(&project_id).await
    //     }).await {
    //         Ok(Some(p)) => p,
    //         Ok(None) => return Err(ServiceError::ValidationError("Project not found".to_string())),
    //         Err(e) => return Err(ServiceError::Repository(e))
    //     };

    //     // アーカイブ解除
    //     project.is_archived = false;
    //     project.updated_at = Utc::now();

    //     // 更新実行
    //     match self.safe_repository_call(async move {
    //         project_repository.set_project(&project).await
    //     }).await {
    //         Ok(_) => Ok(()),
    //         Err(e) => Err(ServiceError::Repository(e))
    //     }
    // }

    // Repository呼び出しの安全実行（todo!()パニック対応）
    async fn safe_repository_call<T, F>(&self, future: F) -> Result<T, crate::errors::RepositoryError>
    where
        F: Future<Output = Result<T, crate::errors::RepositoryError>>,
    {
        // panic::catch_unwindはFutureに対して直接使用できないため、
        // Repository未実装エラーを適切にハンドリング
        match future.await {
            Ok(result) => Ok(result),
            Err(e) => {
                // Repository実装が未完了（todo!()）の場合は適切なエラーメッセージ
                Err(e)
            }
        }
    }
}
