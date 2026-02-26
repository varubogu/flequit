# フロントエンド レイヤーアーキテクチャ

## 概要

フロントエンドは**Infrastructure層**と**Application層**に明確に分離されています。
この分離により、以下を実現します：

- バックエンド実装（Tauri/Web/Cloud等）の切り替えが容易
- コンポーネントからの誤った直接アクセスを防止
- 新しいバックエンドの追加が簡単
- テスタビリティの向上

## ディレクトリ構造

```
src/lib/
├── infrastructure/              ← インフラ層（直接呼び出し禁止）
│   └── backends/
│       ├── index.ts            (BackendService選択ロジック)
│       ├── tauri/              (Tauri実装)
│       │   ├── project.ts
│       │   ├── task.ts
│       │   ├── subtask.ts
│       │   └── ...
│       ├── web/                (Web/Supabase実装)
│       │   ├── project.ts
│       │   ├── task.ts
│       │   └── ...
│       └── (future) cloud/     (将来: クラウド同期実装など)
│
└── services/                    ← アプリケーション層（コンポーネントから使用OK）
    ├── domain/                 (単一エンティティ操作)
    │   ├── project.ts
    │   ├── tasklist.ts
    │   ├── task.ts
    │   ├── subtask.ts
    │   ├── tag.ts
    │   └── settings.ts
    │
    ├── composite/              (横断的操作)
    │   ├── project-composite.ts
    │   ├── task-composite.ts
    │   └── recurrence-composite.ts
    │
    ├── ui/                     (UI状態管理のみ)
    │   ├── task-detail.ts
    │   ├── view.ts
    │   └── layout.ts
    │
    └── index.ts                (公開API定義)
```

## 各層の責務

### Stores層 (`stores/*.svelte.ts`)

**責務**:

- Svelteのrunes（`$state`, `$derived`）を使用したリアクティブ状態管理
- アプリケーション全体のグローバル状態保持
- UIの表示に必要なデータの計算・提供
- **状態管理のみに集中**（永続化はServices層に委譲）

**特徴**:

- `.svelte.ts`拡張子（Svelte runesを使用するため必須）
- 永続化・ビジネスロジックは持たない（すべてservicesに委譲）
- 純粋なリアクティブな状態保持のみ

**依存ルール**:

- ✅ **utils/types を参照OK**
  - 例: 日付フォーマット関数、型定義
- ❌ **services (domain/ui/composite) を参照禁止**
  - 理由: 循環依存を防ぐため（servicesがstoresを参照している）
- ❌ **infrastructure を参照禁止**
  - 理由: Stores層は状態管理のみを担当、永続化はServices層経由で行う
- ❌ **components への参照禁止**
  - 理由: Stores層は状態管理のみを担当、UIコンポーネントに依存してはいけない
- ❌ **他のstoresへの相互参照は最小限**
  - 必要な場合は依存方向を明確化（一方向のみ）

**例**:

```typescript
// stores/tasks.svelte.ts
class TaskStore {
  tasks = $state<Task[]>([]);
  selectedTaskId = $state<string | null>(null);

  // ✅ 状態の更新メソッド（Services層から呼ばれる）
  addTask(task: Task) {
    this.tasks.push(task);
  }

  updateTask(taskId: string, updates: Partial<Task>) {
    const index = this.tasks.findIndex((t) => t.id === taskId);
    if (index !== -1) {
      this.tasks[index] = { ...this.tasks[index], ...updates };
    }
  }

  selectTask(taskId: string) {
    this.selectedTaskId = taskId;
  }
}

export const taskStore = new TaskStore();
```

---

### Infrastructure層 (`infrastructure/backends/`)

**責務**:

- バックエンド通信の**実装**を提供
- Tauri/Web/Cloud等の環境差異を吸収
- データの永続化・取得
- 純粋なバックエンド通信のみを担当（ビジネスロジックは持たない）

