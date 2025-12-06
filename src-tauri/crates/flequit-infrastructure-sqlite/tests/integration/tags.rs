//! タグ単体テスト
//!
//! testing.mdルール準拠のSQLiteタグリポジトリテスト

use chrono::{DateTime, Utc};
use flequit_infrastructure_sqlite::infrastructure::database_manager::DatabaseManager;
use flequit_infrastructure_sqlite::infrastructure::task_projects::tag::TagLocalSqliteRepository;
use flequit_model::models::task_projects::tag::Tag;
use flequit_model::types::id_types::{ProjectId, TagId, UserId};
use flequit_repository::project_repository_trait::ProjectRepository;
use std::sync::Arc;
use uuid::Uuid;

use flequit_testing::TestPathGenerator;
use function_name::named;

use crate::integration::support::sqlite::SqliteTestHarness;

#[named]
#[tokio::test]
async fn test_tag_create_operation() -> Result<(), Box<dyn std::error::Error>> {
    // テンプレートディレクトリ
    let crate_name = env!("CARGO_PKG_NAME");
    let template_dir = TestPathGenerator::generate_test_crate_dir(crate_name);

    // テストデータベースを作成
    let test_case = function_name!();
    let output_dir = TestPathGenerator::generate_test_dir(file!(), test_case);
    let output_file_path = SqliteTestHarness::copy_database_template(&template_dir, &output_dir)?;

    // リポジトリを初期化
    let db_manager = DatabaseManager::new_for_test(&output_file_path.to_string_lossy().to_string());
    let db_manager_arc = Arc::new(tokio::sync::RwLock::new(db_manager));
    let tag_repo = TagLocalSqliteRepository::new(db_manager_arc);

    // プロジェクトIDを作成（タグはプロジェクト内で管理される）
    let project_id = ProjectId::from(Uuid::new_v4());

    // タグ作成
    let tag_id = TagId::from(Uuid::new_v4());
    let user_id = UserId::from(Uuid::new_v4());
    let timestamp = DateTime::<Utc>::from_timestamp(1717708800, 0).unwrap();
    let tag = Tag {
        id: tag_id.clone(),
        name: "Create操作SQLiteタグ".to_string(),
        color: Some("#FF9800".to_string()),
        order_index: Some(1),
        created_at: timestamp,
        updated_at: timestamp,
        deleted: false,
        updated_by: user_id,
    };

    // Create操作
    tag_repo.save(&project_id, &tag, &user_id, &timestamp).await?;

    // 作成確認
    let retrieved = tag_repo.find_by_id(&project_id, &tag_id).await?;
    assert!(retrieved.is_some());
    let retrieved = retrieved.unwrap();
    assert_eq!(retrieved.id, tag.id);
    assert_eq!(retrieved.name, tag.name);
    assert_eq!(retrieved.color, tag.color);
    assert_eq!(retrieved.order_index, tag.order_index);

    Ok(())
}

