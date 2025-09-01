# DueDateButtons (期日ボタン) - due_date_buttons

## 概要
期日設定UIでのクイックボタン表示制御を管理するエンティティ。

## フィールド定義

| 論理名 | 物理名 | Rustでの型 | 説明 | PK | UK | NN | デフォルト値 | 外部キー | PostgreSQL型 | SQLite型 | TypeScript型 |
|--------|--------|-----------|------|----|----|----|-----------|---------|-----------|---------|-----------|
| ID | id | String | 期日ボタンID | ✓ | - | ✓ | - | - | UUID | TEXT | string |
| 名前 | name | String | 期日ボタン名 | - | - | ✓ | - | - | VARCHAR(50) | TEXT | string |
| 表示フラグ | is_visible | bool | 表示/非表示制御 | - | - | ✓ | true | - | BOOLEAN | INTEGER | boolean |
| 順番 | display_order | i32 | 表示順序 | - | - | ✓ | - | - | INTEGER | INTEGER | number |

## 制約
- PRIMARY KEY: id
- UNIQUE KEY: name
- NOT NULL: id, name, is_visible, display_order

## インデックス
```sql
CREATE INDEX IF NOT EXISTS idx_due_date_buttons_visible_order ON due_date_buttons(is_visible, display_order);
CREATE INDEX IF NOT EXISTS idx_due_date_buttons_display_order ON due_date_buttons(display_order);
```

## 関連テーブル
なし

## 備考
期日設定画面でのクイックボタンの表示/非表示制御。ユーザーの使用頻度に応じて表示項目をカスタマイズ可能。

## デフォルトデータ例
```sql
INSERT INTO due_date_buttons (id, name, is_visible, display_order) VALUES
('overdue', '期限切れ', false, 1),
('today', '今日', true, 2),
('tomorrow', '明日', true, 3),
('three_days', '3日以内', true, 4),
('this_week', '今週', true, 5),
('this_month', '今月', true, 6),
('this_quarter', '今四半期', false, 7),
('this_year', '今年', false, 8),
('this_year_end', '年末', false, 9);
```