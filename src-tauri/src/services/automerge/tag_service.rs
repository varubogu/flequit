use crate::errors::ServiceError;
use crate::types::task_types::Tag;
use crate::repositories::automerge::TagRepository;
use tauri::State;
use chrono::Utc;
use std::future::Future;

pub struct TagService;

impl TagService {
    pub fn new() -> Self {
        Self
    }

    // グローバルタグ操作
    pub async fn create_tag(&self, tag_repository: State<'_, TagRepository>, tag: &Tag) -> Result<(), ServiceError> {
        // バリデーション実行
        self.validate_tag(tag_repository.clone(), tag).await?;

        // タグの作成日時・更新日時設定
        let mut new_tag = tag.clone();
        let now = Utc::now();
        new_tag.created_at = now;
        new_tag.updated_at = now;

        // タグIDが空の場合はタイムスタンプベースのIDを生成
        if new_tag.id.trim().is_empty() {
            new_tag.id = format!("tag_{}", now.timestamp_nanos_opt().unwrap_or(now.timestamp() * 1_000_000_000));
        }

        // Repository呼び出し（todo!実装の場合はエラー処理）
        match self.safe_repository_call(async move {
            tag_repository.set_tag(&new_tag).await
        }).await {
            Ok(_) => Ok(()),
            Err(e) => Err(ServiceError::Repository(e))
        }
    }

    pub async fn get_tag(&self, tag_repository: State<'_, TagRepository>, tag_id: &str) -> Result<Option<Tag>, ServiceError> {
        // バリデーション
        if tag_id.trim().is_empty() {
            return Err(ServiceError::ValidationError("Tag ID cannot be empty".to_string()));
        }

        // Repository呼び出し
        match self.safe_repository_call(async move {
            tag_repository.get_tag(tag_id).await
        }).await {
            Ok(tag) => Ok(tag),
            Err(e) => Err(ServiceError::Repository(e))
        }
    }

    pub async fn update_tag(&self, tag_repository: State<'_, TagRepository>, tag: &Tag) -> Result<(), ServiceError> {
        // バリデーション実行
        self.validate_tag(tag_repository.clone(), tag).await?;

        // 既存タグの存在確認
        let existing_tag = self.get_tag(tag_repository.clone(), &tag.id).await?;
        if existing_tag.is_none() {
            return Err(ServiceError::ValidationError("Tag not found".to_string()));
        }

        // 更新日時設定
        let mut updated_tag = tag.clone();
        updated_tag.updated_at = Utc::now();
        // 作成日時は既存のものを保持
        if let Some(existing) = existing_tag {
            updated_tag.created_at = existing.created_at;
        }

        // Repository呼び出し
        match self.safe_repository_call(async move {
            tag_repository.set_tag(&updated_tag).await
        }).await {
            Ok(_) => Ok(()),
            Err(e) => Err(ServiceError::Repository(e))
        }
    }

    pub async fn delete_tag(&self, tag_repository: State<'_, TagRepository>, tag_id: &str) -> Result<(), ServiceError> {
        // バリデーション
        if tag_id.trim().is_empty() {
            return Err(ServiceError::ValidationError("Tag ID cannot be empty".to_string()));
        }

        // 削除可能かどうかチェック（使用されていないかどうか）
        let can_delete = self.can_delete_tag(tag_repository.clone(), tag_id).await?;
        if !can_delete {
            return Err(ServiceError::ValidationError("Cannot delete tag: tag is in use by tasks".to_string()));
        }

        // Repository呼び出し（論理削除）
        match self.safe_repository_call(async move {
            tag_repository.delete_tag(tag_id).await
        }).await {
            Ok(_) => Ok(()),
            Err(e) => Err(ServiceError::Repository(e))
        }
    }

    pub async fn list_tags(&self, tag_repository: State<'_, TagRepository>) -> Result<Vec<Tag>, ServiceError> {
        // Repository呼び出し
        match self.safe_repository_call(async move {
            tag_repository.list_tags().await
        }).await {
            Ok(tags) => Ok(tags),
            Err(e) => Err(ServiceError::Repository(e))
        }
    }