#[named]
#[tokio::test]
async fn test_tag_read_operation() -> Result<(), Box<dyn std::error::Error>> {
    // テンプレートディレクトリ
    let crate_name = env!("CARGO_PKG_NAME");
    let template_dir = TestPathGenerator::generate_test_crate_dir(crate_name);

    // テストデータベースを作成
    let test_case = function_name!();
    let output_dir = TestPathGenerator::generate_test_dir(file!(), test_case);
    let output_file_path = SqliteTestHarness::copy_database_template(&template_dir, &output_dir)?;

    // リポジトリを初期化
    let db_manager = DatabaseManager::new_for_test(&output_file_path.to_string_lossy().to_string());
    let db_manager_arc = Arc::new(tokio::sync::RwLock::new(db_manager));
    let tag_repo = TagLocalSqliteRepository::new(db_manager_arc);

    // プロジェクトIDを作成（タグはプロジェクト内で管理される）
    let project_id = ProjectId::from(Uuid::new_v4());

    // 2件のタグ作成
    let tag_id1 = TagId::from(Uuid::new_v4());
    let user_id = UserId::from(Uuid::new_v4());
    let timestamp = DateTime::<Utc>::from_timestamp(1717708800, 0).unwrap();
    let tag1 = Tag {
        id: tag_id1.clone(),
        name: "Read操作SQLiteタグ1".to_string(),
        color: Some("#E91E63".to_string()),
        order_index: Some(1),
        created_at: timestamp,
        updated_at: timestamp,
        deleted: false,
        updated_by: user_id,
    };

    let tag_id2 = TagId::from(Uuid::new_v4());
    let user_id = UserId::from(Uuid::new_v4());
    let timestamp = DateTime::<Utc>::from_timestamp(1717708800, 0).unwrap();
    let tag2 = Tag {
        id: tag_id2.clone(),
        name: "Read操作SQLiteタグ2".to_string(),
        color: Some("#9C27B0".to_string()),
        order_index: Some(2),
        created_at: timestamp,
        updated_at: timestamp,
        deleted: false,
        updated_by: user_id,
    };

    // 2件とも保存
    tag_repo.save(&project_id, &tag1, &user_id, &timestamp).await?;
    tag_repo.save(&project_id, &tag2, &user_id, &timestamp).await?;

    // 1件目のみRead操作
    let retrieved = tag_repo.find_by_id(&project_id, &tag_id1).await?;
    assert!(retrieved.is_some());
    let retrieved = retrieved.unwrap();
    assert_eq!(retrieved.id, tag1.id);
    assert_eq!(retrieved.name, tag1.name);
    assert_eq!(retrieved.color, tag1.color);
    assert_eq!(retrieved.order_index, tag1.order_index);

    // 2件目が存在することも確認
    let retrieved2 = tag_repo.find_by_id(&project_id, &tag_id2).await?;
    assert!(retrieved2.is_some());

    Ok(())
}

#[named]
#[tokio::test]
async fn test_tag_update_operation() -> Result<(), Box<dyn std::error::Error>> {
    // テストデータベースを作成
    let crate_name = env!("CARGO_PKG_NAME");
    let template_dir = TestPathGenerator::generate_test_crate_dir(crate_name);

    let test_case = function_name!();
    let output_dir = TestPathGenerator::generate_test_dir(file!(), test_case);
    let output_file_path = SqliteTestHarness::copy_database_template(&template_dir, &output_dir)?;

    // リポジトリを初期化
    let db_manager = DatabaseManager::new_for_test(&output_file_path.to_string_lossy().to_string());
    let db_manager_arc = Arc::new(tokio::sync::RwLock::new(db_manager));
    let tag_repo = TagLocalSqliteRepository::new(db_manager_arc);

    // プロジェクトIDを作成（タグはプロジェクト内で管理される）
    let project_id = ProjectId::from(Uuid::new_v4());

    // 2件のタグ作成
    let tag_id1 = TagId::from(Uuid::new_v4());
    let user_id = UserId::from(Uuid::new_v4());
    let timestamp = DateTime::<Utc>::from_timestamp(1717708800, 0).unwrap();
    let tag1 = Tag {
        id: tag_id1.clone(),
        name: "Update操作SQLiteタグ1".to_string(),
        color: Some("#FF5722".to_string()),
        order_index: Some(1),
        created_at: timestamp,
        updated_at: timestamp,
        deleted: false,
        updated_by: user_id,
    };

    let tag_id2 = TagId::from(Uuid::new_v4());
    let user_id = UserId::from(Uuid::new_v4());
    let timestamp = DateTime::<Utc>::from_timestamp(1717708800, 0).unwrap();
    let tag2 = Tag {
        id: tag_id2.clone(),
        name: "Update操作SQLiteタグ2".to_string(),
        color: Some("#607D8B".to_string()),
        order_index: Some(2),
            created_at: timestamp,
        updated_at: timestamp,
        deleted: false,
        updated_by: user_id,
    };

    // 2件とも保存
    tag_repo.save(&project_id, &tag1, &user_id, &timestamp).await?;
    tag_repo.save(&project_id, &tag2, &user_id, &timestamp).await?;

    // 1件目のみUpdate操作
    let mut updated = tag1.clone();
    updated.name = "更新されたUpdate操作SQLiteタグ1".to_string();
    updated.color = Some("#009688".to_string());
    updated.order_index = Some(3);
    tag_repo.save(&project_id, &updated, &user_id, &timestamp).await?;

    // 更新後の取得確認（1件目）
    let updated_result = tag_repo.find_by_id(&project_id, &tag_id1).await?;
    assert!(updated_result.is_some());
    let updated_result = updated_result.unwrap();
    assert_eq!(updated_result.name, updated.name);
    assert_eq!(updated_result.color, updated.color);
    assert_eq!(updated_result.order_index, updated.order_index);

    // 2件目が変更されていないことを確認
    let retrieved2 = tag_repo.find_by_id(&project_id, &tag_id2).await?;
    assert!(retrieved2.is_some());
    let retrieved2 = retrieved2.unwrap();
    assert_eq!(retrieved2.name, tag2.name);
    assert_eq!(retrieved2.color, tag2.color);

    Ok(())
}

