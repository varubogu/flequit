# TimeLabel (時刻ラベル) - time_labels

## 概要
時刻に対するラベル付けを管理するエンティティ。

## フィールド定義

| 論理名 | 物理名 | Rustでの型 | 説明 | PK | UK | NN | デフォルト値 | 外部キー | PostgreSQL型 | SQLite型 | TypeScript型 |
|--------|--------|-----------|------|----|----|----|-----------|---------|-----------|---------|-----------|
| ラベルID | id | String | ラベルID | ✓ | - | ✓ | - | - | UUID | TEXT | string |
| ラベル名 | name | String | ラベル名 | - | - | ✓ | - | - | TEXT | TEXT | string |
| 時刻 | time | String | 時刻（HH:mm形式） | - | - | ✓ | - | - | TEXT | TEXT | string |

## 制約
- PRIMARY KEY: id
- NOT NULL: id, name, time

## インデックス
```sql
CREATE INDEX IF NOT EXISTS idx_time_labels_time ON time_labels(time);
CREATE INDEX IF NOT EXISTS idx_time_labels_name ON time_labels(name);
```

## 関連テーブル
なし

## 備考
時刻に対する意味的なラベル付け（「朝礼」「昼休み」など）を管理。HH:mm形式で時刻を保存。