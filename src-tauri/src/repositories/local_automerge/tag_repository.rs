use async_trait::async_trait;
use crate::errors::RepositoryError;
use crate::repositories::local_automerge::LocalAutomergeRepository;
use crate::models::tag_models::Tag;
use crate::repositories::core::tag_repository_trait::TagRepositoryTrait;



#[async_trait]
impl TagRepositoryTrait for LocalAutomergeRepository {
    async fn set_tag(&self, tag: &Tag) -> Result<(), RepositoryError> {
        self.storage.set_tag(tag).await
    }

    async fn get_tag(&self, tag_id: &str) -> Result<Option<Tag>, RepositoryError> {
        self.storage.get_tag(tag_id).await
    }

    async fn list_tags(&self) -> Result<Vec<Tag>, RepositoryError> {
        self.storage.list_tags().await
    }

    async fn delete_tag(&self, _tag_id: &str) -> Result<(), RepositoryError> {
        // ローカルAutomergeでは物理削除
        // 実装では該当タグドキュメントを削除する
        todo!("Implementation pending - タグ物理削除")
    }

    async fn find_tags_by_name(&self, name_pattern: &str) -> Result<Vec<Tag>, RepositoryError> {
        let all_tags = self.storage.list_tags().await?;
        let filtered_tags = all_tags
            .into_iter()
            .filter(|tag| tag.name.to_lowercase().contains(&name_pattern.to_lowercase()))
            .collect();
        Ok(filtered_tags)
    }

    async fn find_tags_by_color(&self, color: &str) -> Result<Vec<Tag>, RepositoryError> {
        let all_tags = self.storage.list_tags().await?;
        let filtered_tags = all_tags
            .into_iter()
            .filter(|tag| {
                if let Some(tag_color) = &tag.color {
                    tag_color == color
                } else {
                    false
                }
            })
            .collect();
        Ok(filtered_tags)
    }

    async fn get_tag_usage_count(&self, tag_id: &str) -> Result<u32, RepositoryError> {
        // 全プロジェクトの全タスクをチェックしてタグ使用回数をカウント
        let all_projects = self.storage.list_projects().await?;
        let mut usage_count = 0u32;

        for project in all_projects {
            let tasks = self.storage.list_tasks(&project.id).await?;
            for task in tasks {
                if task.tag_ids.contains(&tag_id.to_string()) {
                    usage_count += 1;
                }
            }
        }

        Ok(usage_count)
    }

    async fn get_tags_with_usage_count(&self) -> Result<Vec<(Tag, u32)>, RepositoryError> {
        let all_tags = self.storage.list_tags().await?;
        let mut tags_with_usage = Vec::new();

        for tag in all_tags {
            let usage_count = self.get_tag_usage_count(&tag.id).await?;
            tags_with_usage.push((tag, usage_count));
        }

        Ok(tags_with_usage)
    }

    async fn get_popular_tags(&self, limit: u32) -> Result<Vec<(Tag, u32)>, RepositoryError> {
        let mut tags_with_usage = self.get_tags_with_usage_count().await?;

        // 使用回数で降順ソート
        tags_with_usage.sort_by(|a, b| b.1.cmp(&a.1));

        // 指定された件数まで切り取り
        tags_with_usage.truncate(limit as usize);

        Ok(tags_with_usage)
    }

    async fn get_unused_tags(&self) -> Result<Vec<Tag>, RepositoryError> {
        let tags_with_usage = self.get_tags_with_usage_count().await?;
        let unused_tags = tags_with_usage
            .into_iter()
            .filter(|(_, usage_count)| *usage_count == 0)
            .map(|(tag, _)| tag)
            .collect();

        Ok(unused_tags)
    }

    async fn validate_tag_exists(&self, tag_id: &str) -> Result<bool, RepositoryError> {
        match self.storage.get_tag(tag_id).await? {
            Some(_) => Ok(true),
            None => Ok(false),
        }
    }

    async fn is_tag_name_unique(&self, name: &str, exclude_id: Option<&str>) -> Result<bool, RepositoryError> {
        let all_tags = self.storage.list_tags().await?;

        for tag in all_tags {
            if tag.name.to_lowercase() == name.to_lowercase() {
                // exclude_idが指定されている場合、そのIDは除外する
                if let Some(exclude_id) = exclude_id {
                    if tag.id == exclude_id {
                        continue;
                    }
                }
                return Ok(false); // 重複あり
            }
        }

        Ok(true) // ユニーク
    }

    async fn can_delete_tag(&self, tag_id: &str) -> Result<bool, RepositoryError> {
        let usage_count = self.get_tag_usage_count(tag_id).await?;
        Ok(usage_count == 0)
    }

    async fn get_tag_count(&self) -> Result<u64, RepositoryError> {
        let tags = self.storage.list_tags().await?;
        Ok(tags.len() as u64)
    }

    async fn get_color_distribution(&self) -> Result<Vec<(Option<String>, u32)>, RepositoryError> {
        let all_tags = self.storage.list_tags().await?;
        let mut color_counts = std::collections::HashMap::new();

        for tag in all_tags {
            let color_key = tag.color.clone();
            *color_counts.entry(color_key).or_insert(0) += 1;
        }

        let distribution = color_counts
            .into_iter()
            .collect();

        Ok(distribution)
    }
}
