---
name: documentation
description: プロジェクトドキュメントの作成・編集を支援します。ドキュメントの追加、更新、翻訳（日本語・英語の両方）、Markdown フォーマット、ドキュメント構造の維持などに使用します。必ず日本語版と英語版の両方を同時に更新します。
model: sonnet
---

# Documentation Skill

Flequit プロジェクトのドキュメント作成・編集を支援するスキルです。

## 🚨 最重要ルール

### 必ず日本語版と英語版の両方を更新

**絶対に片方だけ更新してはいけません。**

```
✅ OK: 両方を同時に更新
docs/ja/develop/design/new-feature.md
docs/en/develop/design/new-feature.md

❌ NG: 片方だけ更新
docs/ja/develop/design/new-feature.md  ← 日本語のみ
```

### 更新手順

1. **日本語版を編集**: `docs/ja/` 配下のファイル
2. **英語版を編集**: `docs/en/` 配下の対応ファイル
3. **内容の一貫性を確認**: 両方のファイルが同じ内容を表しているか
4. **関連ドキュメントを更新**: 必要に応じて他のドキュメントも更新

## ディレクトリ構造

```
docs/
├── ja/                          # 日本語版
│   └── develop/
│       ├── design/              # 設計ドキュメント
│       ├── rules/               # 開発ルール
│       └── requirements/        # 要件定義
│
└── en/                          # 英語版
    └── develop/
        ├── design/              # Design documents
        ├── rules/               # Development rules
        └── requirements/        # Requirements
```

## 新しいドキュメントの追加

### 手順

```bash
# 1. 日本語版を作成
docs/ja/develop/design/new-feature.md

# 2. 英語版を作成（同じパス構造）
docs/en/develop/design/new-feature.md
```

### テンプレート

#### 日本語版

```markdown
# 機能名

## 概要

この機能の概要を説明します。

## 目的

なぜこの機能が必要なのか。

## 設計

### アーキテクチャ

設計の詳細。

### データフロー

データの流れ。

## 実装

実装方法の詳細。

## テスト

テスト戦略。

## 関連ドキュメント

- `docs/ja/develop/design/related.md` - 関連する設計
```

#### 英語版

```markdown
# Feature Name

## Overview

Overview of this feature.

## Purpose

Why this feature is needed.

## Design

### Architecture

Design details.

### Data Flow

Data flow details.

## Implementation

Implementation details.

## Testing

Testing strategy.

## Related Documents

- `docs/en/develop/design/related.md` - Related design
```

## 既存ドキュメントの更新

### 単一セクションの更新

```markdown
# ❌ NG: 日本語版のみ更新
docs/ja/develop/design/architecture.md
- Section A を追加
- Section B を更新

# ✅ OK: 両方を更新
docs/ja/develop/design/architecture.md
- Section A を追加
- Section B を更新

docs/en/develop/design/architecture.md
- Add Section A
- Update Section B
```

### 複数ファイルの更新

関連するドキュメントを更新する場合も、**すべて日本語版と英語版の両方を更新**します。

```
✅ 更新するファイル（例）:
docs/ja/develop/design/architecture.md
docs/en/develop/design/architecture.md
docs/ja/develop/design/data/data-model.md
docs/en/develop/design/data/data-model.md
```

## Markdown フォーマット

### 見出し

```markdown
# H1 - ドキュメントタイトル（ファイルに1つのみ）

## H2 - セクション

### H3 - サブセクション

#### H4 - 詳細セクション
```

### コードブロック

````markdown
```typescript
// TypeScript コード例
const example = 'code';
```

```rust
// Rust コード例
let example = "code";
```

```bash
# コマンド例
bun run test
```
````

### リンク

```markdown
# 相対パス（同じ言語内）
- `docs/ja/develop/design/architecture.md`
- `../rules/coding-standards.md`

# 外部リンク
- [SvelteKit](https://kit.svelte.dev/)
```

### リスト

```markdown
# 順序なしリスト
- Item 1
- Item 2
  - Sub-item 2.1
  - Sub-item 2.2

# 順序付きリスト
1. Step 1
2. Step 2
3. Step 3

# チェックリスト
- [ ] Todo item
- [x] Completed item
```

### テーブル

```markdown
| 項目 | 説明 | 備考 |
|------|------|------|
| A    | 説明A | 備考A |
| B    | 説明B | 備考B |
```

## ドキュメントの種類

### 1. 設計ドキュメント (`design/`)

システムの設計を記述

```
docs/{ja,en}/develop/design/
├── architecture.md              # アーキテクチャ全体
├── tech-stack.md                # 技術スタック
├── frontend/                    # フロントエンド設計
│   ├── svelte5-patterns.md
│   └── i18n-system.md
└── backend-tauri/               # バックエンド設計
    └── rust-guidelines.md
```

### 2. ルールドキュメント (`rules/`)

開発ルールを記述

```
docs/{ja,en}/develop/rules/
├── coding-standards.md          # コーディング標準
├── frontend.md                  # フロントエンドルール
├── backend.md                   # バックエンドルール
└── documentation.md             # ドキュメント編集ルール
```

### 3. 要件定義 (`requirements/`)

