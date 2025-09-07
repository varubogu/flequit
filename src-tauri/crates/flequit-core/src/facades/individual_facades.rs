//! 個別モデルファサード
//!
//! このモジュールは個別モデルのService層とのインターフェースを提供します。

use flequit_types::errors::service_error::ServiceError;
use flequit_infrastructure::InfrastructureRepositories;
use crate::services::individual_service;
use flequit_model::models::{app_settings::{due_date_buttons::DueDateButtons, settings::Settings}, task_projects::Member};

// =============================================================================
// アプリプリセットフォーマット関連ファサード
// =============================================================================

// NOTE: AppPresetFormatCommand型が存在しないため、関連機能は一時的にコメントアウト
// TODO: 適切なドメインモデルが定義されたら有効化する
//
// #[tracing::instrument(level = "trace")]
// pub async fn create_app_preset_format(preset: AppPresetFormatCommand) -> Result<bool, String> {
//     let repositories = InfrastructureRepositories::instance().await;
//     match individual_service::create_app_preset_format(&repositories, preset).await {
//         Ok(_) => Ok(true),
//         Err(ServiceError::ValidationError(msg)) => Err(msg),
//         Err(e) => Err(format!("Failed to create app preset format: {:?}", e)),
//     }
// }

// #[tracing::instrument(level = "trace")]
// pub async fn get_app_preset_format(preset_id: String) -> Result<Option<AppPresetFormatCommand>, String> {
//     let repositories = InfrastructureRepositories::instance().await;
//     match individual_service::get_app_preset_format(&repositories, &preset_id).await {
//         Ok(preset) => Ok(preset),
//         Err(e) => Err(format!("Failed to get app preset format: {:?}", e)),
//     }
// }

// #[tracing::instrument(level = "trace")]
// pub async fn get_all_app_preset_formats() -> Result<Vec<AppPresetFormatCommand>, String> {
//     let repositories = InfrastructureRepositories::instance().await;
//     match individual_service::get_all_app_preset_formats(&repositories).await {
//         Ok(presets) => Ok(presets),
//         Err(e) => Err(format!("Failed to get all app preset formats: {:?}", e)),
//     }
// }

// #[tracing::instrument(level = "trace")]
// pub async fn update_app_preset_format(preset: AppPresetFormatCommand) -> Result<bool, String> {
//     let repositories = InfrastructureRepositories::instance().await;
//     match individual_service::update_app_preset_format(&repositories, preset).await {
//         Ok(_) => Ok(true),
//         Err(ServiceError::ValidationError(msg)) => Err(msg),
//         Err(e) => Err(format!("Failed to update app preset format: {:?}", e)),
//     }
// }

#[tracing::instrument(level = "trace")]
pub async fn delete_app_preset_format(preset_id: String) -> Result<bool, String> {
    let repositories = InfrastructureRepositories::instance().await;
    match individual_service::delete_app_preset_format(&repositories, &preset_id).await {
        Ok(_) => Ok(true),
        Err(e) => Err(format!("Failed to delete app preset format: {:?}", e)),
    }
}

// #[tracing::instrument(level = "trace")]
// pub async fn get_app_preset_formats_by_category(category: String) -> Result<Vec<AppPresetFormatCommand>, String> {
//     let repositories = InfrastructureRepositories::instance().await;
//     match individual_service::get_app_preset_formats_by_category(&repositories, &category).await {
//         Ok(presets) => Ok(presets),
//         Err(e) => Err(format!("Failed to get app preset formats by category: {:?}", e)),
//     }
// }

// =============================================================================
// 期日ボタン設定関連ファサード
// =============================================================================

#[tracing::instrument(level = "trace")]
pub async fn get_due_date_buttons() -> Result<Option<DueDateButtons>, String> {
    let repositories = InfrastructureRepositories::instance().await;
    match individual_service::get_due_date_buttons(&repositories).await {
        Ok(buttons) => Ok(buttons),
        Err(e) => Err(format!("Failed to get due date buttons: {:?}", e)),
    }
}

#[tracing::instrument(level = "trace")]
pub async fn save_due_date_buttons(buttons: DueDateButtons) -> Result<bool, String> {
    let repositories = InfrastructureRepositories::instance().await;
    match individual_service::save_due_date_buttons(&repositories, buttons).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to save due date buttons: {:?}", e)),
    }
}

#[tracing::instrument(level = "trace")]
pub async fn reset_due_date_buttons() -> Result<bool, String> {
    let repositories = InfrastructureRepositories::instance().await;
    match individual_service::reset_due_date_buttons(&repositories).await {
        Ok(_) => Ok(true),
        Err(e) => Err(format!("Failed to reset due date buttons: {:?}", e)),
    }
}

// =============================================================================
// ローカル設定関連ファサード
// =============================================================================