**特徴**:

- インターフェース定義 + 実装
- 環境ごとにフォルダ分け（`tauri/`, `web/`, `cloud/`等）
- `index.ts` で環境に応じたBackendServiceを選択

**アクセス制限**:

- ❌ **Components層から直接呼び出し禁止**
- ❌ **Stores層から直接呼び出し禁止**
- ✅ **Services層から直接呼び出しOK**（唯一のアクセス元）

**依存ルール**:

- ❌ **Services への参照禁止**
  - 理由: Infrastructure層は最下層であり、上位層に依存してはいけない
- ❌ **Stores への参照禁止**
  - 理由: Infrastructure層は純粋なバックエンド通信のみを担当
- ✅ **Utils/Types への参照OK**
  - 例: 型定義、変換関数

---

### Application層 - Domain Services (`services/domain/`)

**責務**:

- 単一エンティティに関するビジネスロジック
- InfrastructureとStoreの橋渡し
- 複雑な操作や検証ロジックの実装

**パターン**:

```typescript
// services/domain/task.ts
import { taskStore } from '$lib/stores/tasks.svelte';
import { getBackendService } from '$lib/infrastructure/backends';

export class TaskService {
  static async updateTask(taskId: string, updates: Partial<Task>) {
    // 1. ビジネスロジック（例: バリデーション）
    if (!updates.title || updates.title.trim() === '') {
      throw new Error('タイトルは必須です');
    }

    // 2. Infrastructure層で永続化
    const backend = await getBackendService();
    const updatedTask = await backend.task.update(projectId, taskId, updates);

    // 3. Store層で状態更新
    taskStore.updateTask(taskId, updatedTask);

    return updatedTask;
  }
}
```

**依存ルール**:

- ✅ **Components層から呼び出しOK**
- ✅ **Infrastructure層を使用OK**
  - 理由: Services層がInfrastructureとStoreの橋渡し役
  - 例: `backend.task.update()`, `backend.project.create()`
- ✅ **Storesからデータ取得・更新OK (ドメインモデルのStoreのみ)**
  - 理由: Svelte runesは`.svelte.ts`でのみ動作、状態はstoresに集中
  - 例: `taskStore.tasks`, `taskStore.updateTask()`
  - ⚠️ **注意**: ドメインモデル(task, project等)のStoreのみ。UI状態Store(selection-store等)は参照しない
- ❌ **UI状態ストア(selection-store等)への参照禁止**
  - 理由: Domain層はビジネスロジックのみを担当、UI状態に依存してはいけない
  - 例: `selectionStore.selectTask()` などは呼び出さない
  - UI状態の更新はComponents層で行う
- ✅ **他のDomain Servicesを使用OK**
  - 例: TaskServiceからRecurrenceServiceを呼び出す
  - 注意: 循環参照にならないよう一方向のみ
- ✅ **Utils/Types を参照OK**
  - 例: 日付計算、バリデーション関数
- ❌ **UI/Composite Services を参照禁止**
  - 理由: 下位層から上位層への依存は禁止
- ❌ **Components層への参照禁止**
  - 理由: Services層はビジネスロジックのみを担当、UIコンポーネントに依存してはいけない

**注意事項**:

- Services層がInfrastructureとStoreの両方を操作することで、責務が明確になる
- ビジネスロジックがない場合でも、StoreとInfrastructureの橋渡しとして機能する
- **重要**: Domain ServicesはドメインモデルのStoreのみ操作し、UI状態Storeには依存しない
- UI状態の管理はComponents層の責務である

---

### Application層 - Composite Services (`services/composite/`)

**責務**:

- 複数エンティティの協調操作
- トランザクション的な処理
- Domain Servicesを組み合わせて使用

**例**:

