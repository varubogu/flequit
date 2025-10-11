# WeekdayCondition (曜日条件) - weekday_conditions

## 概要
曜日に基づく条件調整を管理するエンティティ。

## フィールド定義

| 論理名 | 物理名 | Rustでの型 | 説明 | PK | UK | NN | デフォルト値 | 外部キー | PostgreSQL型 | SQLite型 | TypeScript型 |
|--------|--------|-----------|------|----|----|----|-----------|---------|-----------|---------|-----------|
| 条件ID | id | String | 条件の一意識別子 | ✓ | - | ✓ | - | - | UUID | TEXT | string |
| 判定対象曜日 | if_weekday | String | 判定対象の曜日 | - | - | ✓ | - | - | TEXT | TEXT | string |
| 調整方向 | then_direction | String | 調整方向（前・後・最近等） | - | - | ✓ | - | - | TEXT | TEXT | string |
| 調整対象 | then_target | String | 調整対象（平日・特定曜日・日数等） | - | - | ✓ | - | - | TEXT | TEXT | string |
| 調整先曜日 | then_weekday | Option<String> | 調整先の曜日（target=特定曜日の場合） | - | - | - | NULL | - | TEXT | TEXT | string \| null |
| 調整日数 | then_days | Option<i32> | 調整日数（target=日数の場合） | - | - | - | NULL | - | INTEGER | INTEGER | number \| null |

## 制約
- PRIMARY KEY: id
- NOT NULL: id, if_weekday, then_direction, then_target

## インデックス
```sql
CREATE INDEX IF NOT EXISTS idx_weekday_conditions_if_weekday ON weekday_conditions(if_weekday);
CREATE INDEX IF NOT EXISTS idx_weekday_conditions_then_target ON weekday_conditions(then_target);
```

## 関連テーブル
なし

## 備考
営業日調整や曜日固定タスクに使用。条件分岐ロジックで柔軟な日付調整を実現。