# DueDateButtons (期日ボタン) - due_date_buttons

## 概要
期日設定UIでのクイックボタン表示制御を管理するエンティティ。

## フィールド定義

| 論理名 | 物理名 | Rustでの型 | 説明 | PK | UK | NN | デフォルト値 | 外部キー | PostgreSQL型 | SQLite型 | TypeScript型 |
|--------|--------|-----------|------|----|----|----|-----------|---------|-----------|---------|-----------|
| 設定ID | id | String | 設定ID | ✓ | - | ✓ | - | - | UUID | TEXT | string |
| 期限切れ | overdue | bool | 期限切れ | - | - | ✓ | false | - | BOOLEAN | INTEGER | boolean |
| 今日 | today | bool | 今日 | - | - | ✓ | true | - | BOOLEAN | INTEGER | boolean |
| 明日 | tomorrow | bool | 明日 | - | - | ✓ | true | - | BOOLEAN | INTEGER | boolean |
| 3日以内 | three_days | bool | 3日以内 | - | - | ✓ | true | - | BOOLEAN | INTEGER | boolean |
| 今週 | this_week | bool | 今週 | - | - | ✓ | true | - | BOOLEAN | INTEGER | boolean |
| 今月 | this_month | bool | 今月 | - | - | ✓ | true | - | BOOLEAN | INTEGER | boolean |
| 今四半期 | this_quarter | bool | 今四半期 | - | - | ✓ | false | - | BOOLEAN | INTEGER | boolean |
| 今年 | this_year | bool | 今年 | - | - | ✓ | false | - | BOOLEAN | INTEGER | boolean |
| 年末 | this_year_end | bool | 年末 | - | - | ✓ | false | - | BOOLEAN | INTEGER | boolean |

## 制約
- PRIMARY KEY: id
- NOT NULL: id, overdue, today, tomorrow, three_days, this_week, this_month, this_quarter, this_year, this_year_end

## インデックス
```sql
CREATE INDEX IF NOT EXISTS idx_due_date_buttons_today ON due_date_buttons(today);
CREATE INDEX IF NOT EXISTS idx_due_date_buttons_this_week ON due_date_buttons(this_week);
```

## 関連テーブル
なし

## 備考
期日設定画面でのクイックボタンの表示/非表示制御。ユーザーの使用頻度に応じて表示項目をカスタマイズ可能。