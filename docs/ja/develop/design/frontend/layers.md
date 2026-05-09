# フロントエンド レイヤーアーキテクチャ

フロントエンドは **Infrastructure 層** と **Application 層** に明確に分離する。これによりバックエンド実装 (Tauri / Web / Cloud) の切り替え、誤った直接アクセスの防止、テスタビリティ向上を実現する。

> 実装の正本は `src/lib/...` を参照。本書は責務と依存ルールのみを述べる。

## ディレクトリ構造 (概略)

```
src/lib/
├── infrastructure/backends/     # インフラ層 (直接呼び出し禁止)
│   ├── index.ts                 # BackendService 選択ロジック
│   ├── tauri/                   # Tauri 実装
│   ├── web/                     # Web 実装
│   └── (future) cloud/
└── services/                    # アプリ層 (コンポーネントから使用 OK)
    ├── domain/                  # 単一エンティティ操作
    ├── composite/               # 横断的操作
    ├── ui/                      # UI 状態管理 (廃止予定)
    └── index.ts                 # 公開 API 定義
```

実装ファイル一覧の正本は `src/lib/` のディレクトリ構造を参照。

## 各層の責務

### Stores 層 (`stores/*.svelte.ts`)

- Svelte runes (`$state` / `$derived`) によるリアクティブ状態管理
- アプリ全体のグローバル状態保持
- **状態管理のみ**。永続化・ビジネスロジックは持たない (Services 層に委譲)
- `.svelte.ts` 拡張子必須

依存ルール:

- ✅ `utils/` `types/` への参照
- ❌ `services/` (domain/ui/composite) への参照 (循環依存防止)
- ❌ `infrastructure/` への参照 (永続化は Services 経由)
- ❌ `components/` への参照
- ⚠️ 他 stores との相互参照は最小限・一方向のみ

### Infrastructure 層 (`infrastructure/backends/`)

- バックエンド通信の **実装** を提供
- Tauri / Web / Cloud 等の環境差異を吸収
- 純粋なバックエンド通信のみ。ビジネスロジックは持たない
- 環境ごとにフォルダ分け、`index.ts` で BackendService を選択

アクセス制限:

- ❌ Components 層・Stores 層からの直接呼び出し禁止
- ✅ Services 層からのみアクセス可能 (唯一のアクセス元)

依存ルール:

- ✅ `utils/` `types/` への参照
- ❌ `services/` `stores/` への参照禁止 (最下層であり上位層に依存しない)

### Application 層 - Domain Services (`services/domain/`)

- 単一エンティティに関するビジネスロジック
- Infrastructure と Store の橋渡し
- 検証ロジック・楽観的更新の実装

依存ルール:

- ✅ Components 層から呼び出し可
- ✅ Infrastructure 層を使用可
- ✅ ドメインモデル Store からデータ取得・更新可
- ❌ UI 状態 Store (selection-store 等) への参照禁止 (UI 状態は Components 層の責務)
- ✅ 他 Domain Services の使用 (一方向のみ、循環参照禁止)
- ❌ UI / Composite Services を参照しない (下位 → 上位禁止)
- ❌ Components 層への参照禁止

実装参照: `src/lib/services/domain/task/task-operations.ts`

### Application 層 - Composite Services (`services/composite/`)

- 複数エンティティの協調操作
- トランザクション的な処理
- Domain Services を組み合わせて使用

依存ルール:

- ✅ Components から呼び出し可
- ✅ Infrastructure / Domain Services / Stores を使用可
- ⚠️ 他 Composite Services は循環参照に注意
- ❌ UI Services / Components 層への参照禁止

### ⚠️ Application 層 - UI Services (`services/ui/`) は廃止予定

**新方針**:

- UI ロジック → Components 層で実装
- UI 状態管理 → Components ローカル状態 or 専用 Store (selection-store 等)
- ビジネスロジック → Domain Services 層に集中

理由: UI Services 層は責務が不明確で、UI 状態とビジネスロジックの中間層として混在化しやすい。明確な 3 層 (Components → Domain Services → Backend/Store) に整理する。

移行例: `TaskDetailService.openTaskDetail(taskId)` のような呼び出しは、Components 層内で `TaskService.getTask(taskId)` の呼び出し + `viewStore` 操作 + `selectionStore.selectTask()` に分解する。

## 依存関係マトリックス

