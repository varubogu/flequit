# エンティティファイルテンプレート

このファイルは各テーブル定義の参考テンプレートです。

## テーブル名: {テーブル名}

### 概要
このテーブルの役割や用途についての説明

### フィールド定義

| 論理名 | 物理名 | Rustでの型 | 説明 | PrimaryKey | ユニークキー | not null制約 | デフォルト値 | 外部キー | postgresでの型 | SQLiteでの型 | TypeScriptでの型 |
|--------|--------|------------|------|------------|------------|-------------|-------------|----------|----------------|--------------|------------------|
| 一意識別子 | id | String | テーブルの主キー | true | true | true | - | - | UUID | TEXT PRIMARY KEY | string |
| 作成日時 | created_at | String | レコード作成日時 | false | false | true | - | - | TIMESTAMP | TEXT | string |
| 更新日時 | updated_at | String | レコード最終更新日時 | false | false | true | - | - | TIMESTAMP | TEXT | string |

### 制約
- PRIMARY KEY: id
- UNIQUE: id
- NOT NULL: id, created_at, updated_at

### インデックス
```sql
CREATE INDEX IF NOT EXISTS idx_{table_name}_created_at ON {table_name}(created_at);
CREATE INDEX IF NOT EXISTS idx_{table_name}_updated_at ON {table_name}(updated_at);
```

### 関連テーブル
- 関連するテーブルがあれば記載

### 備考
追加の設計上の注意点や特記事項があれば記載