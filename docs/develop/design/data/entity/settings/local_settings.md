# LocalSettings (ローカル環境設定) - local_settings

## 概要
ローカル環境固有の設定情報を管理するエンティティ。

## フィールド定義

| 論理名 | 物理名 | Rustでの型 | 説明 | PK | UK | NN | デフォルト値 | 外部キー | PostgreSQL型 | SQLite型 | TypeScript型 |
|--------|--------|-----------|------|----|----|----|-----------|---------|-----------|---------|-----------|
| 設定ID | id | String | 設定ID | ✓ | - | ✓ | - | - | UUID | TEXT | string |
| UIテーマ | theme | String | UIテーマ設定 | - | - | ✓ | "system" | - | TEXT | TEXT | string |
| 表示言語 | language | String | 表示言語設定（ISO 639-1形式） | - | - | ✓ | "ja" | - | TEXT | TEXT | string |

## 制約
- PRIMARY KEY: id
- NOT NULL: id, theme, language

## インデックス
```sql
CREATE INDEX IF NOT EXISTS idx_local_settings_theme ON local_settings(theme);
CREATE INDEX IF NOT EXISTS idx_local_settings_language ON local_settings(language);
```

## 関連テーブル
なし

## 備考
ローカル環境に特化した設定。テーマ（ダーク/ライト/システム）と言語設定を管理。