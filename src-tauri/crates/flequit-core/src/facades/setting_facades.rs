//! 設定関連ファサード
//!
//! このモジュールは設定値へのアクセスと更新ロジックを集約します。

use flequit_settings::models::datetime_format::DateTimeFormat;
use flequit_settings::models::settings::Settings;

#[derive(Debug, Clone)]
pub struct LocalSettings {
    pub theme: String,
    pub language: String,
}

pub async fn get_custom_date_format(
    settings: &Settings,
    id: &str,
) -> Result<Option<DateTimeFormat>, String> {
    Ok(settings.datetime_formats.iter().find(|f| f.id == id).cloned())
}

pub async fn get_all_custom_date_formats(settings: &Settings) -> Result<Vec<DateTimeFormat>, String> {
    Ok(settings.datetime_formats.clone())
}

pub async fn add_custom_date_format(
    settings: &mut Settings,
    format: DateTimeFormat,
) -> Result<DateTimeFormat, String> {
    if settings.datetime_formats.iter().any(|f| f.id == format.id) {
        return Err(format!("datetime_format id already exists: {}", format.id));
    }

    settings.datetime_formats.push(format.clone());
    Ok(format)
}

pub async fn load_local_settings(settings: &Settings) -> Result<LocalSettings, String> {
    Ok(LocalSettings {
        theme: settings.theme.clone(),
        language: settings.language.clone(),
    })
}