```typescript
// services/composite/task-composite.ts
import { TaskService } from '$lib/services/domain/task';
import { SubTaskService } from '$lib/services/domain/subtask';

export class TaskCompositeService {
  /**
   * タスクとサブタスクを一括作成
   */
  static async createTaskWithSubTasks(listId: string, task: Task, subTasks: SubTask[]) {
    // Domain Servicesを組み合わせて使用
    const createdTask = await TaskService.createTask(listId, task);

    for (const subTask of subTasks) {
      await SubTaskService.createSubTask(createdTask.id, subTask);
    }

    return createdTask;
  }
}
```

**依存ルール**:

- ✅ **Components層から呼び出しOK**
- ✅ **Infrastructure層を使用OK**
  - 理由: Services層がInfrastructureとStoreの橋渡し役
- ✅ **Domain Servicesを使用OK**
- ✅ **他のComposite Servicesを使用OK**（慎重に、循環参照注意）
- ✅ **Storesからデータ取得・更新OK**
- ✅ **Utils/Types を参照OK**
- ❌ **UI Services を参照禁止**
  - 理由: 下位層から上位層への依存は禁止
- ❌ **Components層への参照禁止**
  - 理由: Services層はビジネスロジックのみを担当、UIコンポーネントに依存してはいけない

---

### ⚠️ 廃止予定: Application層 - UI Services (`services/ui/`)

**重要**: UI Services層は**廃止予定**です。以下の設計方針に従ってください:

**新しい設計方針**:

- **UIロジック**: Components層で実装する
- **UI状態管理**: Components層のローカル状態、または専用Store(selection-store等)で管理
- **ビジネスロジック**: Domain Services層に集中

**理由**:
UI Services層は責務が不明確で、実際にはUI状態管理とビジネスロジックの中間層として機能していました。
明確な3層アーキテクチャ (Components → Domain Services → Backend/Store) により、各層の責務が明確になります。

**移行方法**:

```typescript
// ❌ 旧: UI Services経由
TaskDetailService.openTaskDetail(taskId); // UI状態 + ビジネスロジック混在

// ✅ 新: Components層で直接管理
// Components層 (*.svelte)
async function openTaskDetail(taskId: string) {
  // 1. ビジネスロジック: Domain Serviceを呼び出し
  await TaskService.getTask(taskId);

  // 2. UIロジック: Components層で判断・実行
  if (viewStore.isMobile) {
    viewStore.openDrawer('task-detail');
  }

  // 3. UI状態: selection-store等で管理
  selectionStore.selectTask(taskId);
}
```

**重要な原則**:

- ❌ **Domain ServicesからUI状態ストア(selection-store等)を参照しない**
  - 理由: Domain層はビジネスロジックのみを担当、UI状態に依存すべきではない
- ✅ **Components層がUI状態とビジネスロジックを協調**
  - Components層がDomain Servicesを呼び出し、結果に基づいてUI状態を更新

## レイヤー間の依存関係