#[named]
#[tokio::test]
async fn test_tag_delete_operation() -> Result<(), Box<dyn std::error::Error>> {
    // テストデータベースを作成
    let crate_name = env!("CARGO_PKG_NAME");
    let template_dir = TestPathGenerator::generate_test_crate_dir(crate_name);

    let test_case = function_name!();
    let output_dir = TestPathGenerator::generate_test_dir(file!(), test_case);
    let output_file_path = SqliteTestHarness::copy_database_template(&template_dir, &output_dir)?;

    // リポジトリを初期化
    let db_manager = DatabaseManager::new_for_test(&output_file_path.to_string_lossy().to_string());
    let db_manager_arc = Arc::new(tokio::sync::RwLock::new(db_manager));
    let tag_repo = TagLocalSqliteRepository::new(db_manager_arc);

    // プロジェクトIDを作成（タグはプロジェクト内で管理される）
    let project_id = ProjectId::from(Uuid::new_v4());

    // 2件のタグ作成
    let tag_id1 = TagId::from(Uuid::new_v4());
    let user_id = UserId::from(Uuid::new_v4());
    let timestamp = DateTime::<Utc>::from_timestamp(1717708800, 0).unwrap();
    let tag1 = Tag {
        id: tag_id1.clone(),
        name: "Delete操作SQLiteタグ1".to_string(),
        color: Some("#3F51B5".to_string()),
        order_index: Some(1),
        created_at: timestamp,
        updated_at: timestamp,
        deleted: false,
        updated_by: user_id,
    };

    let tag_id2 = TagId::from(Uuid::new_v4());
    let user_id = UserId::from(Uuid::new_v4());
    let timestamp = DateTime::<Utc>::from_timestamp(1717708800, 0).unwrap();
    let tag2 = Tag {
        id: tag_id2.clone(),
        name: "Delete操作SQLiteタグ2".to_string(),
        color: Some("#FF9800".to_string()),
        order_index: Some(2),
        created_at: timestamp,
        updated_at: timestamp,
        deleted: false,
        updated_by: user_id,
    };

    // 2件とも保存
    tag_repo.save(&project_id, &tag1, &user_id, &timestamp).await?;
    tag_repo.save(&project_id, &tag2, &user_id, &timestamp).await?;

    // 1件目のみDelete操作
    tag_repo.delete(&project_id, &tag_id1).await?;

    // 削除確認（1件目）
    let deleted_check = tag_repo.find_by_id(&project_id, &tag_id1).await?;
    assert!(deleted_check.is_none());

    // 2件目が削除されていないことを確認
    let retrieved2 = tag_repo.find_by_id(&project_id, &tag_id2).await?;
    assert!(retrieved2.is_some());
    let retrieved2 = retrieved2.unwrap();
    assert_eq!(retrieved2.name, tag2.name);

    Ok(())
}

