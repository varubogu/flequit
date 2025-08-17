//! Sea-ORMのSchema Builderを使用した自動マイグレーション
//!
//! エンティティ定義からテーブルを自動生成

use sea_orm::sea_query::TableCreateStatement;
use sea_orm::{ConnectionTrait, DatabaseConnection, DbBackend, DbErr, Schema};

use crate::models::sqlite::{
    account::Entity as AccountEntity, project::Entity as ProjectEntity,
    setting::Entity as SettingsEntity, subtask::Entity as SubtaskEntity, tag::Entity as TagEntity,
    task::Entity as TaskEntity, task_list::Entity as TaskListEntity,
};

/// エンティティからテーブルを自動生成するマイグレーション
pub async fn run_auto_migrations(db: &DatabaseConnection) -> Result<(), DbErr> {
    let schema = Schema::new(DbBackend::Sqlite);

    // 各エンティティからCREATE TABLE文を生成
    let entities: Vec<Box<dyn Fn(&Schema) -> TableCreateStatement>> = vec![
        Box::new(|schema| schema.create_table_from_entity(SettingsEntity)),
        Box::new(|schema| schema.create_table_from_entity(AccountEntity)),
        Box::new(|schema| schema.create_table_from_entity(ProjectEntity)),
        Box::new(|schema| schema.create_table_from_entity(TaskListEntity)),
        Box::new(|schema| schema.create_table_from_entity(TaskEntity)),
        Box::new(|schema| schema.create_table_from_entity(SubtaskEntity)),
        Box::new(|schema| schema.create_table_from_entity(TagEntity)),
    ];

    // 各テーブルを作成
    for entity_fn in entities {
        let stmt = entity_fn(&schema);
        db.execute(db.get_database_backend().build(&stmt)).await?;
    }

    Ok(())
}

/// インデックスを手動で追加（エンティティの#[sea_orm(indexed)]から自動生成されない場合）
pub async fn create_additional_indexes(db: &DatabaseConnection) -> Result<(), DbErr> {
    use sea_orm::sea_query::Index;

    // 複合インデックスや特殊なインデックスを手動で作成
    let indexes = vec![
        // アカウントのプロバイダー・プロバイダーID複合インデックス
        Index::create()
            .name("idx_accounts_provider_provider_id")
            .table(AccountEntity)
            .col(crate::models::sqlite::account::Column::Provider)
            .col(crate::models::sqlite::account::Column::ProviderId)
            .unique()
            .to_owned(),
    ];

    for index in indexes {
        db.execute(db.get_database_backend().build(&index)).await?;
    }

    Ok(())
}