| From → To              | Infrastructure | Domain Services | Composite Services | UI Services | Stores | Utils/Types | Components |
| ---------------------- | --- | --- | --- | --- | --- | --- | --- |
| Components             | ❌  | ✅  | ✅  | ✅  | ✅(読取のみ) | ✅ | -   |
| Stores                 | ❌  | ❌  | ❌  | ❌  | ⚠️最小限 | ✅ | ❌ |
| UI Services (廃止予定) | ✅  | ✅  | ✅  | ⚠️同位層 | ✅ | ✅ | ❌ |
| Composite Services     | ✅  | ✅  | ⚠️同位層 | ❌ | ✅ | ✅ | ❌ |
| Domain Services        | ✅  | ⚠️同位層 | ❌  | ❌ | ✅(ドメインのみ) | ✅ | ❌ |
| Utils/Types            | ❌  | ❌  | ❌  | ❌  | ❌  | -   | ❌ |
| Infrastructure         | -   | ❌  | ❌  | ❌  | ❌  | ✅  | ❌ |

凡例: ✅ 推奨 / ⚠️ 同位層は循環依存に注意 / ❌ ESLint で検出される違反

## データフロー

```
Component
    ↓ 呼び出し
Service (ビジネスロジック)
    ├→ Infrastructure (永続化: Create / Update / Delete)
    └→ Store (状態更新)
```

## 循環依存防止 (要約)

**🔴 絶対禁止**:

- `stores → services` (services が stores を参照済のため逆方向は循環)
- `stores → infrastructure` / `stores → components`
- `services → components`
- `domain → ui` / `domain → composite` (下位 → 上位禁止)
- `composite → ui` (下位 → 上位禁止)
- `infrastructure → services` / `infrastructure → stores` / `infrastructure → components`
- `utils/types → 他層`

**🟡 Svelte 5 特有の許容**:

- `services → stores`: Svelte runes の制約 (`$state` は `.svelte.ts` でのみ動作) のため許容。**逆方向の依存が存在しないこと** が条件。
- `components → stores`: 読み取りのみ。Store のメソッド呼び出しは禁止。

**🟢 推奨パターン**:

- `components → services → infrastructure` (永続化)
- `components → services → stores` (状態更新)
- `components → stores` (読み取り)
- `services (composite → domain)` (階層順守)

## ESLint による強制

循環依存と層違反は ESLint の `no-restricted-imports` ルールで自動検出される。設定の正本は `eslint.config.ts` を参照。

主要な禁止パターン:

- Stores 層 → `$lib/services/...` / `$lib/infrastructure/...` / `$lib/components/...`
- Domain Services → `$lib/services/ui/...` / `$lib/services/composite/...`
- Composite Services → `$lib/services/ui/...`
- Utils/Types 層 → `$lib/{stores,services,infrastructure}/...`
- Infrastructure 層 → `$lib/{services,stores}/...`
- Services 層 → `$lib/components/...`

実行: `bun run lint` で全層の違反を検出。

## 公開 API 管理

`src/lib/services/index.ts` で Domain / Composite / UI Services を再 export し、`infrastructure/` は外部に公開しない。これにより、コンポーネントから Infrastructure を import できないことが TypeScript レベルでも保証される (`tsconfig.json` の `paths` 設定と組み合わせ)。

## Components 層と Store の関係

### Store からの読み取り

✅ Components 層から直接読み取り OK (例: `taskStore.tasks`, `taskStore.selectedTask`)。

### Store のメソッド呼び出し

❌ Components 層から Store のメソッド呼び出しは禁止
✅ 必ず Services を経由する (`TaskService.updateTask(...)`)

理由:

- Store の更新ロジックにビジネスルール・検証が必要な場合、Services 層で集中管理
- 将来の変更に対応しやすい
- テスタビリティ向上 (Services のモックが容易)

注意: Store のメソッド呼び出しと値の読み取りは ESLint で区別できないため、コードレビューで確認する。

## 新しいバックエンドの追加方法

新規バックエンド (例: Firebase) を追加する場合:

1. `infrastructure/backends/firebase/` フォルダを作成
2. `BackendService` インターフェースを実装
3. `infrastructure/backends/index.ts` の選択ロジックに追加

→ **Services 層は一切変更不要**。

## まとめ: 設計原則

1. **明確な 3 層**: Components / Services / (Infrastructure & Stores)
2. **責務分離**: 各層は自分の役割のみを担当
3. **Domain Services と UI 状態の分離**: Domain Services は UI 状態 Store を参照しない (Components 層の責務)
4. **Infrastructure へのアクセスは Services 経由のみ**
5. **Stores は状態管理のみ** (Services / Infrastructure / Components を参照しない)
6. **Services が Infrastructure とドメインモデル Store を操作** (UI 状態 Store は操作しない)
7. **Services 階層順守 (Composite → Domain)**: UI Services は廃止予定
8. **Utils/Types は他層に依存しない** (純粋関数・型定義のみ)

## 関連ドキュメント

- [Store & Service アーキテクチャ](./store-and-service-architecture.md)
- [バックエンドコマンド実装](./backend-commands.md)
- [Svelte 5 パターン](./svelte5-patterns.md)
- [全体アーキテクチャ](../architecture.md)