#[named]
#[tokio::test]
async fn test_tag_unique_constraint_across_projects() -> Result<(), Box<dyn std::error::Error>> {
    // テンプレートディレクトリ
    let crate_name = env!("CARGO_PKG_NAME");
    let template_dir = TestPathGenerator::generate_test_crate_dir(crate_name);

    // テストデータベースを作成
    let test_case = function_name!();
    let output_dir = TestPathGenerator::generate_test_dir(file!(), test_case);
    let output_file_path = SqliteTestHarness::copy_database_template(&template_dir, &output_dir)?;

    // リポジトリを初期化
    let db_manager = DatabaseManager::new_for_test(&output_file_path.to_string_lossy().to_string());
    let db_manager_arc = Arc::new(tokio::sync::RwLock::new(db_manager));
    let tag_repo = TagLocalSqliteRepository::new(db_manager_arc);

    // 2つの異なるプロジェクトIDを作成
    let project_id1 = ProjectId::from(Uuid::new_v4());
    let project_id2 = ProjectId::from(Uuid::new_v4());

    // 同じ名前のタグを異なるプロジェクトで作成
    let tag_id1 = TagId::from(Uuid::new_v4());
    let user_id = UserId::from(Uuid::new_v4());
    let timestamp = DateTime::<Utc>::from_timestamp(1717708800, 0).unwrap();
    let tag1 = Tag {
        id: tag_id1.clone(),
        name: "共通タグ名".to_string(),
        color: Some("#FF9800".to_string()),
        order_index: Some(1),
        created_at: timestamp,
        updated_at: timestamp,
        deleted: false,
        updated_by: user_id,
    };

    let tag_id2 = TagId::from(Uuid::new_v4());
    let user_id = UserId::from(Uuid::new_v4());
    let timestamp = DateTime::<Utc>::from_timestamp(1717708800, 0).unwrap();
    let tag2 = Tag {
        id: tag_id2.clone(),
        name: "共通タグ名".to_string(), // 同じ名前
        color: Some("#E91E63".to_string()),
        order_index: Some(1),
        created_at: timestamp,
        updated_at: timestamp,
        deleted: false,
        updated_by: user_id,
    };

    // 異なるプロジェクトで同じ名前のタグを作成（成功するはず）
    tag_repo.save(&project_id1, &tag1, &user_id, &timestamp).await?;
    tag_repo.save(&project_id2, &tag2, &user_id, &timestamp).await?;

    // 両方のタグが正常に作成されたことを確認
    let retrieved1 = tag_repo.find_by_id(&project_id1, &tag_id1).await?;
    assert!(retrieved1.is_some());
    assert_eq!(retrieved1.unwrap().name, "共通タグ名");

    let retrieved2 = tag_repo.find_by_id(&project_id2, &tag_id2).await?;
    assert!(retrieved2.is_some());
    assert_eq!(retrieved2.unwrap().name, "共通タグ名");

    println!("✅ 異なるプロジェクトで同じ名前のタグ作成テスト完了");
    Ok(())
}

