# AppPresetFormat (アプリケーション標準プリセットフォーマット) - app_preset_formats

## 概要
アプリケーション標準の日時フォーマットプリセットを管理するエンティティ。

## フィールド定義

| 論理名 | 物理名 | Rustでの型 | 説明 | PK | UK | NN | デフォルト値 | 外部キー | PostgreSQL型 | SQLite型 | TypeScript型 |
|--------|--------|-----------|------|----|----|----|-----------|---------|-----------|---------|-----------|
| プリセットID | id | i32 | プリセットID（負の整数） | ✓ | - | ✓ | - | - | INTEGER | INTEGER | number |
| フォーマット表示名 | name | String | フォーマット表示名（多言語対応前提） | - | - | ✓ | - | - | TEXT | TEXT | string |
| フォーマット文字列 | format | String | chrono形式の日時フォーマット文字列 | - | - | ✓ | - | - | TEXT | TEXT | string |
| フォーマットグループ | group | String | フォーマットグループ（通常はPreset） | - | - | ✓ | "Preset" | - | TEXT | TEXT | string |
| 表示順序 | order | i32 | 表示順序（UI選択肢での優先順位） | - | - | ✓ | 0 | - | INTEGER | INTEGER | number |

## 制約
- PRIMARY KEY: id
- NOT NULL: id, name, format, group, order

## インデックス
```sql
CREATE INDEX IF NOT EXISTS idx_app_preset_formats_group ON app_preset_formats(group);
CREATE INDEX IF NOT EXISTS idx_app_preset_formats_order ON app_preset_formats(order);
```

## 関連テーブル
- datetime_formats: 統合日時フォーマット管理

## 備考
負の整数IDを使用してカスタムフォーマットと区別。多言語対応を前提とした表示名設計。