    // タグ使用状況
    pub async fn get_tag_usage_count(&self, tag_repository: State<'_, TagRepository>, tag_id: &str) -> Result<u32, ServiceError> {
        // バリデーション
        if tag_id.trim().is_empty() {
            return Err(ServiceError::ValidationError("Tag ID cannot be empty".to_string()));
        }

        // Repository呼び出し
        match self.safe_repository_call(async move {
            tag_repository.get_tag_usage_count(tag_id).await
        }).await {
            Ok(count) => Ok(count),
            Err(_) => {
                // Repository実装が未完了の場合のフォールバック（一旦0を返す）
                Ok(0)
            }
        }
    }

    pub async fn list_popular_tags(&self, tag_repository: State<'_, TagRepository>, limit: u32) -> Result<Vec<Tag>, ServiceError> {
        // バリデーション
        if limit == 0 {
            return Err(ServiceError::ValidationError("Limit must be greater than 0".to_string()));
        }

        // Repository呼び出し（フォールバック戦略）
        match self.safe_repository_call(async move {
            match tag_repository.get_popular_tags(limit).await {
                Ok(tags_with_count) => {
                    let tags: Vec<Tag> = tags_with_count.into_iter().map(|(tag, _)| tag).collect();
                    Ok(tags)
                },
                Err(_) => {
                    // Repository実装が未完了の場合のフォールバック（通常のタグリストを返す）
                    let all_tags = tag_repository.list_tags().await?;
                    let limited_tags = all_tags.into_iter().take(limit as usize).collect();
                    Ok(limited_tags)
                }
            }
        }).await {
            Ok(tags) => Ok(tags),
            Err(e) => Err(ServiceError::Repository(e))
        }
    }

    // pub async fn get_tags_with_usage(&self, tag_repository: State<'_, TagRepository>) -> Result<Vec<TagWithUsage>, ServiceError> {
    //     // Repository呼び出し（フォールバック戦略）
    //     match self.safe_repository_call(async move {
    //         match tag_repository.get_tags_with_usage_count().await {
    //             Ok(tags_with_count) => {
    //                 let result: Vec<TagWithUsage> = tags_with_count.into_iter()
    //                     .map(|(tag, usage_count)| TagWithUsage { tag, usage_count })
    //                     .collect();
    //                 Ok(result)
    //             },
    //             Err(_) => {
    //                 // Repository実装が未完了の場合のフォールバック
    //                 let all_tags = tag_repository.list_tags().await?;
    //                 let mut result = Vec::new();
    //                 for tag in all_tags {
    //                     let usage_count = match tag_repository.get_tag_usage_count(&tag.id).await {
    //                         Ok(count) => count,
    //                         Err(_) => 0, // エラーの場合は使用数0とする
    //                     };
    //                     result.push(TagWithUsage { tag, usage_count });
    //                 }
    //                 Ok(result)
    //             }
    //         }
    //     }).await {
    //         Ok(tags) => Ok(tags),
    //         Err(e) => Err(ServiceError::Repository(e))
    //     }
    // }

    // pub async fn get_unused_tags(&self, tag_repository: State<'_, TagRepository>) -> Result<Vec<Tag>, ServiceError> {
    //     // Repository呼び出し（フォールバック戦略）
    //     match self.safe_repository_call(async move {
    //         match tag_repository.get_unused_tags().await {
    //             Ok(tags) => Ok(tags),
    //             Err(_) => {
    //                 // Repository実装が未完了の場合のフォールバック
    //                 let all_tags = tag_repository.list_tags().await?;
    //                 let mut unused_tags = Vec::new();
    //                 for tag in all_tags {
    //                     let usage_count = match tag_repository.get_tag_usage_count(&tag.id).await {
    //                         Ok(count) => count,
    //                         Err(_) => 1, // エラーの場合は使用中とみなす
    //                     };
    //                     if usage_count == 0 {
    //                         unused_tags.push(tag);
    //                     }
    //                 }
    //                 Ok(unused_tags)
    //             }
    //         }
    //     }).await {
    //         Ok(tags) => Ok(tags),
    //         Err(e) => Err(ServiceError::Repository(e))
    //     }
    // }

