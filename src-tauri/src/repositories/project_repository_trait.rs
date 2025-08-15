use crate::errors::RepositoryError;
use crate::models::project::Project;
use crate::repositories::base_repository_trait::Repository;
use async_trait::async_trait;

/// プロジェクト専用リポジトリトレイト
/// 
/// 汎用的な`Repository<Project>`を継承し、プロジェクト固有の操作のみを追加定義する。
/// 
/// # 設計原則
/// 
/// 1. **単一責任**: プロジェクト管理のみに特化
/// 2. **YAGNI原則**: 必要になるまで機能は追加しない
/// 3. **シンプル**: 基本CRUDは`Repository<Project>`を使用
/// 4. **関心の分離**: メンバー管理は別のリポジトリが担当
/// 
/// # 基本操作
/// 
/// ```rust
/// // 基本CRUD操作（Repository<Project>から継承）
/// repository.save(&project).await?;              // プロジェクト保存
/// repository.find_by_id("id").await?;            // ID検索
/// repository.find_all().await?;                  // 全件取得
/// repository.delete("id").await?;                // 削除
/// repository.exists("id").await?;                // 存在確認
/// repository.count().await?;                     // 件数取得
/// ```
/// 
/// # プロジェクト固有操作
/// 
/// 現時点では**追加機能は不要**と判断。
/// 将来的に必要な場合のみ、具体的な要件に基づいて追加する。
#[async_trait]
#[allow(dead_code)]
pub trait ProjectRepositoryTrait: Repository<Project> {
    // 現時点ではプロジェクト固有の追加メソッドは不要
    // 
    // 理由:
    // 1. 基本CRUD操作は Repository<Project> で十分
    // 2. 検索はクエリ層またはService層で対応
    // 3. メンバー管理は別リポジトリで分離
    // 4. バリデーションはドメイン層で対応
    //
    // 将来追加が必要な場合の例:
    // - async fn archive_project(&self, project_id: &str) -> Result<(), RepositoryError>;
    // - async fn restore_project(&self, project_id: &str) -> Result<(), RepositoryError>;
}
