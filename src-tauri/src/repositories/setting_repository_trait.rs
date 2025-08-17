use async_trait::async_trait;

#[async_trait]
pub trait SettingRepositoryTrait: Send + Sync {
    async fn get_setting(&self, key: &str) -> Result<String, Box<dyn std::error::Error>>;
    async fn set_setting(&self, key: &str, value: &str) -> Result<(), Box<dyn std::error::Error>>;
    async fn delete_setting(&self, key: &str) -> Result<(), Box<dyn std::error::Error>>;
}