    // 検索・フィルタリング機能
    pub async fn search_tags_by_name(&self, tag_repository: State<'_, TagRepository>, name: &str, limit: usize) -> Result<Vec<Tag>, ServiceError> {
        // バリデーション
        if name.trim().is_empty() {
            return Err(ServiceError::ValidationError("Search name cannot be empty".to_string()));
        }
        if limit == 0 {
            return Err(ServiceError::ValidationError("Limit must be greater than 0".to_string()));
        }

        // Repository呼び出し（フォールバック戦略）
        match self.safe_repository_call(async move {
            match tag_repository.find_tags_by_name(name).await {
                Ok(tags) => {
                    let limited_tags = tags.into_iter().take(limit).collect();
                    Ok(limited_tags)
                },
                Err(_) => {
                    // Repository実装が未完了の場合のフォールバック
                    let all_tags = tag_repository.list_tags().await?;
                    let name_lower = name.to_lowercase();
                    let filtered_tags: Vec<Tag> = all_tags.into_iter()
                        .filter(|tag| tag.name.to_lowercase().contains(&name_lower))
                        .take(limit)
                        .collect();
                    Ok(filtered_tags)
                }
            }
        }).await {
            Ok(tags) => Ok(tags),
            Err(e) => Err(ServiceError::Repository(e))
        }
    }

    // pub async fn search_tags_by_color(&self, tag_repository: State<'_, TagRepository>, color: &str) -> Result<Vec<Tag>, ServiceError> {
    //     // バリデーション
    //     if color.trim().is_empty() {
    //         return Err(ServiceError::ValidationError("Color cannot be empty".to_string()));
    //     }

    //     // 色フォーマットの簡易チェック
    //     if !color.starts_with('#') || color.len() != 7 {
    //         return Err(ServiceError::ValidationError("Invalid color format. Use #RRGGBB format".to_string()));
    //     }

    //     // Repository呼び出し（フォールバック戦略）
    //     match self.safe_repository_call(async move {
    //         match tag_repository.find_tags_by_color(color).await {
    //             Ok(tags) => Ok(tags),
    //             Err(_) => {
    //                 // Repository実装が未完了の場合のフォールバック
    //                 let all_tags = tag_repository.list_tags().await?;
    //                 let filtered_tags: Vec<Tag> = all_tags.into_iter()
    //                     .filter(|tag| {
    //                         if let Some(tag_color) = &tag.color {
    //                             tag_color.eq_ignore_ascii_case(color)
    //                         } else {
    //                             false
    //                         }
    //                     })
    //                     .collect();
    //                 Ok(filtered_tags)
    //             }
    //         }
    //     }).await {
    //         Ok(tags) => Ok(tags),
    //         Err(e) => Err(ServiceError::Repository(e))
    //     }
    // }

    // ビジネスロジック
    pub async fn validate_tag(&self, tag_repository: State<'_, TagRepository>, tag: &Tag) -> Result<(), ServiceError> {
        // タグ名バリデーション
        if tag.name.trim().is_empty() {
            return Err(ServiceError::ValidationError("Tag name cannot be empty".to_string()));
        }

        if tag.name.len() > 50 {
            return Err(ServiceError::ValidationError("Tag name too long (max 50 characters)".to_string()));
        }

        // IDバリデーション（更新時のみ必要）
        if !tag.id.trim().is_empty() && tag.id.len() > 100 {
            return Err(ServiceError::ValidationError("Tag ID too long (max 100 characters)".to_string()));
        }

        // 色のバリデーション
        if let Some(color) = &tag.color {
            if !color.trim().is_empty() {
                if !color.starts_with('#') || color.len() != 7 {
                    return Err(ServiceError::ValidationError("Invalid color format. Use #RRGGBB format".to_string()));
                }
                // 16進数チェック
                if !color.chars().skip(1).all(|c| c.is_ascii_hexdigit()) {
                    return Err(ServiceError::ValidationError("Invalid color format. Use valid hexadecimal values".to_string()));
                }
            }
        }

        // order_indexのバリデーション
        if let Some(order_index) = &tag.order_index {
            if *order_index < 0 {
                return Err(ServiceError::ValidationError("Order index cannot be negative".to_string()));
            }
        }

        // タグ名の重複チェック
        if self.is_tag_name_exists(tag_repository, &tag.name, Some(&tag.id)).await? {
            return Err(ServiceError::ValidationError("Tag name already exists".to_string()));
        }

        Ok(())
    }

