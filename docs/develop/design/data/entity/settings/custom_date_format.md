# CustomDateFormat (カスタム日付フォーマット) - custom_date_formats

## 概要
カスタム日付フォーマットを管理するエンティティ。

## フィールド定義

| 論理名 | 物理名 | Rustでの型 | 説明 | PK | UK | NN | デフォルト値 | 外部キー | PostgreSQL型 | SQLite型 | TypeScript型 |
|--------|--------|-----------|------|----|----|----|-----------|---------|-----------|---------|-----------|
| フォーマットID | id | String | フォーマットID | ✓ | - | ✓ | - | - | UUID | TEXT | string |
| フォーマット名 | name | String | フォーマット名 | - | - | ✓ | - | - | TEXT | TEXT | string |
| フォーマット文字列 | format | String | フォーマット文字列 | - | - | ✓ | - | - | TEXT | TEXT | string |

## 制約
- PRIMARY KEY: id
- NOT NULL: id, name, format

## インデックス
```sql
CREATE INDEX IF NOT EXISTS idx_custom_date_formats_name ON custom_date_formats(name);
```

## 関連テーブル
なし

## 備考
日付専用のカスタムフォーマット管理。シンプルな構造でユーザー定義の日付表示形式を管理。