```
┌─────────────────────────────────────────────┐
│ Components Layer (Svelte)                   │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ 📌 責務: UIロジック + UI状態管理            │
│ ✅ stores/* から値の読み取り                │
│ ✅ domain services/* の呼び出し             │
│ ✅ selection-store等のUI状態ストアを操作    │
│ ❌ infrastructure/* から import 禁止         │
│ ❌ stores/* (ドメインモデル) の直接更新禁止  │
└─────────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────┐
│ Services Layer (ビジネスロジック + 橋渡し)  │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ ├─ composite/   (横断操作)                  │
│ └─ domain/      (単一エンティティ)          │
│                                             │
│ 📌 責務: ビジネスロジックのみ               │
│ ✅ Infrastructure への参照OK（永続化）      │
│ ✅ ドメインモデルStores への参照OK          │
│ ❌ UI状態ストア(selection-store等)参照禁止  │
│ ❌ Components層への参照禁止                 │
└─────────────────────────────────────────────┘
         ↙                     ↘
┌──────────────────┐    ┌──────────────────┐
│ Infrastructure   │    │ Stores Layer     │
│ ━━━━━━━━━━━━━━━ │    │ ━━━━━━━━━━━━━━━ │
│ backends/        │    │ ドメインモデル:  │
│ ├─ tauri/        │    │ ├─ tasks         │
│ ├─ web/          │    │ ├─ tags          │
│ └─ cloud/        │    │ └─ settings      │
│                  │    │ UI状態:          │
│ 📌 外部通信のみ  │    │ └─ selection     │
│ ❌ Stores参照禁止│    │                  │
│                  │    │ 📌 状態保持のみ  │
│                  │    │ ❌ Infra参照禁止 │
└──────────────────┘    └──────────────────┘
         ↓                     ↓
┌─────────────────────────────────────────────┐
│ Utils/Types Layer (全層から利用可能)        │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ ├─ utils/       (純粋関数)                  │
│ └─ types/       (型定義)                    │
│                                             │
│ 📌 純粋関数・型定義のみ                     │
│ ❌ stores/services/infrastructure 参照禁止  │
└─────────────────────────────────────────────┘
```

### 詳細な依存ルール

| From → To              | Infrastructure | Domain Services | Composite Services | UI Services   | Stores      | Utils/Types | Components |
| ---------------------- | -------------- | --------------- | ------------------ | ------------- | ----------- | ----------- | ---------- |
| **Components**         | ❌ 禁止        | ✅ 呼び出しOK   | ✅ 呼び出しOK      | ✅ 呼び出しOK | ✅ 読取のみ | ✅ OK       | -          |
| **Stores**             | ❌ 禁止        | ❌ 禁止         | ❌ 禁止            | ❌ 禁止       | ⚠️ 最小限   | ✅ OK       | ❌ 禁止    |
| **UI Services**        | ✅ OK          | ✅ OK           | ✅ OK              | ⚠️ 同位層注意 | ✅ OK       | ✅ OK       | ❌ 禁止    |
| **Composite Services** | ✅ OK          | ✅ OK           | ⚠️ 同位層注意      | ❌ 禁止       | ✅ OK       | ✅ OK       | ❌ 禁止    |
| **Domain Services**    | ✅ OK          | ⚠️ 同位層注意   | ❌ 禁止            | ❌ 禁止       | ✅ OK       | ✅ OK       | ❌ 禁止    |
| **Utils/Types**        | ❌ 禁止        | ❌ 禁止         | ❌ 禁止            | ❌ 禁止       | ❌ 禁止     | -           | ❌ 禁止    |
| **Infrastructure**     | -              | ❌ 禁止         | ❌ 禁止            | ❌ 禁止       | ❌ 禁止     | ✅ OK       | ❌ 禁止    |

#### 凡例

- ✅ OK: 推奨される依存関係
- ⚠️ 注意: 許容されるが慎重に（循環依存に注意）
- ❌ 禁止: ESLintで検出される違反

### 循環依存防止ルール

**🔴 絶対禁止（循環依存・責務分離）**:

- ❌ `stores` → `services (domain/ui/composite)`
  - 理由: servicesがstoresを参照しているため、逆方向は循環依存になる
- ❌ `stores` → `infrastructure`
  - 理由: Stores層は状態管理のみを担当、永続化はServices層に委譲
- ❌ `stores` → `components`
  - 理由: Stores層は状態管理のみを担当、UIコンポーネントに依存してはいけない
- ❌ `services (domain/ui/composite)` → `components`
  - 理由: Services層はビジネスロジックのみを担当、UIコンポーネントに依存してはいけない
- ❌ `domain services` → `ui services`
  - 理由: 下位層から上位層への依存は禁止
- ❌ `domain services` → `composite services`
  - 理由: 下位層から上位層への依存は禁止
- ❌ `composite services` → `ui services`
  - 理由: 下位層から上位層への依存は禁止