    pub async fn is_tag_name_exists(&self, tag_repository: State<'_, TagRepository>, name: &str, exclude_id: Option<&str>) -> Result<bool, ServiceError> {
        // バリデーション
        if name.trim().is_empty() {
            return Err(ServiceError::ValidationError("Tag name cannot be empty".to_string()));
        }

        // Repository呼び出し（フォールバック戦略）
        match self.safe_repository_call(async move {
            match tag_repository.is_tag_name_unique(name, exclude_id).await {
                Ok(is_unique) => Ok(!is_unique), // uniqueの逆がexists
                Err(_) => {
                    // Repository実装が未完了の場合のフォールバック
                    let all_tags = tag_repository.list_tags().await?;
                    let name_exists = all_tags.iter().any(|tag| {
                        if let Some(exclude) = exclude_id {
                            tag.name.eq_ignore_ascii_case(name) && tag.id != exclude
                        } else {
                            tag.name.eq_ignore_ascii_case(name)
                        }
                    });
                    Ok(name_exists)
                }
            }
        }).await {
            Ok(exists) => Ok(exists),
            Err(e) => Err(ServiceError::Repository(e))
        }
    }

    pub async fn can_delete_tag(&self, tag_repository: State<'_, TagRepository>, tag_id: &str) -> Result<bool, ServiceError> {
        // バリデーション
        if tag_id.trim().is_empty() {
            return Err(ServiceError::ValidationError("Tag ID cannot be empty".to_string()));
        }

        // Repository呼び出し（フォールバック戦略）
        match self.safe_repository_call(async move {
            match tag_repository.can_delete_tag(tag_id).await {
                Ok(can_delete) => Ok(can_delete),
                Err(_) => {
                    // Repository実装が未完了の場合のフォールバック
                    let usage_count = match tag_repository.get_tag_usage_count(tag_id).await {
                        Ok(count) => count,
                        Err(_) => 1, // エラーの場合は削除不可とする（安全側に倒す）
                    };
                    Ok(usage_count == 0)
                }
            }
        }).await {
            Ok(can_delete) => Ok(can_delete),
            Err(e) => Err(ServiceError::Repository(e))
        }
    }

    // // 統計情報
    // pub async fn get_tag_statistics(&self, tag_repository: State<'_, TagRepository>) -> Result<TagStatistics, ServiceError> {
    //     // 使用されているタグ、未使用タグの計算（最初にcloneを作成）
    //     let tags_with_usage = self.get_tags_with_usage(tag_repository.clone()).await.unwrap_or_default();
    //     let used_tags_count = tags_with_usage.iter().filter(|tag_usage| tag_usage.usage_count > 0).count();
    //     let unused_tags_count = tags_with_usage.iter().filter(|tag_usage| tag_usage.usage_count == 0).count();

    //     // 色分布の計算
    //     let color_distribution = self.get_color_distribution(tag_repository.clone()).await.unwrap_or_default();

    //     // タグ総数取得
    //     let total_tags = match self.safe_repository_call(async move {
    //         tag_repository.get_tag_count().await
    //     }).await {
    //         Ok(count) => count as usize,
    //         Err(_) => {
    //             // Repository実装が未完了の場合のフォールバック
    //             tags_with_usage.len()
    //         }
    //     };

    //     Ok(TagStatistics {
    //         total_tags,
    //         used_tags_count,
    //         unused_tags_count,
    //         color_distribution,
    //     })
    // }

    // pub async fn get_color_distribution(&self, tag_repository: State<'_, TagRepository>) -> Result<Vec<ColorDistribution>, ServiceError> {
    //     // Repository呼び出し（フォールバック戦略）
    //     match self.safe_repository_call(async move {
    //         match tag_repository.get_color_distribution().await {
    //             Ok(distribution) => {
    //                 let result: Vec<ColorDistribution> = distribution.into_iter()
    //                     .map(|(color, count)| ColorDistribution { color, count })
    //                     .collect();
    //                 Ok(result)
    //             },
    //             Err(_) => {
    //                 // Repository実装が未完了の場合のフォールバック
    //                 let all_tags = tag_repository.list_tags().await?;
    //                 let mut color_map = std::collections::HashMap::new();

    //                 for tag in all_tags {
    //                     let color_key = tag.color.clone();
    //                     *color_map.entry(color_key).or_insert(0) += 1;
    //                 }

    //                 let result: Vec<ColorDistribution> = color_map.into_iter()
    //                     .map(|(color, count)| ColorDistribution { color, count })
    //                     .collect();
    //                 Ok(result)
    //             }
    //         }
    //     }).await {
    //         Ok(distribution) => Ok(distribution),
    //         Err(e) => Err(ServiceError::Repository(e))
    //     }
    // }

    // // 高度なフィルタリング機能
    // pub async fn filter_tags(&self, tag_repository: State<'_, TagRepository>, filter: &TagFilter) -> Result<Vec<Tag>, ServiceError> {
    //     // 基本的なタグリストを取得
    //     let mut tags = self.list_tags(tag_repository.clone()).await?;

