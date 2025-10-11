# 全般的なコーディングルール

## ファイル構成

### 基本原則
- **単一責任原則**: 1ファイル1機能
- **ファイルサイズ**: 200行超過で必須分割、100行でも分割検討

### 命名規則
- **コンポーネント**: ケバブケース（`task-item.svelte`）
- **その他**: TypeScript標準規約に準拠

## 国際化対応

- 全てのUIに関わるテキストは多言語対応を行う
- 設定画面でUI言語を選択可能で、選択後は即時反映される（リアクティブ対応でリロード不要）
- メッセージはInlang Paraglideを使用して常に国際化対応

### 使用方法
```typescript
import * as m from '$paraglide/messages';
import { reactiveMessage } from '$lib/stores/locale.svelte';
const msg_task_title = reactiveMessage(m.task_title());
```

```svelte
<h1>{$msg_task_title}</h1>
```

## 開発制約

- **開発サーバー**: `bun run dev`は使用禁止（ユーザーが使用中）
- **E2Eテスト**: 全体実行禁止、個別ファイル実行のみ
- **テストタイムアウト**: ファイル内テスト件数 × 1分