- ❌ `infrastructure` → `services`
  - 理由: Infrastructure層は最下層であり、上位層に依存してはいけない
- ❌ `infrastructure` → `stores`
  - 理由: Infrastructure層は純粋なバックエンド通信のみを担当
- ❌ `infrastructure` → `components`
  - 理由: Infrastructure層は純粋なバックエンド通信のみを担当
- ❌ `utils/types` → `stores/services/infrastructure/components`
  - 理由: 純粋な関数・型定義層は他層に依存してはいけない

**🟡 Svelte 5特有の許容パターン**:

- ✅ `services (domain/ui/composite)` → `stores` (Svelte runesの制約上許容)
  - 理由: `$state`は`.svelte.ts`でのみ動作するため、状態はstoresに集中
  - 条件: **逆方向の依存（stores → services）が存在しないこと**
- ✅ `components` → `stores` (読み取りのみ)
  - 理由: UIコンポーネントは状態を表示する必要がある
  - 制限: **Storeのメソッド呼び出しは禁止、値の読み取りのみ**

**⚠️ 注意が必要なパターン**:

- ⚠️ `stores` 間の相互参照
  - 許容: 明確な依存方向がある場合（例: `task-store` → `project-store`）
  - 禁止: 相互に参照し合う場合（循環依存）
- ⚠️ 同位層の `services` 間の参照
  - 許容: 依存が一方向のみの場合
  - 禁止: 相互に参照し合う場合（循環依存）

**🟢 推奨パターン（明確な責務分離）**:

- ✅ `components` → `services` → `infrastructure` (永続化)
- ✅ `components` → `services` → `stores` (状態更新)
- ✅ `components` → `stores` (読み取りのみ)
- ✅ `services (ui → composite → domain)` (階層順守)

**データフロー**:

```
Component
    ↓ 呼び出し
Service (ビジネスロジック)
    ├→ Infrastructure (永続化: Create/Update/Delete)
    └→ Store (状態更新)
```

## 循環依存チェック（ESLint）

循環依存は**ESLintで自動検出**されます。`eslint.config.ts`に以下のルールが設定されています：

### ESLint設定

