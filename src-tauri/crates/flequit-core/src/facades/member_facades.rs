//! メンバーファサード

use flequit_infrastructure::{InfrastructureRepositories, InfrastructureRepositoriesTrait};
use crate::services::member_service;

pub async fn create_member(member: crate::commands::member_commands::MemberCommand) -> Result<bool, String> {
    let repositories = InfrastructureRepositories::instance().await;
    member_service::create_member(&repositories, member).await
}

pub async fn get_member(member_id: String) -> Result<Option<crate::commands::member_commands::MemberCommand>, String> {
    let repositories = InfrastructureRepositories::instance().await;
    member_service::get_member(&repositories, member_id).await
}

pub async fn get_all_members() -> Result<Vec<crate::commands::member_commands::MemberCommand>, String> {
    let repositories = InfrastructureRepositories::instance().await;
    member_service::get_all_members(&repositories).await
}

pub async fn update_member(member: crate::commands::member_commands::MemberCommand) -> Result<bool, String> {
    let repositories = InfrastructureRepositories::instance().await;
    member_service::update_member(&repositories, member).await
}

pub async fn delete_member(member_id: String) -> Result<bool, String> {
    let repositories = InfrastructureRepositories::instance().await;
    member_service::delete_member(&repositories, member_id).await
}