#[named]
#[tokio::test]
async fn test_tag_unique_constraint_within_project() -> Result<(), Box<dyn std::error::Error>> {
    // テンプレートディレクトリ
    let crate_name = env!("CARGO_PKG_NAME");
    let template_dir = TestPathGenerator::generate_test_crate_dir(crate_name);

    // テストデータベースを作成
    let test_case = function_name!();
    let output_dir = TestPathGenerator::generate_test_dir(file!(), test_case);
    let output_file_path = SqliteTestHarness::copy_database_template(&template_dir, &output_dir)?;

    // リポジトリを初期化
    let db_manager = DatabaseManager::new_for_test(&output_file_path.to_string_lossy().to_string());
    let db_manager_arc = Arc::new(tokio::sync::RwLock::new(db_manager));
    let tag_repo = TagLocalSqliteRepository::new(db_manager_arc);

    // プロジェクトIDを作成
    let project_id = ProjectId::from(Uuid::new_v4());

    // 最初のタグを作成
    let tag_id1 = TagId::from(Uuid::new_v4());
    let user_id = UserId::from(Uuid::new_v4());
    let timestamp = DateTime::<Utc>::from_timestamp(1717708800, 0).unwrap();
    let tag1 = Tag {
        id: tag_id1.clone(),
        name: "重複テストタグ".to_string(),
        color: Some("#FF9800".to_string()),
        order_index: Some(1),
        created_at: timestamp,
        updated_at: timestamp,
        deleted: false,
        updated_by: user_id,
    };

    // 同じプロジェクト内で同じ名前のタグを作成
    let tag_id2 = TagId::from(Uuid::new_v4());
    let user_id = UserId::from(Uuid::new_v4());
    let timestamp = DateTime::<Utc>::from_timestamp(1717708800, 0).unwrap();
    let tag2 = Tag {
        id: tag_id2.clone(),
        name: "重複テストタグ".to_string(), // 同じ名前
        color: Some("#E91E63".to_string()),
        order_index: Some(2),
        created_at: timestamp,
        updated_at: timestamp,
        deleted: false,
        updated_by: user_id,
    };

    // 最初のタグを保存
    tag_repo.save(&project_id, &tag1, &user_id, &timestamp).await?;

    // 同じプロジェクト内で同じ名前のタグを保存（重複チェックにより無視されるはず）
    tag_repo.save(&project_id, &tag2, &user_id, &timestamp).await?;

    // 最初のタグが存在することを確認
    let retrieved1 = tag_repo.find_by_id(&project_id, &tag_id1).await?;
    assert!(retrieved1.is_some());
    assert_eq!(retrieved1.unwrap().name, "重複テストタグ");

    // 2番目のタグは存在しないことを確認（重複により無視された）
    let retrieved2 = tag_repo.find_by_id(&project_id, &tag_id2).await?;
    assert!(retrieved2.is_none());

    // プロジェクト内のタグ数を確認（1つのみ）
    let all_tags = tag_repo.find_all(&project_id).await?;
    assert_eq!(all_tags.len(), 1);
    assert_eq!(all_tags[0].id, tag_id1);

    println!("✅ 同じプロジェクト内での重複タグ名テスト完了");
    Ok(())
}

#[named]
#[tokio::test]
async fn test_tag_update_with_same_name() -> Result<(), Box<dyn std::error::Error>> {
    // テンプレートディレクトリ
    let crate_name = env!("CARGO_PKG_NAME");
    let template_dir = TestPathGenerator::generate_test_crate_dir(crate_name);

    // テストデータベースを作成
    let test_case = function_name!();
    let output_dir = TestPathGenerator::generate_test_dir(file!(), test_case);
    let output_file_path = SqliteTestHarness::copy_database_template(&template_dir, &output_dir)?;

    // リポジトリを初期化
    let db_manager = DatabaseManager::new_for_test(&output_file_path.to_string_lossy().to_string());
    let db_manager_arc = Arc::new(tokio::sync::RwLock::new(db_manager));
    let tag_repo = TagLocalSqliteRepository::new(db_manager_arc);

    // プロジェクトIDを作成
    let project_id = ProjectId::from(Uuid::new_v4());

    // タグを作成
    let tag_id = TagId::from(Uuid::new_v4());
    let user_id = UserId::from(Uuid::new_v4());
    let timestamp = DateTime::<Utc>::from_timestamp(1717708800, 0).unwrap();
    let mut tag = Tag {
        id: tag_id.clone(),
        name: "更新テストタグ".to_string(),
        color: Some("#FF9800".to_string()),
        order_index: Some(1),
        created_at: timestamp,
        updated_at: timestamp,
        deleted: false,
        updated_by: user_id,
    };

    // 最初の保存
    tag_repo.save(&project_id, &tag, &user_id, &timestamp).await?;

    // 同じタグの名前を変更して更新
    let timestamp2 = DateTime::<Utc>::from_timestamp(1717708800, 0).unwrap();
    tag.name = "更新されたタグ名".to_string();
    tag.color = Some("#E91E63".to_string());
    tag.updated_at = timestamp2;

    tag_repo.save(&project_id, &tag, &user_id, &timestamp2).await?;

    // 更新されたタグを取得して確認
    let retrieved = tag_repo.find_by_id(&project_id, &tag_id).await?;
    assert!(retrieved.is_some());
    let retrieved = retrieved.unwrap();
    assert_eq!(retrieved.name, "更新されたタグ名");
    assert_eq!(retrieved.color, Some("#E91E63".to_string()));

    println!("✅ タグ更新テスト完了");
    Ok(())
}