```typescript
// eslint.config.ts

// 1. Stores層からServices/Infrastructureへの参照を禁止（責務分離）
{
  files: ['src/lib/stores/**/*.{ts,svelte.ts}'],
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['$lib/services/domain/**', '**/services/domain/**'],
            message: '❌ Stores層からDomain Servicesへの参照は禁止です（循環依存）。'
          },
          {
            group: ['$lib/services/ui/**', '**/services/ui/**'],
            message: '❌ Stores層からUI Servicesへの参照は禁止です（循環依存）。'
          },
          {
            group: ['$lib/services/composite/**', '**/services/composite/**'],
            message: '❌ Stores層からComposite Servicesへの参照は禁止です（循環依存）。'
          },
          {
            group: ['$lib/infrastructure/**', '**/infrastructure/**'],
            message: '❌ Stores層からInfrastructure層への参照は禁止です。Stores層は状態管理のみを担当します。Services層を経由してください。'
          }
        ]
      }
    ]
  }
},

// 2. Domain ServicesからUI/Composite Servicesへの参照を禁止
{
  files: ['src/lib/services/domain/**/*.ts'],
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['$lib/services/ui/**', '**/services/ui/**'],
            message: '❌ Domain ServicesからUI Servicesへの参照は禁止です（下位層→上位層）。'
          },
          {
            group: ['$lib/services/composite/**', '**/services/composite/**'],
            message: '❌ Domain ServicesからComposite Servicesへの参照は禁止です（下位層→上位層）。'
          }
        ]
      }
    ]
  }
},

// 3. Composite ServicesからUI Servicesへの参照を禁止
{
  files: ['src/lib/services/composite/**/*.ts'],
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['$lib/services/ui/**', '**/services/ui/**'],
            message: '❌ Composite ServicesからUI Servicesへの参照は禁止です（下位層→上位層）。'
          }
        ]
      }
    ]
  }
},

// 4. Utils/Types層からStores/Services/Infrastructureへの参照を禁止
{
  files: ['src/lib/utils/**/*.ts', 'src/lib/types/**/*.ts'],
  ignores: ['src/lib/types/bindings.ts'],
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['$lib/stores/**', '**/stores/**'],
            message: '❌ Utils/Types層からStoresへの参照は禁止です。純粋な関数・型定義のみにしてください。'
          },
          {
            group: ['$lib/services/**', '**/services/**'],
            message: '❌ Utils/Types層からServicesへの参照は禁止です。純粋な関数・型定義のみにしてください。'
          },
          {
            group: ['$lib/infrastructure/**', '**/infrastructure/**'],
            message: '❌ Utils/Types層からInfrastructureへの参照は禁止です。純粋な関数・型定義のみにしてください。'
          }
        ]
      }
    ]
  }
},

// 5. Infrastructure層からServices/Storesへの参照を禁止
{
  files: ['src/lib/infrastructure/**/*.ts'],
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['$lib/services/**', '**/services/**'],
            message: '❌ Infrastructure層からServicesへの参照は禁止です。Infrastructure層はStores層からのみ利用されます。'
          },
          {
            group: ['$lib/stores/**', '**/stores/**'],
            message: '❌ Infrastructure層からStoresへの参照は禁止です。Infrastructure層は純粋なバックエンド通信のみを担当します。'
          }
        ]
      }
    ]
  }
},

// 6. Services層からComponents層への参照を禁止
{
  files: ['src/lib/services/**/*.{ts,svelte.ts}'],
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['$lib/components/**', '**/components/**'],
            message: '❌ Services層からComponents層への参照は禁止です。Services層はビジネスロジックのみを担当します。'
          }
        ]
      }
    ]
  }
},

// 7. Stores層からComponents層への参照を禁止
{
  files: ['src/lib/stores/**/*.{ts,svelte.ts}'],
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['$lib/components/**', '**/components/**'],
            message: '❌ Stores層からComponents層への参照は禁止です。Stores層は状態管理のみを担当します。'
          }
        ]
      }
    ]
  }
}
```

### 実行方法

```bash
# Lintチェック（循環依存も自動検出）
bun run lint

# 開発中の自動チェック
bun run dev  # ESLint統合されたエディタで自動表示
```

### エラー例

```bash
# 1. stores → services の違反例
src/lib/stores/tasks.svelte.ts
  2:1  error  '$lib/services/domain/task' import is restricted from being used by a pattern.
              ❌ Stores層からDomain Servicesへの参照は禁止です（循環依存）。

# 1-2. stores → infrastructure の違反例（新ルール）
src/lib/stores/tasks.svelte.ts
  3:1  error  '$lib/infrastructure/backends' import is restricted from being used by a pattern.
              ❌ Stores層からInfrastructure層への参照は禁止です。Stores層は状態管理のみを担当します。Services層を経由してください。

# 2. domain services → ui services の違反例
src/lib/services/domain/task.ts
  3:1  error  '$lib/services/ui/task-detail' import is restricted from being used by a pattern.
              ❌ Domain ServicesからUI Servicesへの参照は禁止です（下位層→上位層）。

# 3. composite services → ui services の違反例
src/lib/services/composite/task-composite.ts
  4:1  error  '$lib/services/ui/layout' import is restricted from being used by a pattern.
              ❌ Composite ServicesからUI Servicesへの参照は禁止です（下位層→上位層）。

# 4. utils → services の違反例
src/lib/utils/date-utils.ts
  2:1  error  '$lib/services/domain/settings' import is restricted from being used by a pattern.
              ❌ Utils/Types層からServicesへの参照は禁止です。純粋な関数・型定義のみにしてください。

# 5. infrastructure → services の違反例
src/lib/infrastructure/backends/tauri/project.ts
  3:1  error  '$lib/services/domain/project' import is restricted from being used by a pattern.
              ❌ Infrastructure層からServicesへの参照は禁止です。Infrastructure層はStores層からのみ利用されます。

# 6. infrastructure → stores の違反例
src/lib/infrastructure/backends/tauri/task.ts
  4:1  error  '$lib/stores/tasks.svelte' import is restricted from being used by a pattern.
              ❌ Infrastructure層からStoresへの参照は禁止です。Infrastructure層は純粋なバックエンド通信のみを担当します。

# 7. services → components の違反例
src/lib/services/domain/task.ts
  5:1  error  '$lib/components/task/TaskDetail.svelte' import is restricted from being used by a pattern.
              ❌ Services層からComponents層への参照は禁止です。Services層はビジネスロジックのみを担当します。

# 8. stores → components の違反例
src/lib/stores/tasks.svelte.ts
  6:1  error  '$lib/components/task/TaskList.svelte' import is restricted from being used by a pattern.
              ❌ Stores層からComponents層への参照は禁止です。Stores層は状態管理のみを担当します。
```

