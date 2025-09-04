//! Member用Automergeリポジトリ

use super::super::document_manager::{DocumentManager, DocumentType};
use flequit_model::models::task_projects::member::Member;
use flequit_repository::repositories::base_repository_trait::Repository;
use flequit_repository::repositories::task_projects::member_repository_trait::MemberRepositoryTrait;
use flequit_model::types::id_types::{UserId, ProjectId};
use async_trait::async_trait;
use flequit_types::errors::repository_error::RepositoryError;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::Mutex;
use log::info;

/// Member Document構造（Automerge専用）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemberDocument {
    /// プロジェクト内のメンバー一覧
    pub members: Vec<Member>,
}

impl Default for MemberDocument {
    fn default() -> Self {
        Self {
            members: Vec::new(),
        }
    }
}

#[derive(Debug)]
pub struct MemberLocalAutomergeRepository {
    document_manager: Arc<Mutex<DocumentManager>>,
}

impl MemberLocalAutomergeRepository {
    pub fn new(document_manager: Arc<Mutex<DocumentManager>>) -> Self {
        Self { document_manager }
    }

    /// プロジェクトIDからメンバードキュメントを取得または作成
    async fn get_or_create_document(
        &self,
        project_id: &ProjectId,
    ) -> Result<MemberDocument, RepositoryError> {
        let mut manager = self.document_manager.lock().await;

        let doc_type = DocumentType::Project(project_id.clone());

        match manager.load_document::<MemberDocument>(&doc_type).await {
            Ok(Some(document)) => Ok(document),
            Ok(None) | Err(_) => {
                // ドキュメントが存在しない場合は新規作成
                let new_document = MemberDocument::default();
                manager.save_document(&doc_type, &new_document).await?;
                Ok(new_document)
            }
        }
    }

    /// メンバードキュメントを保存
    async fn save_document(
        &self,
        project_id: &ProjectId,
        document: &MemberDocument,
    ) -> Result<(), RepositoryError> {
        let mut manager = self.document_manager.lock().await;

        let doc_type = DocumentType::Project(project_id.clone());

        manager.save_document(&doc_type, document).await?;
        Ok(())
    }

    /// メンバーから推測されるプロジェクトIDを取得
    fn get_project_id_for_member(&self, member: &Member) -> ProjectId {
        member.project_id.clone()
    }

    /// ユーザーIDから推測されるプロジェクトIDを取得（実装では仮のプロジェクトIDを使用）
    fn get_project_id_from_user_id(&self, _user_id: &UserId) -> ProjectId {
        // NOTE: 実際の実装では、UserIdからProjectIdを特定するロジックが必要
        // 現在はデフォルトプロジェクトとして処理
        ProjectId::from("default_project")
    }

    /// 全プロジェクトからメンバーを取得（実装では仮の処理）
    async fn get_all_members_from_all_projects(&self) -> Result<Vec<Member>, RepositoryError> {
        // NOTE: 実際の実装では、すべてのプロジェクトからメンバーを集める必要があります
        // 現在はデフォルトプロジェクトのみから取得
        let project_id = ProjectId::from("default_project");
        let document = self.get_or_create_document(&project_id).await?;
        Ok(document.members)
    }
}

#[async_trait]
impl Repository<Member, UserId> for MemberLocalAutomergeRepository {
    async fn save(&self, entity: &Member) -> Result<(), RepositoryError> {
        info!("MemberLocalAutomergeRepository::save - メンバーを保存");

        let project_id = self.get_project_id_for_member(entity);
        let mut document = self.get_or_create_document(&project_id).await?;

        // 既存のメンバーを更新するか、新規追加
        if let Some(pos) = document
            .members
            .iter()
            .position(|m| m.id == entity.id)
        {
            document.members[pos] = entity.clone();
        } else {
            document.members.push(entity.clone());
        }

        self.save_document(&project_id, &document).await?;
        Ok(())
    }

    async fn find_by_id(&self, id: &UserId) -> Result<Option<Member>, RepositoryError> {
        info!("MemberLocalAutomergeRepository::find_by_id - メンバーを検索");

        // NOTE: 実際の実装では、すべてのプロジェクトから検索が必要
        let all_members = self.get_all_members_from_all_projects().await?;
        let member = all_members.into_iter().find(|m| m.user_id == *id);
        Ok(member)
    }

    async fn find_all(&self) -> Result<Vec<Member>, RepositoryError> {
        info!("MemberLocalAutomergeRepository::find_all - 全メンバーを取得");
        self.get_all_members_from_all_projects().await
    }

    async fn delete(&self, id: &UserId) -> Result<(), RepositoryError> {
        info!("MemberLocalAutomergeRepository::delete - メンバーを削除");

        let project_id = self.get_project_id_from_user_id(id);
        let mut document = self.get_or_create_document(&project_id).await?;

        document.members.retain(|m| m.user_id != *id);
        self.save_document(&project_id, &document).await?;
        Ok(())
    }

    async fn exists(&self, id: &UserId) -> Result<bool, RepositoryError> {
        let result = self.find_by_id(id).await?;
        Ok(result.is_some())
    }

    async fn count(&self) -> Result<u64, RepositoryError> {
        let members = self.find_all().await?;
        Ok(members.len() as u64)
    }
}

#[async_trait]
impl MemberRepositoryTrait for MemberLocalAutomergeRepository {
    async fn get_member(&self, id: &UserId) -> Result<Option<Member>, RepositoryError> {
        self.find_by_id(id).await
    }

    async fn find_by_project_id(&self, project_id: &ProjectId) -> Result<Vec<Member>, RepositoryError> {
        info!("MemberLocalAutomergeRepository::find_by_project_id - プロジェクトのメンバー一覧を取得");

        let document = self.get_or_create_document(project_id).await?;
        Ok(document.members)
    }

    async fn get_all_members(&self) -> Result<Vec<Member>, RepositoryError> {
        self.find_all().await
    }

    async fn add_member(&self, member: &Member) -> Result<(), RepositoryError> {
        self.save(member).await
    }

    async fn update_member(&self, member: &Member) -> Result<(), RepositoryError> {
        self.save(member).await
    }

    async fn delete_member(&self, id: &UserId) -> Result<(), RepositoryError> {
        self.delete(id).await
    }
}
