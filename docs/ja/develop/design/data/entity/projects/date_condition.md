# DateCondition (日付条件) - date_conditions

## 概要
日付に基づく条件判定を管理するエンティティ。

## フィールド定義

| 論理名 | 物理名 | Rustでの型 | 説明 | PK | UK | NN | デフォルト値 | 外部キー | PostgreSQL型 | SQLite型 | TypeScript型 |
|--------|--------|-----------|------|----|----|----|-----------|---------|-----------|---------|-----------|
| 条件ID | id | String | 条件の一意識別子 | ✓ | - | ✓ | - | - | UUID | TEXT | string |
| 基準日との関係性 | relation | String | 基準日との関係性（前、後、同じ等） | - | - | ✓ | - | - | TEXT | TEXT | string |
| 比較基準日付 | reference_date | DateTime<Utc> | 比較基準となる日付 | - | - | ✓ | - | - | TIMESTAMPTZ | TEXT | string |

## 制約
- PRIMARY KEY: id
- NOT NULL: id, relation, reference_date

## インデックス
```sql
CREATE INDEX IF NOT EXISTS idx_date_conditions_relation ON date_conditions(relation);
CREATE INDEX IF NOT EXISTS idx_date_conditions_reference_date ON date_conditions(reference_date);
```

## 関連テーブル
なし

## 備考
日付に基づく条件ロジックを管理。基準日との相対的な関係性で条件判定を実行。