### CI/CDへの組み込み

```json
// package.json
{
  "scripts": {
    "lint": "eslint .",
    "precommit": "bun run lint && bun check",
    "ci": "bun run lint && bun run test && bun check"
  }
}
```

---

## 技術的強制策

### 1. ESLintルール

```javascript
// .eslintrc.cjs
module.exports = {
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['**/infrastructure/**'],
            message: '❌ Infrastructure層への直接アクセスは禁止です。services/を使用してください。'
          }
        ]
      }
    ]
  }
};
```

### 2. 公開API管理 (`services/index.ts`)

```typescript
// src/lib/services/index.ts

// ✅ Domain Services (公開)
export * from './domain/project.service';
export * from './domain/task.service';
export * from './domain/subtask.service';
export * from './domain/tag.service';
export * from './domain/settings.service';

// ✅ Composite Services (公開)
export * from './composite/project-composite.service';
export * from './composite/task-composite.service';
export * from './composite/recurrence-composite.service';

// ✅ UI Services (公開)
export * from './ui/task-detail.service';
export * from './ui/view.service';
export * from './ui/layout.service';

// ❌ infrastructure は export しない（外部から使えない）
```

### 3. TypeScript paths設定

```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "$lib/services": ["./src/lib/services/index.ts"],
      "$lib/services/*": ["./src/lib/services/*"]
    }
  }
}
```

## コンポーネントからの使い方

### ✅ 正しい使い方

```typescript
// src/lib/components/task/TaskList.svelte
<script lang="ts">
  import { TaskService } from '$lib/services';

  async function handleUpdate(taskId: string, updates: Partial<Task>) {
    await TaskService.updateTask(taskId, updates);
  }
</script>
```

### ❌ 間違った使い方

```typescript
// ❌ NG: Infrastructure層への直接アクセス
import { TauriBackend } from '$lib/infrastructure/backends/tauri';

// ESLintエラー: Infrastructure層への直接アクセスは禁止です
```

## 新しいバックエンドの追加方法

新しいバックエンド（例: Firebase）を追加する場合:

```
1. infrastructure/backends/firebase/ フォルダを作成
2. BackendServiceインターフェースを実装
3. infrastructure/backends/index.ts で選択ロジックに追加
```

**重要**: Services層は一切変更不要！

```typescript
// infrastructure/backends/index.ts
export async function getBackendService(): Promise<BackendService> {
  if (isFirebase) {
    return new FirebaseBackend(); // 新規追加
  } else if (isTauri) {
    return new TauriBackend();
  } else {
    return new WebBackend();
  }
}
```

## Components層とStoreの関係

Components層（`src/lib/components/`）とStore（`src/lib/stores/`）の間には厳格なルールがあります:

