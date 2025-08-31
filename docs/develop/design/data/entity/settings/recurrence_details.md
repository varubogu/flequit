# RecurrenceDetails (繰り返し詳細設定) - recurrence_details

## 概要
繰り返しルールの詳細な条件設定を管理するエンティティ。

## フィールド定義

| 論理名 | 物理名 | Rustでの型 | 説明 | PK | UK | NN | デフォルト値 | 外部キー | PostgreSQL型 | SQLite型 | TypeScript型 |
|--------|--------|-----------|------|----|----|----|-----------|---------|-----------|---------|-----------|
| 詳細設定ID | id | String | 詳細設定ID | ✓ | - | ✓ | - | - | UUID | TEXT | string |
| 月の特定日 | specific_date | Option<i32> | 月の特定日（1-31、月次繰り返し時） | - | - | - | NULL | - | INTEGER | INTEGER | number \| null |
| 期間内特定週 | week_of_period | Option<String> | 期間内の特定週（第1週、最終週等） | - | - | - | NULL | - | TEXT | TEXT | string \| null |
| 週の特定曜日 | weekday_of_week | Option<String> | 週の特定曜日 | - | - | - | NULL | - | TEXT | TEXT | string \| null |

## 制約
- PRIMARY KEY: id
- NOT NULL: id

## インデックス
```sql
CREATE INDEX IF NOT EXISTS idx_recurrence_details_specific_date ON recurrence_details(specific_date);
CREATE INDEX IF NOT EXISTS idx_recurrence_details_week_of_period ON recurrence_details(week_of_period);
```

## 関連テーブル
- recurrence_rules: 関連する繰り返しルール

## 備考
複雑な繰り返しパターンの詳細条件を管理。月末日、第3火曜日など細かい指定に対応。