要件を記述

```
docs/{ja,en}/develop/requirements/
├── performance.md               # パフォーマンス要件
├── security.md                  # セキュリティ要件
└── testing.md                   # テスト要件
```

## 翻訳品質のガイドライン

### 機械翻訳の使用

❌ **禁止**: 機械翻訳をそのまま使用
✅ **推奨**: 機械翻訳を参考に、内容を理解して適切に翻訳

### 技術用語

一貫した用語を使用：

| 日本語 | English |
|--------|---------|
| コンポーネント | Component |
| リポジトリ | Repository |
| サービス | Service |
| ファサード | Facade |
| ストア | Store |
| テスト | Test |
| デバッグ | Debug |
| ビルド | Build |

### コード例

コード例は**そのまま**（翻訳不要）：

```typescript
// ✅ OK: コメントのみ翻訳
// タスクを取得
const tasks = await getTasks();

// ❌ NG: コード自体を翻訳
const タスク = await タスクを取得();
```

### ファイルパスとコマンド

ファイルパスとコマンドは**そのまま**：

```markdown
✅ OK:
ファイル: `src/lib/stores/task.svelte.ts`
コマンド: `bun run test`

❌ NG:
ファイル: `ソース/ライブラリ/ストア/タスク.svelte.ts`
コマンド: `バン 実行 テスト`
```

## ドキュメント更新のチェックリスト

### 新規ドキュメント作成時

- [ ] 日本語版を作成
- [ ] 英語版を作成（同じパス構造）
- [ ] 両方の内容が一貫している
- [ ] Markdown フォーマットが正しい
- [ ] 関連ドキュメントへのリンクを追加
- [ ] 目次（もしあれば）を更新

### 既存ドキュメント更新時

- [ ] 日本語版を更新
- [ ] 英語版を更新
- [ ] 両方の内容が一貫している
- [ ] リンク切れがない
- [ ] コード例が最新
- [ ] スクリーンショット（もしあれば）が最新

## よくあるミス

### 1. 片方だけ更新

```markdown
❌ NG: 日本語版のみ更新、英語版は古いまま
docs/ja/develop/design/new-feature.md  ← 最新
docs/en/develop/design/new-feature.md  ← 古い

✅ OK: 両方を同時に更新
docs/ja/develop/design/new-feature.md  ← 最新
docs/en/develop/design/new-feature.md  ← 最新
```

### 2. パス構造の不一致

```markdown
❌ NG: パスが一致していない
docs/ja/develop/design/feature-a.md
docs/en/develop/features/feature-a.md  ← パスが違う

✅ OK: 同じパス構造
docs/ja/develop/design/feature-a.md
docs/en/develop/design/feature-a.md
```

### 3. 内容の不一致

```markdown
❌ NG: 内容が異なる
# 日本語版: セクションが3つ
# 英語版: セクションが2つ

✅ OK: 内容が一致
# 日本語版: セクションが3つ
# 英語版: セクションが3つ（同じ構造）
```

## ドキュメント更新の例

### 例1: 新機能の設計ドキュメント追加

```markdown
1. 日本語版を作成
   - `docs/ja/develop/design/frontend/new-dialog-system.md`
   - 設計内容を記述

2. 英語版を作成
   - `docs/en/develop/design/frontend/new-dialog-system.md`
   - 同じ内容を英語で記述

3. 関連ドキュメントを更新
   - `docs/ja/develop/design/frontend/component-patterns.md`
   - `docs/en/develop/design/frontend/component-patterns.md`
   - 新しいダイアログシステムへのリンクを追加
```

### 例2: 既存ドキュメントのセクション追加

```markdown
1. 日本語版に新しいセクションを追加
   - `docs/ja/develop/design/architecture.md`
   - "## 新しいレイヤー構造" セクションを追加

2. 英語版にも同じセクションを追加
   - `docs/en/develop/design/architecture.md`
   - "## New Layer Structure" セクションを追加

3. 両方の内容が一貫しているか確認
```

## トラブルシューティング

### Q: 英語が得意ではない場合は？

**A**: 以下の手順で対応：

1. まず日本語版を正確に記述
2. 機械翻訳（DeepL など）で英訳
3. 技術用語や固有名詞を確認
4. コード例やパスが正しいか確認
5. 文法や表現を自然な英語に調整

### Q: 大量のドキュメントを更新する必要がある場合は？

**A**: 優先順位をつけて段階的に更新：

1. **高優先度**: 新機能に関連するドキュメント
2. **中優先度**: 変更された設計に関連するドキュメント
3. **低優先度**: 軽微な修正のみのドキュメント

### Q: ドキュメント間の矛盾を見つけた場合は？

**A**: すぐに修正：

1. 矛盾している箇所を特定
2. 正しい内容を確認（実装やテストを確認）
3. 日本語版と英語版の両方を修正
4. 関連ドキュメントも確認して必要に応じて更新

## 関連ドキュメント

詳細は以下のドキュメントを参照：
- `docs/en/develop/rules/documentation.md` - ドキュメント編集ルール
- `docs/en/develop/requirements/documents.md` - ドキュメントポリシー
