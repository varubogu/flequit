# Setting (汎用設定) - settings

## 概要
汎用的なキー・バリュー型設定情報を管理するエンティティ。

## フィールド定義

| 論理名 | 物理名 | Rustでの型 | 説明 | PK | UK | NN | デフォルト値 | 外部キー | PostgreSQL型 | SQLite型 | TypeScript型 |
|--------|--------|-----------|------|----|----|----|-----------|---------|-----------|---------|-----------|
| 設定ID | id | String | 設定項目の一意識別子 | ✓ | - | ✓ | - | - | UUID | TEXT | string |
| 設定キー | key | String | 設定キー（ドット記法推奨） | - | ✓ | ✓ | - | - | TEXT | TEXT | string |
| 設定値 | value | String | 設定値（文字列として保存、型変換は利用側で実施） | - | - | ✓ | - | - | TEXT | TEXT | string |
| 値の型情報 | data_type | String | 値の型情報 | - | - | ✓ | "string" | - | TEXT | TEXT | string |
| 作成日時 | created_at | String | 設定作成日時（文字列形式） | - | - | ✓ | - | - | TEXT | TEXT | string |
| 最終更新日時 | updated_at | String | 最終更新日時（文字列形式） | - | - | ✓ | - | - | TEXT | TEXT | string |

## 制約
- PRIMARY KEY: id
- UNIQUE: key
- NOT NULL: id, key, value, data_type, created_at, updated_at

## インデックス
```sql
CREATE UNIQUE INDEX IF NOT EXISTS idx_settings_key ON settings(key);
CREATE INDEX IF NOT EXISTS idx_settings_data_type ON settings(data_type);
CREATE INDEX IF NOT EXISTS idx_settings_created_at ON settings(created_at);
```

## 関連テーブル
なし

## 備考
拡張可能な設定システム。キー・バリュー形式で柔軟な設定項目を管理。型情報によりアプリケーション側で適切な型変換を実行。