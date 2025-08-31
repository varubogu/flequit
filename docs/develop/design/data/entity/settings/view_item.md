# ViewItem (ビューアイテム) - view_items

## 概要
UI表示要素の設定を管理するエンティティ。

## フィールド定義

| 論理名 | 物理名 | Rustでの型 | 説明 | PK | UK | NN | デフォルト値 | 外部キー | PostgreSQL型 | SQLite型 | TypeScript型 |
|--------|--------|-----------|------|----|----|----|-----------|---------|-----------|---------|-----------|
| ビューアイテムID | id | String | ビューアイテム一意識別子 | ✓ | - | ✓ | - | - | UUID | TEXT | string |
| 表示ラベル | label | String | 表示ラベル | - | - | ✓ | - | - | TEXT | TEXT | string |
| アイコン名 | icon | String | アイコン名 | - | - | ✓ | - | - | TEXT | TEXT | string |
| 表示状態 | visible | bool | 表示状態 | - | - | ✓ | true | - | BOOLEAN | INTEGER | boolean |
| 表示順序 | order | i32 | 表示順序 | - | - | ✓ | 0 | - | INTEGER | INTEGER | number |

## 制約
- PRIMARY KEY: id
- NOT NULL: id, label, icon, visible, order

## インデックス
```sql
CREATE INDEX IF NOT EXISTS idx_view_items_visible ON view_items(visible);
CREATE INDEX IF NOT EXISTS idx_view_items_order ON view_items(order);
```

## 関連テーブル
なし

## 備考
UI要素の動的な表示制御に使用。メニューやボタンの可視性と順序を管理。