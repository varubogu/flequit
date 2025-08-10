// use serde::{Serialize, Deserialize};
// use tauri::State;
// use crate::types::project_types::ProjectMember;
// use crate::services::automerge::{ProjectMemberService, ProjectStatistics};
// use crate::services::repository_service::get_repositories;

// #[derive(Debug, Serialize, Deserialize)]
// pub struct ProjectMemberResponse {
//     pub success: bool,
//     pub data: Option<ProjectMember>,
//     pub message: Option<String>,
// }

// #[derive(Debug, Serialize, Deserialize)]
// pub struct ProjectMembersResponse {
//     pub success: bool,
//     pub data: Vec<ProjectMember>,
//     pub message: Option<String>,
// }

// #[derive(Debug, Serialize, Deserialize)]
// pub struct ProjectStatisticsResponse {
//     pub success: bool,
//     pub data: Option<ProjectStatistics>,
//     pub message: Option<String>,
// }

// #[derive(Debug, Serialize, Deserialize)]
// pub struct SimpleResponse {
//     pub success: bool,
//     pub message: Option<String>,
// }

// // プロジェクトメンバー追加
// #[tauri::command]
// pub async fn add_project_member(
//     member: ProjectMember,
//     project_member_service: State<'_, ProjectMemberService>,
// ) -> Result<ProjectMemberResponse, String> {
//     println!("add_project_member called");
//     println!("member: {:?}", member);

//     let repositories = get_repositories();
//     match project_member_service.add_member(repositories, &member).await {
//         Ok(_) => {
//             Ok(ProjectMemberResponse {
//                 success: true,
//                 data: Some(member),
//                 message: Some("Member added successfully".to_string()),
//             })
//         }
//         Err(service_error) => {
//             Ok(ProjectMemberResponse {
//                 success: false,
//                 data: None,
//                 message: Some(service_error.to_string()),
//             })
//         }
//     }
// }

// // プロジェクトメンバー削除
// #[tauri::command]
// pub async fn remove_project_member(
//     project_id: String,
//     user_id: String,
//     project_member_service: State<'_, ProjectMemberService>,
// ) -> Result<SimpleResponse, String> {
//     println!("remove_project_member called");
//     println!("project_id: {:?}, user_id: {:?}", project_id, user_id);

//     let repositories = get_repositories();
//     match project_member_service.remove_member(repositories, &project_id, &user_id).await {
//         Ok(_) => {
//             Ok(SimpleResponse {
//                 success: true,
//                 message: Some("Member removed successfully".to_string()),
//             })
//         }
//         Err(service_error) => {
//             Ok(SimpleResponse {
//                 success: false,
//                 message: Some(service_error.to_string()),
//             })
//         }
//     }
// }

// // プロジェクトメンバー一覧取得
// #[tauri::command]
// pub async fn list_project_members(
//     project_id: String,
//     project_member_service: State<'_, ProjectMemberService>,
// ) -> Result<ProjectMembersResponse, String> {
//     println!("list_project_members called");
//     println!("project_id: {:?}", project_id);

//     let repositories = get_repositories();
//     match project_member_service.list_members(repositories, &project_id).await {
//         Ok(members) => {
//             Ok(ProjectMembersResponse {
//                 success: true,
//                 data: members,
//                 message: Some("Members retrieved successfully".to_string()),
//             })
//         }
//         Err(service_error) => {
//             Ok(ProjectMembersResponse {
//                 success: false,
//                 data: vec![],
//                 message: Some(service_error.to_string()),
//             })
//         }
//     }
// }

// // プロジェクトメンバーの権限変更
// #[tauri::command]
// pub async fn update_member_role(
//     member: ProjectMember,
//     project_member_service: State<'_, ProjectMemberService>,
// ) -> Result<ProjectMemberResponse, String> {
//     println!("update_member_role called");
//     println!("member: {:?}", member);

//     let repositories = get_repositories();
//     match project_member_service.update_member_role(repositories, &member).await {
//         Ok(_) => {
//             Ok(ProjectMemberResponse {
//                 success: true,
//                 data: Some(member),
//                 message: Some("Member role updated successfully".to_string()),
//             })
//         }
//         Err(service_error) => {
//             Ok(ProjectMemberResponse {
//                 success: false,
//                 data: None,
//                 message: Some(service_error.to_string()),
//             })
//         }
//     }
// }

// // プロジェクト統計情報取得
// #[tauri::command]
// pub async fn get_project_statistics(
//     project_id: String,
//     project_member_service: State<'_, ProjectMemberService>,
// ) -> Result<ProjectStatisticsResponse, String> {
//     println!("get_project_statistics called");
//     println!("project_id: {:?}", project_id);

//     let repositories = get_repositories();
//     match project_member_service.get_project_statistics(repositories, &project_id).await {
//         Ok(statistics) => {
//             Ok(ProjectStatisticsResponse {
//                 success: true,
//                 data: Some(statistics),
//                 message: Some("Statistics retrieved successfully".to_string()),
//             })
//         }
//         Err(service_error) => {
//             Ok(ProjectStatisticsResponse {
//                 success: false,
//                 data: None,
//                 message: Some(service_error.to_string()),
//             })
//         }
//     }
// }

// // メンバー管理権限チェック
// #[tauri::command]
// pub async fn can_manage_members(
//     project_id: String,
//     user_id: String,
//     project_member_service: State<'_, ProjectMemberService>,
// ) -> Result<bool, String> {
//     println!("can_manage_members called");
//     println!("project_id: {:?}, user_id: {:?}", project_id, user_id);

//     let repositories = get_repositories();
//     match project_member_service.can_manage_members(repositories, &project_id, &user_id).await {
//         Ok(can_manage) => Ok(can_manage),
//         Err(service_error) => Err(service_error.to_string()),
//     }
// }
