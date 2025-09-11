//! 設定値検証
//!
//! このモジュールは設定値の妥当性を検証します。

use crate::errors::{SettingsError, SettingsResult};
use crate::models::settings::Settings;

/// 設定値検証器
pub struct SettingsValidator;

impl SettingsValidator {
    /// 設定値全体を検証
    pub fn validate(settings: &Settings) -> SettingsResult<()> {
        Self::validate_theme(&settings.theme)?;
        Self::validate_language(&settings.language)?;
        Self::validate_font_size(settings.font_size)?;
        Self::validate_week_start(&settings.week_start)?;
        Self::validate_timezone(&settings.timezone)?;
        Self::validate_custom_due_days(&settings.custom_due_days)?;

        Ok(())
    }

    /// テーマ設定の検証
    fn validate_theme(theme: &str) -> SettingsResult<()> {
        match theme {
            "system" | "light" | "dark" => Ok(()),
            _ => Err(SettingsError::ValidationError {
                message: format!("無効なテーマ設定です: {}。有効な値: system, light, dark", theme),
            }),
        }
    }

    /// 言語設定の検証（ISO 639-1）
    fn validate_language(language: &str) -> SettingsResult<()> {
        if language.len() != 2 {
            return Err(SettingsError::ValidationError {
                message: format!("言語コードは2文字である必要があります: {}", language),
            });
        }

        // 基本的な言語コードをチェック
        match language {
            "ja" | "en" | "ko" | "zh" | "es" | "fr" | "de" | "it" | "pt" | "ru" => Ok(()),
            _ => {
                // 警告はログに出すが、エラーにはしない（将来の言語対応のため）
                log::warn!("未知の言語コードです: {}", language);
                Ok(())
            }
        }
    }

    /// フォントサイズの検証
    fn validate_font_size(font_size: i32) -> SettingsResult<()> {
        if !(8..=72).contains(&font_size) {
            return Err(SettingsError::ValidationError {
                message: format!("フォントサイズは8-72の範囲で設定してください: {}", font_size),
            });
        }
        Ok(())
    }

    /// 週の開始曜日の検証
    fn validate_week_start(week_start: &str) -> SettingsResult<()> {
        match week_start {
            "sunday" | "monday" => Ok(()),
            _ => Err(SettingsError::ValidationError {
                message: format!("無効な週開始設定です: {}。有効な値: sunday, monday", week_start),
            }),
        }
    }

    /// タイムゾーンの基本検証
    fn validate_timezone(timezone: &str) -> SettingsResult<()> {
        if timezone.is_empty() {
            return Err(SettingsError::ValidationError {
                message: "タイムゾーンが空です".to_string(),
            });
        }

        // 基本的なタイムゾーン形式をチェック
        if !timezone.contains('/') && !timezone.starts_with("UTC") && timezone != "GMT" {
            log::warn!("タイムゾーン形式が一般的でない可能性があります: {}", timezone);
        }

        Ok(())
    }

    /// カスタム期日日数の検証
    fn validate_custom_due_days(custom_due_days: &[i32]) -> SettingsResult<()> {
        for &days in custom_due_days {
            if days < 0 {
                return Err(SettingsError::ValidationError {
                    message: format!("期日日数は正の値である必要があります: {}", days),
                });
            }

            if days > 3650 { // 約10年
                return Err(SettingsError::ValidationError {
                    message: format!("期日日数が大きすぎます（最大3650日）: {}", days),
                });
            }
        }

        if custom_due_days.len() > 20 {
            return Err(SettingsError::ValidationError {
                message: format!("カスタム期日日数の設定数が多すぎます（最大20個）: {}", custom_due_days.len()),
            });
        }

        Ok(())
    }
}
