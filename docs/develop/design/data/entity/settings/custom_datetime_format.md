# CustomDateTimeFormat (ユーザー定義カスタム日時フォーマット) - custom_datetime_formats

## 概要
ユーザーが定義するカスタム日時フォーマット設定エンティティ。

## フィールド定義

| 論理名 | 物理名 | Rustでの型 | 説明 | PK | UK | NN | デフォルト値 | 外部キー | PostgreSQL型 | SQLite型 | TypeScript型 |
|--------|--------|-----------|------|----|----|----|-----------|---------|-----------|---------|-----------|
| カスタムフォーマットID | id | String | カスタムフォーマットID（UUID文字列） | ✓ | - | ✓ | - | - | UUID | TEXT | string |
| フォーマット表示名 | name | String | ユーザーが定義したフォーマット表示名 | - | - | ✓ | - | - | TEXT | TEXT | string |
| フォーマット文字列 | format | String | chrono形式の日時フォーマット文字列 | - | - | ✓ | - | - | TEXT | TEXT | string |
| フォーマットグループ | group | String | フォーマットグループ（常にCustomFormatを想定） | - | - | ✓ | "CustomFormat" | - | TEXT | TEXT | string |
| 表示順序 | order | i32 | 表示順序（ユーザーが自由に設定） | - | - | ✓ | 0 | - | INTEGER | INTEGER | number |

## 制約
- PRIMARY KEY: id
- NOT NULL: id, name, format, group, order

## インデックス
```sql
CREATE INDEX IF NOT EXISTS idx_custom_datetime_formats_group ON custom_datetime_formats(group);
CREATE INDEX IF NOT EXISTS idx_custom_datetime_formats_order ON custom_datetime_formats(order);
```

## 関連テーブル
- datetime_formats: 統合日時フォーマット管理

## 備考
UUID文字列をIDに使用してプリセットフォーマットと区別。ユーザー定義可能な自由度の高い設計。