### Storeからの読み取り

- ✅ **Components層から直接読み取りOK**

  ```typescript
  // ✅ OK: 値の読み取り
  import { taskStore } from '$lib/stores/tasks.svelte';

  const tasks = taskStore.tasks;
  const selectedTask = taskStore.selectedTask;
  ```

### Storeのメソッド呼び出し

- ❌ **Components層からStoreのメソッド呼び出しは禁止**
- ✅ **必ずServicesを経由**

  ```typescript
  // ❌ NG: Components層から直接Storeのメソッドを呼び出し
  await taskStore.updateTask(taskId, updates);

  // ✅ OK: Servicesを経由
  import { TaskService } from '$lib/services/domain/task';
  await TaskService.updateTask(taskId, updates);
  ```

**理由**:

- Storeの更新ロジックにビジネスルールや検証が必要な場合、Services層で集中管理
- Services層を経由することで、将来の変更に対応しやすい
- テスタビリティの向上（Services層のモックが容易）

**注意**:

- Storeのメソッド呼び出しと値の読み取りはESLintで区別できないため、コードレビューで確認が必要
- 簡単な操作でもServicesを経由することで、一貫性のあるコードになる

## まとめ

### 設計原則

1. **明確な3層アーキテクチャ**
   - **Components層**: UIロジック + UI状態管理
   - **Services層**: ビジネスロジック + StoreとInfrastructureの橋渡し
   - **Infrastructure/Stores層**: 永続化とドメインモデル状態管理

2. **各層の責務**
   - **Components層**: UIロジック、UI状態(selection等)の管理、Domain Servicesの呼び出し
   - **Domain Services層**: ビジネスロジックのみ、ドメインモデルStoreとInfrastructureの橋渡し
   - **Stores層**: 状態管理のみ（ドメインモデル + UI状態を分離管理）
   - **Infrastructure層**: 外部とのやり取りのみ（バックエンド通信）

3. **重要: Domain ServicesとUI状態の分離**
   - ❌ Domain ServicesはUI状態ストア(selection-store等)を参照しない
   - ✅ Components層がDomain Servicesを呼び出し、結果に基づいてUI状態を更新
   - 理由: Domain層はビジネスロジックのみを担当、UI状態に依存すべきではない

4. **Infrastructure層はServices層からのみ利用**
   - Components層・Stores層からの直接呼び出しは禁止

5. **Stores層は状態管理のみに集中**
   - Services/Infrastructure/Componentsを参照しない
   - 永続化・ビジネスロジックはすべてServices層に委譲
   - ドメインモデルStoreとUI状態Storeを分離管理

6. **Services層がInfrastructureとドメインモデルStoreを操作**
   - Infrastructure層で永続化
   - ドメインモデルStore層で状態更新
   - UI状態Storeは操作しない（Components層の責務）

7. **Components層の責務拡大**
   - Domain Servicesのみ呼び出し、ドメインモデルStoreは読み取りのみ
   - UI状態ストアの操作はComponents層が直接行う
   - UIロジック（モバイル/デスクトップ判定等）はComponents層で実装

8. **Services層は階層構造を守る (Composite → Domain)**
   - UI Services層は廃止予定
   - Componentsを参照しない（ビジネスロジックのみ）

9. **Utils/Types層は他層に依存しない（純粋関数・型定義のみ）**

### 期待される効果

- 🎯 **保守性向上**: 責務が明確、変更箇所が限定的
- 🔒 **安全性向上**: 誤用をESLintで防止
- 🚀 **拡張性向上**: 新しいバックエンド追加が容易
- 🧪 **テスタビリティ向上**: 各層が独立してテスト可能

### 関連ドキュメント

- [バックエンドコマンド実装](./backend-commands.md)
- [Svelte 5パターン](./svelte5-patterns.md)
- [全体アーキテクチャ](../architecture.md)