#[tracing::instrument(level = "trace")]
pub async fn get_local_settings() -> Result<Option<Settings>, String> {
    let repositories = InfrastructureRepositories::instance().await;
    match individual_service::get_local_settings(&repositories).await {
        Ok(settings) => Ok(settings),
        Err(e) => Err(format!("Failed to get local settings: {:?}", e)),
    }
}

#[tracing::instrument(level = "trace")]
pub async fn save_local_settings(settings: Settings) -> Result<bool, String> {
    let repositories = InfrastructureRepositories::instance().await;
    match individual_service::save_local_settings(&repositories, settings).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to save local settings: {:?}", e)),
    }
}

#[tracing::instrument(level = "trace")]
pub async fn update_theme(theme: String) -> Result<bool, String> {
    let repositories = InfrastructureRepositories::instance().await;
    match individual_service::update_theme(&repositories, &theme).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to update theme: {:?}", e)),
    }
}

#[tracing::instrument(level = "trace")]
pub async fn update_language(language: String) -> Result<bool, String> {
    let repositories = InfrastructureRepositories::instance().await;
    match individual_service::update_language(&repositories, &language).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to update language: {:?}", e)),
    }
}

// =============================================================================
// メンバー関連ファサード
// =============================================================================

#[tracing::instrument(level = "trace")]
pub async fn create_member(member: Member) -> Result<bool, String> {
    let repositories = InfrastructureRepositories::instance().await;
    match individual_service::create_member(&repositories, member).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to create member: {:?}", e)),
    }
}

#[tracing::instrument(level = "trace")]
pub async fn get_member(member_id: String) -> Result<Option<Member>, String> {
    let repositories = InfrastructureRepositories::instance().await;
    match individual_service::get_member(&repositories, &member_id).await {
        Ok(member) => Ok(member),
        Err(e) => Err(format!("Failed to get member: {:?}", e)),
    }
}

#[tracing::instrument(level = "trace")]
pub async fn get_all_members() -> Result<Vec<Member>, String> {
    let repositories = InfrastructureRepositories::instance().await;
    match individual_service::get_all_members(&repositories).await {
        Ok(members) => Ok(members),
        Err(e) => Err(format!("Failed to get all members: {:?}", e)),
    }
}

#[tracing::instrument(level = "trace")]
pub async fn update_member(member: Member) -> Result<bool, String> {
    let repositories = InfrastructureRepositories::instance().await;
    match individual_service::update_member(&repositories, member).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to update member: {:?}", e)),
    }
}

#[tracing::instrument(level = "trace")]
pub async fn delete_member(member_id: String) -> Result<bool, String> {
    let repositories = InfrastructureRepositories::instance().await;
    match individual_service::delete_member(&repositories, &member_id).await {
        Ok(_) => Ok(true),
        Err(e) => Err(format!("Failed to delete member: {:?}", e)),
    }
}

#[tracing::instrument(level = "trace")]
pub async fn get_active_members() -> Result<Vec<Member>, String> {
    let repositories = InfrastructureRepositories::instance().await;
    match individual_service::get_active_members(&repositories).await {
        Ok(members) => Ok(members),
        Err(e) => Err(format!("Failed to get active members: {:?}", e)),
    }
}

#[tracing::instrument(level = "trace")]
pub async fn get_members_by_role(role: String) -> Result<Vec<Member>, String> {
    let repositories = InfrastructureRepositories::instance().await;
    match individual_service::get_members_by_role(&repositories, &role).await {
        Ok(members) => Ok(members),
        Err(e) => Err(format!("Failed to get members by role: {:?}", e)),
    }
}

// =============================================================================
// 検索関連ファサード (一時的に無効化)
// =============================================================================

// NOTE: SearchCommand型が存在しないため、関連機能は一時的にコメントアウト
// TODO: 適切なドメインモデルが定義されたら有効化する

// #[tracing::instrument(level = "trace")]
// pub async fn create_search(search: SearchCommand) -> Result<bool, String> {
//     let repositories = InfrastructureRepositories::instance().await;
//     match individual_service::create_search(&repositories, search).await {
//         Ok(_) => Ok(true),
//         Err(ServiceError::ValidationError(msg)) => Err(msg),
//         Err(e) => Err(format!("Failed to create search: {:?}", e)),
//     }
// }

// #[tracing::instrument(level = "trace")]
// pub async fn get_search(search_id: String) -> Result<Option<SearchCommand>, String> {
//     let repositories = InfrastructureRepositories::instance().await;
//     match individual_service::get_search(&repositories, &search_id).await {
//         Ok(search) => Ok(search),
//         Err(e) => Err(format!("Failed to get search: {:?}", e)),
//     }
// }

// #[tracing::instrument(level = "trace")]
// pub async fn get_all_searches() -> Result<Vec<SearchCommand>, String> {
//     let repositories = InfrastructureRepositories::instance().await;
//     match individual_service::get_all_searches(&repositories).await {
//         Ok(searches) => Ok(searches),
//         Err(e) => Err(format!("Failed to get all searches: {:?}", e)),
//     }
// }

