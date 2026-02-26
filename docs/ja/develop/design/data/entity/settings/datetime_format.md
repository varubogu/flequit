# DateTimeFormat (統合日時フォーマット管理) - datetime_formats

## 概要

プリセットとカスタムの日時フォーマットを統合管理するビューエンティティ。

## フィールド定義

| 論理名               | 物理名 | Rustでの型 | 説明                                                               | PK  | UK  | NN  | デフォルト値 | 外部キー | PostgreSQL型 | SQLite型 | TypeScript型 |
| -------------------- | ------ | ---------- | ------------------------------------------------------------------ | --- | --- | --- | ------------ | -------- | ------------ | -------- | ------------ |
| フォーマットID       | id     | String     | フォーマットの一意識別子（UUID文字列またはプリセットの負数文字列） | ✓   | -   | ✓   | -            | -        | TEXT         | TEXT     | string       |
| フォーマット表示名   | name   | String     | フォーマット表示名（ユーザーが選択時に見る名前）                   | -   | -   | ✓   | -            | -        | TEXT         | TEXT     | string       |
| フォーマット文字列   | format | String     | 実際の日時フォーマット文字列（chrono形式）                         | -   | -   | ✓   | -            | -        | TEXT         | TEXT     | string       |
| フォーマットグループ | group  | String     | フォーマットグループ（プリセット・カスタム等の分類）               | -   | -   | ✓   | -            | -        | TEXT         | TEXT     | string       |
| 表示順序             | order  | i32        | 表示順序（昇順ソート用、UI選択肢での順番）                         | -   | -   | ✓   | 0            | -        | INTEGER      | INTEGER  | number       |

## 制約

- PRIMARY KEY: id
- NOT NULL: id, name, format, group, order

## インデックス

```sql
CREATE INDEX IF NOT EXISTS idx_datetime_formats_group ON datetime_formats(group);
CREATE INDEX IF NOT EXISTS idx_datetime_formats_order ON datetime_formats(order);
```

## 関連テーブル

- app_preset_formats: アプリケーション標準プリセット
- custom_datetime_formats: ユーザー定義カスタムフォーマット

## 備考

プリセット（負数ID）とカスタム（UUID文字列ID）を統合的に管理するビューテーブル。UI選択肢の一元化に使用。
