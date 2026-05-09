# 国際化 (i18n) システム設計

Flequit は **Inlang Paraglide** + 独自 `reactiveMessage` でリアルタイム言語切り替えを実現する。全 UI テキストは多言語対応し、設定画面での言語選択後は即時反映 (リロード不要)。

> 実装の正本は `src/lib/stores/locale.svelte.ts` および `project.inlang/` を参照。

## システム構成

- **Inlang Paraglide**: 翻訳管理フレームワーク
- **対応言語**: 英語 (ベース)、日本語
- **設定**: `project.inlang/settings.json`
- **メッセージ**: `project.inlang/messages/{en,ja}.json`
- **自動生成**: `bun run build` で `src/paraglide/` (Git 管理対象外) を生成
- **言語ストア**: `src/lib/stores/locale.svelte.ts`
- **リアクティブ**: 言語切替で全画面が即時更新

### ディレクトリ構造

```
project.inlang/
├── settings.json
└── messages/
    ├── en.json
    └── ja.json

src/paraglide/                # 自動生成 (Git 管理外)
├── messages/
└── runtime.ts

src/lib/stores/
├── index.ts                  # ストア集約
└── locale.svelte.ts          # 言語状態管理 + reactiveMessage
```

## 使用パターン

### 基本: メッセージ参照

1. `import * as m from '$paraglide/messages'`
2. `import { reactiveMessage } from '$lib/stores/locale.svelte'`
3. `const msg_xxx = reactiveMessage(m.xxx())` でリアクティブメッセージを作成
4. テンプレート内では `{$msg_xxx}` (Svelte ストア構文) で参照

### パラメータ付きメッセージ

`messages/{lang}.json` に `"welcome_user": "Welcome, {username}!"` のように `{name}` プレースホルダを定義し、`m.welcome_user({ username })` で渡す。複数形は ICU の `{count, plural, one {..} other {..}}` 構文を利用 (en 側のみ。ja は単一形)。

### 動的メッセージ

ステータス等で分岐する場合は `reactiveMessage(() => { switch(status) { ... } })` のように関数形式で渡す。

## ロケール管理 (`locale.svelte.ts`)

### 主要 API

- `localeStore.currentLocale`: 現在の言語タグ (`'en' | 'ja'`)
- `localeStore.availableLocales`: `availableLanguageTags`
- `localeStore.currentLocaleName`: 表示名 (`'English'` / `'日本語'`)
- `localeStore.setLocale(locale)`: 言語切替 + `localStorage` 保存 + `<html lang>` 更新
- `localeStore.loadSavedLocale()`: 起動時に `localStorage` から復元

### `reactiveMessage(fn)`

- メッセージ関数 `fn` をラップし、Svelte の `subscribe` インターフェース付きオブジェクトを返す
- 内部で `$effect` で言語変更を監視し、変更時にサブスクライバへ通知
- 初期値はサブスクライブ時に即座に送信

実装参照: `src/lib/stores/locale.svelte.ts`

## 言語切替コンポーネント

`src/lib/components/...language-selector.svelte` で `localeStore.currentLocale` をバインドした `<select>` を提供。`onchange` で `localeStore.setLocale(...)` を呼ぶ。

## テスト時の対応

### Vitest 単体テストでのモック化

`tests/vitest.setup.ts` で以下をモック化する:

- `$paraglide/messages`: 各メッセージ関数を固定文字列または `{params} => string` として返す
- `$lib/stores/locale.svelte`: `localeStore.currentLocale = 'en'`、`reactiveMessage(fn)` は `{ subscribe(cb) { cb(fn()); return () => {}; } }` を返す

これにより、コンポーネントテストで翻訳キーが固定文字列として展開される。

### コンポーネントテスト

`@testing-library/svelte` の `render` + `screen.getByText('Task Title')` で、モック化された翻訳テキストの表示を検証する。

## メッセージ管理ベストプラクティス

### キー命名規則

- `button_save`, `button_cancel`
- `label_task_title`, `placeholder_search_tasks`
- `error_network_failed`, `tooltip_add_task`
- `status_todo`, `status_in_progress`, `status_completed`

### コンポーネントレベルの集約

各コンポーネントで使用するメッセージは `const messages = { title: reactiveMessage(...), save: reactiveMessage(...), ... }` のように冒頭でまとめて定義し、テンプレートでは `{$messages.title}` のように参照する。これにより使用メッセージが一覧化され、保守性が上がる。

## パフォーマンス

- **起動時**: `loadSavedLocale()` で言語復元 (`$effect` 内で 1 回呼ぶ)
- **メッセージのプリロード**: 頻繁に使うメッセージは初期化時に `reactiveMessage` 化
- **使用頻度の低いメッセージ**: 必要時のみ `reactiveMessage` を生成

## 機械翻訳

新規キー追加時は `bun run machine-translate` で機械翻訳 → `bun run build` で型再生成の流れ。詳細は skill `i18n/SKILL.md` を参照。

## 関連

- skill: `.claude/skills/i18n/SKILL.md`
- 設定: `project.inlang/settings.json`
- 実装: `src/lib/stores/locale.svelte.ts`
