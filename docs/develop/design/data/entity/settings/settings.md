# Settings (統合設定) - settings

## 概要
アプリケーションの全設定項目を管理する統合設定エンティティ。フロントエンドのSettings型に対応。

## フィールド定義

| 論理名 | 物理名 | Rustでの型 | 説明 | PK | UK | NN | デフォルト値 | 外部キー | PostgreSQL型 | SQLite型 | TypeScript型 |
|--------|--------|-----------|------|----|----|----|-----------|---------|-----------|---------|-----------|
| 設定ID | id | String | 設定ID（通常は固定値"app_settings"） | ✓ | - | ✓ | "app_settings" | - | UUID | TEXT | string |
| UIテーマ | theme | String | UIテーマ（"system", "light", "dark"） | - | - | ✓ | "system" | - | TEXT | TEXT | string |
| 言語設定 | language | String | 言語設定（ISO 639-1形式） | - | - | ✓ | "ja" | - | TEXT | TEXT | string |
| フォント名 | font | String | フォント名 | - | - | ✓ | "system" | - | TEXT | TEXT | string |
| フォントサイズ | font_size | i32 | フォントサイズ | - | - | ✓ | 14 | - | INTEGER | INTEGER | number |
| フォント色 | font_color | String | フォント色 | - | - | ✓ | "#000000" | - | TEXT | TEXT | string |
| 背景色 | background_color | String | 背景色 | - | - | ✓ | "#FFFFFF" | - | TEXT | TEXT | string |
| 週の開始曜日 | week_start | String | 週の開始曜日（"sunday", "monday"） | - | - | ✓ | "monday" | - | TEXT | TEXT | string |
| タイムゾーン | timezone | String | タイムゾーン | - | - | ✓ | "Asia/Tokyo" | - | TEXT | TEXT | string |
| カスタム期日日数 | custom_due_days | String | カスタム期日日数（JSON形式） | - | - | ✓ | "[1,3,7,14,30]" | - | TEXT | TEXT | number[] |
| 最後に選択されたアカウントID | last_selected_account | String | 最後に選択されたアカウントID | - | - | ✓ | "" | - | TEXT | TEXT | string |

## 制約
- PRIMARY KEY: id
- NOT NULL: すべてのフィールド

## インデックス
```sql
CREATE INDEX IF NOT EXISTS idx_settings_theme ON settings(theme);
CREATE INDEX IF NOT EXISTS idx_settings_language ON settings(language);
```

## 関連テーブル
- datetime_format: 日時フォーマット設定（1:1）
- time_labels: 時刻ラベル設定（1:N）
- due_date_buttons: 期日ボタン設定（1:N）
- view_items: ビューアイテム設定（1:N）

## 備考
アプリケーションの全設定項目を単一構造体で管理する統合設定システム。フロントエンドのSettings型と対応しており、設定画面での一括更新を前提とした設計。

## 関連ファイル
- Rustモデル: `src-tauri/crates/flequit-model/src/models/settings.rs`
- TypeScript型: `src/lib/types/settings.ts`