// #[tracing::instrument(level = "trace")]
// pub async fn update_search(search: SearchCommand) -> Result<bool, String> {
//     let repositories = InfrastructureRepositories::instance().await;
//     match individual_service::update_search(&repositories, search).await {
//         Ok(_) => Ok(true),
//         Err(ServiceError::ValidationError(msg)) => Err(msg),
//         Err(e) => Err(format!("Failed to update search: {:?}", e)),
//     }
// }

#[tracing::instrument(level = "trace")]
pub async fn delete_search(search_id: String) -> Result<bool, String> {
    let repositories = InfrastructureRepositories::instance().await;
    match individual_service::delete_search(&repositories, &search_id).await {
        Ok(_) => Ok(true),
        Err(e) => Err(format!("Failed to delete search: {:?}", e)),
    }
}

// #[tracing::instrument(level = "trace")]
// pub async fn execute_search(search_id: String) -> Result<Vec<String>, String> {
//     let repositories = InfrastructureRepositories::instance().await;
//     match individual_service::execute_search(&repositories, &search_id).await {
//         Ok(results) => Ok(results),
//         Err(e) => Err(format!("Failed to execute search: {:?}", e)),
//     }
// }

// #[tracing::instrument(level = "trace")]
// pub async fn get_searches_by_type(search_type: String) -> Result<Vec<SearchCommand>, String> {
//     let repositories = InfrastructureRepositories::instance().await;
//     match individual_service::get_searches_by_type(&repositories, &search_type).await {
//         Ok(searches) => Ok(searches),
//         Err(e) => Err(format!("Failed to get searches by type: {:?}", e)),
//     }
// }

// =============================================================================
// 設定レスポンス関連ファサード (一時的に無効化)
// =============================================================================

// NOTE: SettingResponseCommand型が存在しないため、関連機能は一時的にコメントアウト
// TODO: 適切なドメインモデルが定義されたら有効化する

// #[tracing::instrument(level = "trace")]
// pub async fn create_setting_response(response: SettingResponseCommand) -> Result<bool, String> {
//     let repositories = InfrastructureRepositories::instance().await;
//     match individual_service::create_setting_response(&repositories, response).await {
//         Ok(_) => Ok(true),
//         Err(ServiceError::ValidationError(msg)) => Err(msg),
//         Err(e) => Err(format!("Failed to create setting response: {:?}", e)),
//     }
// }

// #[tracing::instrument(level = "trace")]
// pub async fn get_setting_response(response_id: String) -> Result<Option<SettingResponseCommand>, String> {
//     let repositories = InfrastructureRepositories::instance().await;
//     match individual_service::get_setting_response(&repositories, &response_id).await {
//         Ok(response) => Ok(response),
//         Err(e) => Err(format!("Failed to get setting response: {:?}", e)),
//     }
// }

// #[tracing::instrument(level = "trace")]
// pub async fn get_all_setting_responses() -> Result<Vec<SettingResponseCommand>, String> {
//     let repositories = InfrastructureRepositories::instance().await;
//     match individual_service::get_all_setting_responses(&repositories).await {
//         Ok(responses) => Ok(responses),
//         Err(e) => Err(format!("Failed to get all setting responses: {:?}", e)),
//     }
// }

// #[tracing::instrument(level = "trace")]
// pub async fn update_setting_response(response: SettingResponseCommand) -> Result<bool, String> {
//     let repositories = InfrastructureRepositories::instance().await;
//     match individual_service::update_setting_response(&repositories, response).await {
//         Ok(_) => Ok(true),
//         Err(ServiceError::ValidationError(msg)) => Err(msg),
//         Err(e) => Err(format!("Failed to update setting response: {:?}", e)),
//     }
// }

#[tracing::instrument(level = "trace")]
pub async fn delete_setting_response(response_id: String) -> Result<bool, String> {
    let repositories = InfrastructureRepositories::instance().await;
    match individual_service::delete_setting_response(&repositories, &response_id).await {
        Ok(_) => Ok(true),
        Err(e) => Err(format!("Failed to delete setting response: {:?}", e)),
    }
}

// #[tracing::instrument(level = "trace")]
// pub async fn get_setting_responses_by_key(setting_key: String) -> Result<Vec<SettingResponseCommand>, String> {
//     let repositories = InfrastructureRepositories::instance().await;
//     match individual_service::get_setting_responses_by_key(&repositories, &setting_key).await {
//         Ok(responses) => Ok(responses),
//         Err(e) => Err(format!("Failed to get setting responses by key: {:?}", e)),
//     }
// }

// #[tracing::instrument(level = "trace")]
// pub async fn get_setting_responses_by_status(status: String) -> Result<Vec<SettingResponseCommand>, String> {
//     let repositories = InfrastructureRepositories::instance().await;
//     match individual_service::get_setting_responses_by_status(&repositories, &status).await {
//         Ok(responses) => Ok(responses),
//         Err(e) => Err(format!("Failed to get setting responses by status: {:?}", e)),
//     }
// }