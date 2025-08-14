# Sea-ORM自動マイグレーションの制限事項

## 1. インデックス制限

### ✅ 自動生成される
- `#[sea_orm(primary_key)]` → PRIMARY KEY
- `#[sea_orm(unique)]` → UNIQUE制約
- `#[sea_orm(indexed)]` → 単一カラムINDEX（基本的なもの）

### ❌ 自動生成されない
- **複合インデックス**: 複数カラムにまたがるINDEX
- **部分インデックス**: WHERE条件付きINDEX  
- **関数インデックス**: 計算結果に対するINDEX
- **カスタムインデックス名**: 特定の命名パターン

```rust
// ❌ これは自動生成されない
CREATE INDEX idx_accounts_provider_provider_id ON accounts(provider, provider_id);
CREATE INDEX idx_tasks_due_date_not_completed ON tasks(due_date) WHERE is_completed = false;
```

## 2. 制約関連の制限

### ✅ 自動生成される
- PRIMARY KEY制約
- UNIQUE制約
- NOT NULL制約
- 基本的なFOREIGN KEY制約

### ❌ 自動生成されない
- **CHECK制約**: 値の範囲チェック
- **複雑なFOREIGN KEY**: CASCADE、SET NULLなどの詳細オプション
- **カスタム制約名**: 特定の命名パターン

```sql
-- ❌ これらは自動生成されない
ALTER TABLE tasks ADD CONSTRAINT chk_priority CHECK (priority BETWEEN 1 AND 5);
FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
```

## 3. データ型の制限

### ✅ 対応済み
- 基本的なSQL型（INTEGER, TEXT, REAL, BLOB等）
- Date/DateTime型
- JSON型（一部のDB）

### ❌ 制限あり
- **カスタムデータ型**: ENUM型など（PostgreSQL）
- **精度指定**: DECIMAL(10,2)などの詳細指定
- **DB固有型**: 各データベース特有の型

## 4. テーブル作成オプション

### ❌ 自動生成されない
- **テーブル作成オプション**: ENGINE、CHARSET等
- **パーティション**: テーブルパーティション設定
- **ストレージオプション**: 圧縮、暗号化等

```sql
-- ❌ これらは自動生成されない
CREATE TABLE tasks (...) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE logs (...) PARTITION BY RANGE (YEAR(created_at));
```

## 5. 初期データ・シード

### ❌ 自動生成されない
- **初期データ挿入**: デフォルトレコードの作成
- **マスターデータ**: 参照テーブルの初期化

```sql
-- ❌ これらは手動で対応が必要
INSERT INTO settings (id, theme, language) VALUES ('default', 'system', 'ja');
```

## 6. データベース固有機能

### ❌ 自動生成されない
- **トリガー**: BEFORE/AFTER トリガー
- **ストアドプロシージャ**: カスタム関数
- **ビュー**: 複雑なクエリのビュー化
- **全文検索インデックス**: FTS設定

## 7. マイグレーション管理

### ❌ 制限あり
- **バージョン管理**: 段階的なスキーマ変更
- **ロールバック**: 以前のバージョンへの戻し
- **データマイグレーション**: スキーマ変更に伴うデータ変換