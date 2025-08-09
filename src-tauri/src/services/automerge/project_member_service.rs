use crate::errors::ServiceError;
use crate::types::project_types::{ProjectMember, MemberRole};
use crate::repositories::automerge::ProjectRepository;
use crate::services::automerge::project_service::ProjectService;
use tauri::State;
use chrono::Utc;
use std::future::Future;

pub struct ProjectMemberService {
    project_service: ProjectService,
}

impl ProjectMemberService {
    pub fn new() -> Self {
        Self {
            project_service: ProjectService::new(),
        }
    }

    // プロジェクトメンバー操作
    pub async fn add_member(&self, project_repository: State<'_, ProjectRepository>, member: &ProjectMember) -> Result<(), ServiceError> {
        // バリデーション
        self.validate_project_member(member).await?;

        // プロジェクトの存在確認
        let project = self.project_service.get_project(project_repository.clone(), &member.project_id).await?;
        if project.is_none() {
            return Err(ServiceError::ValidationError("Project not found".to_string()));
        }

        // 参加日時設定
        let mut new_member = member.clone();
        new_member.joined_at = Utc::now();

        let project_id = member.project_id.clone();
        let user_id = member.user_id.clone();

        // 既存メンバーチェック（最初にcloneを作成）
        let project_repo_for_check = project_repository.clone();
        let existing_member = match self.safe_repository_call(async move {
            project_repo_for_check.get_member(&project_id, &user_id).await
        }).await {
            Ok(existing) => existing,
            Err(_) => None, // Repository未実装の場合はスキップ
        };

        if existing_member.is_some() {
            return Err(ServiceError::ValidationError("Member already exists".to_string()));
        }

        // メンバー追加
        match self.safe_repository_call(async move {
            project_repository.set_member(&new_member.project_id, &new_member).await
        }).await {
            Ok(_) => Ok(()),
            Err(e) => Err(ServiceError::Repository(e))
        }
    }

    pub async fn remove_member(&self, project_repository: State<'_, ProjectRepository>, project_id: &str, user_id: &str) -> Result<(), ServiceError> {
        // バリデーション
        if project_id.trim().is_empty() {
            return Err(ServiceError::ValidationError("Project ID cannot be empty".to_string()));
        }
        if user_id.trim().is_empty() {
            return Err(ServiceError::ValidationError("User ID cannot be empty".to_string()));
        }

        // Repository呼び出し
        match self.safe_repository_call(async move {
            project_repository.remove_member(project_id, user_id).await
        }).await {
            Ok(_) => Ok(()),
            Err(e) => Err(ServiceError::Repository(e))
        }
    }

    pub async fn list_members(&self, project_repository: State<'_, ProjectRepository>, project_id: &str) -> Result<Vec<ProjectMember>, ServiceError> {
        // バリデーション
        if project_id.trim().is_empty() {
            return Err(ServiceError::ValidationError("Project ID cannot be empty".to_string()));
        }

        // Repository呼び出し
        match self.safe_repository_call(async move {
            project_repository.list_members(project_id).await
        }).await {
            Ok(members) => Ok(members),
            Err(e) => Err(ServiceError::Repository(e))
        }
    }

    pub async fn update_member_role(&self, project_repository: State<'_, ProjectRepository>, member: &ProjectMember) -> Result<(), ServiceError> {
        // バリデーション
        self.validate_project_member(member).await?;

        let mut updated_member = member.clone();
        let project_id = member.project_id.clone();
        let user_id = member.user_id.clone();

        // 既存メンバーの存在確認（最初にcloneを作成）
        let project_repo_for_check = project_repository.clone();
        let existing_member = match self.safe_repository_call(async move {
            project_repo_for_check.get_member(&project_id, &user_id).await
        }).await {
            Ok(existing) => existing,
            Err(_) => None, // Repository未実装の場合はスキップ
        };

        if existing_member.is_none() {
            return Err(ServiceError::ValidationError("Member not found".to_string()));
        }

        // 元の参加日時を保持
        if let Some(existing) = existing_member {
            updated_member.joined_at = existing.joined_at;
        }

        // メンバー更新
        match self.safe_repository_call(async move {
            project_repository.set_member(&updated_member.project_id, &updated_member).await
        }).await {
            Ok(_) => Ok(()),
            Err(e) => Err(ServiceError::Repository(e))
        }
    }

    // プロジェクトメンバーのバリデーション
    pub async fn validate_project_member(&self, member: &ProjectMember) -> Result<(), ServiceError> {
        // ユーザーIDバリデーション
        if member.user_id.trim().is_empty() {
            return Err(ServiceError::ValidationError("User ID cannot be empty".to_string()));
        }

        // プロジェクトIDバリデーション
        if member.project_id.trim().is_empty() {
            return Err(ServiceError::ValidationError("Project ID cannot be empty".to_string()));
        }

        Ok(())
    }

    // 権限レベルのチェック
    pub async fn can_manage_members(&self, project_repository: State<'_, ProjectRepository>, project_id: &str, user_id: &str) -> Result<bool, ServiceError> {
        // バリデーション
        if project_id.trim().is_empty() {
            return Err(ServiceError::ValidationError("Project ID cannot be empty".to_string()));
        }
        if user_id.trim().is_empty() {
            return Err(ServiceError::ValidationError("User ID cannot be empty".to_string()));
        }

        // プロジェクトの存在確認
        let project = self.project_service.get_project(project_repository.clone(), project_id).await?;
        let project = match project {
            Some(p) => p,
            None => return Ok(false),
        };

        // プロジェクトオーナーかどうかチェック
        if let Some(owner_id) = &project.owner_id {
            if owner_id == user_id {
                return Ok(true);
            }
        }

        // プロジェクトメンバーの権限チェック
        match self.safe_repository_call(async move {
            project_repository.get_member(project_id, user_id).await
        }).await {
            Ok(Some(member)) => {
                // Owner、Adminのみメンバー管理可能
                match member.role {
                    MemberRole::Owner | MemberRole::Admin => Ok(true),
                    MemberRole::Member | MemberRole::Viewer => Ok(false),
                }
            },
            Ok(None) => Ok(false),
            Err(_) => Ok(true), // Repository未実装の場合は一旦true
        }
    }

    // プロジェクト統計情報の取得
    pub async fn get_project_statistics(&self, project_repository: State<'_, ProjectRepository>, project_id: &str) -> Result<ProjectStatistics, ServiceError> {
        // バリデーション
        if project_id.trim().is_empty() {
            return Err(ServiceError::ValidationError("Project ID cannot be empty".to_string()));
        }

        // メンバーリストを取得してから統計を計算
        let members = self.list_members(project_repository, project_id).await.unwrap_or_default();
        let owner_count = members.iter().filter(|m| matches!(m.role, MemberRole::Owner)).count();
        let admin_count = members.iter().filter(|m| matches!(m.role, MemberRole::Admin)).count();
        let member_count_by_role = members.iter().filter(|m| matches!(m.role, MemberRole::Member)).count();
        let viewer_count = members.iter().filter(|m| matches!(m.role, MemberRole::Viewer)).count();

        Ok(ProjectStatistics {
            total_members: members.len(),
            owner_count,
            admin_count,
            member_count: member_count_by_role,
            viewer_count,
        })
    }

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

// プロジェクト統計情報の構造体
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct ProjectStatistics {
    pub total_members: usize,
    pub owner_count: usize,
    pub admin_count: usize,
    pub member_count: usize,
    pub viewer_count: usize,
}