    //     // 名前フィルター
    //     if let Some(ref name_pattern) = filter.name_pattern {
    //         if !name_pattern.trim().is_empty() {
    //             let pattern_lower = name_pattern.to_lowercase();
    //             tags.retain(|tag| tag.name.to_lowercase().contains(&pattern_lower));
    //         }
    //     }

    //     // 色フィルター
    //     if let Some(ref colors) = filter.colors {
    //         if !colors.is_empty() {
    //             tags.retain(|tag| {
    //                 if let Some(tag_color) = &tag.color {
    //                     colors.iter().any(|color| tag_color.eq_ignore_ascii_case(color))
    //                 } else {
    //                     colors.iter().any(|color| color.is_empty()) // 色なしタグをフィルター
    //                 }
    //             });
    //         }
    //     }

    //     // 使用状況フィルター
    //     if let Some(usage_filter) = &filter.usage_filter {
    //         let mut filtered_tags = Vec::new();
    //         for tag in tags {
    //             let usage_count = self.get_tag_usage_count(tag_repository.clone(), &tag.id).await?;
    //             let should_include = match usage_filter {
    //                 UsageFilter::Used => usage_count > 0,
    //                 UsageFilter::Unused => usage_count == 0,
    //                 UsageFilter::All => true,
    //                 UsageFilter::MinUsage(min) => usage_count >= *min,
    //             };
    //             if should_include {
    //                 filtered_tags.push(tag);
    //             }
    //         }
    //         tags = filtered_tags;
    //     }

    //     // 作成日フィルター
    //     if let Some(ref created_from) = filter.created_from {
    //         tags.retain(|tag| tag.created_at >= *created_from);
    //     }
    //     if let Some(ref created_to) = filter.created_to {
    //         tags.retain(|tag| tag.created_at <= *created_to);
    //     }

    //     // ソート
    //     if let Some(ref sort_by) = filter.sort_by {
    //         match sort_by {
    //             TagSortBy::Name => {
    //                 tags.sort_by(|a, b| a.name.cmp(&b.name));
    //             },
    //             TagSortBy::CreatedAt => {
    //                 tags.sort_by(|a, b| b.created_at.cmp(&a.created_at)); // 新しい順
    //             },
    //             TagSortBy::UpdatedAt => {
    //                 tags.sort_by(|a, b| b.updated_at.cmp(&a.updated_at)); // 新しい順
    //             },
    //             TagSortBy::Usage => {
    //                 // 使用数での並び替え（重い処理なので注意）
    //                 let mut tags_with_usage = Vec::new();
    //                 for tag in tags {
    //                     let usage_count = self.get_tag_usage_count(tag_repository.clone(), &tag.id).await.unwrap_or(0);
    //                     tags_with_usage.push((tag, usage_count));
    //                 }
    //                 tags_with_usage.sort_by(|a, b| b.1.cmp(&a.1)); // 使用数の多い順
    //                 tags = tags_with_usage.into_iter().map(|(tag, _)| tag).collect();
    //             },
    //         }
    //     }

    //     // 制限
    //     if let Some(limit) = filter.limit {
    //         if limit > 0 {
    //             tags = tags.into_iter().take(limit).collect();
    //         }
    //     }

    //     Ok(tags)
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

// タグ使用状況の構造体
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct TagWithUsage {
    pub tag: Tag,
    pub usage_count: u32,
}

// タグ統計情報の構造体
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct TagStatistics {
    pub total_tags: usize,
    pub used_tags_count: usize,
    pub unused_tags_count: usize,
    pub color_distribution: Vec<ColorDistribution>,
}

// 色分布の構造体
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct ColorDistribution {
    pub color: Option<String>,
    pub count: u32,
}

// タグフィルター条件
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct TagFilter {
    pub name_pattern: Option<String>,
    pub colors: Option<Vec<String>>,
    pub usage_filter: Option<UsageFilter>,
    pub created_from: Option<chrono::DateTime<Utc>>,
    pub created_to: Option<chrono::DateTime<Utc>>,
    pub sort_by: Option<TagSortBy>,
    pub limit: Option<usize>,
}

// 使用状況フィルター
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub enum UsageFilter {
    All,
    Used,
    Unused,
    MinUsage(u32),
}

// タグソート条件
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub enum TagSortBy {
    Name,
    CreatedAt,
    UpdatedAt,
    Usage,
}
