# Step 3.1: tasks ストア責務分離 作業計画

## 目的
- `tasks` 関連ストアからドメインサービス／インフラ層への依存を排除し、Svelte ストアは状態管理のみに専念させる。
- `docs/ja/develop/design/frontend/layers.md` および `eslint.config.ts` で規定された層構造ルールへの完全準拠を達成する。

## スコープ
- `TaskCoreStore` を中心としたタスク関連ストア (`tasks.svelte.ts`, `task-detail-view-store.svelte.ts` 等)。
- タスク操作を行うドメインサービス (`TaskMutations`, `TaskService`) や UI サービス (`task-interactions.ts`)。
- タスク CRUD を呼び出す主要 UI コンポーネント（プロジェクト／タスクリスト／タスク詳細など）。
- 関連ユニットテストおよびモック。

## 前提
- 現行実装ではストアが直接サービス層を呼び出しているため、段階的な責務移譲が必要。
- 変更範囲が広いため、段階的に反映し、各ステップでテストを実行する。

## タスク一覧

### 1. 依存関係調査とドキュメント更新
- [x] `taskCoreStore` とその呼び出し元を列挙し、サービス層に移管すべき操作を明確化。
- [x] 調査結果を本計画書に追記（参照箇所一覧・移行対象分類）。
- [x] `layers.md` に従った目標状態を明文化（最低限変更したい API の一覧）。

### 2. ドメインサービス再設計
- [x] `TaskMutations` をローカル状態操作と永続化同期に責務分離し、明示的な依存注入に変更。
- [x] ストアがサービスへ公開する純粋 API（`applyTaskUpdate` / `insertTask` / `removeTask` / `moveTaskBetweenLists` など）を定義。
- [x] 上記 API を `TaskCoreStore` に実装し、サービス側でロールバック制御を行う仕組みを追加。

### 3. 呼び出し側の段階的移行
- [ ] 代表的な UI フロー（タスク追加・削除・移動・期日変更）について、サービス呼び出しに置き換え。
- [ ] 残りのタスク操作を順次置き換え（モーダル／ドラッグ＆ドロップ／タスク詳細など）。
- [ ] 置き換え完了後、ストアからサービス層の import が存在しないことを確認。

### 4. テスト調整
- [ ] 新しい責務分離構成に合わせてモックを更新し、`TaskMutations` 等をモック対象に変更。
- [ ] ストアユニットテスト／サービスユニットテストを整理し、回帰を防止。
- [ ] `bun run test`（必要に応じて `bun run test -- <target>`）で段階ごとに検証。

### 5. 文書・Lint 反映
- [ ] 作業後の構造変更を `layers.md` または適切な設計ドキュメントへ反映。
- [ ] ESLint ルール（必要な場合）を確認／更新し、責務分離を強制。

## 次のアクション
1. タスク 1（依存関係調査）を着手し、本計画書に結果を追記。
2. その後、タスク 2 以降を順次進め、各ステップでテストを実行。

## 依存関係調査結果（2025-10-14）

### A. Stores → Services 依存（移行対象）
| ファイル | メソッド/処理 | 現状の外部依存 | 備考 |
| --- | --- | --- | --- |
| `src/lib/stores/task-core-store.svelte.ts` | `updateTask`, `toggleTaskStatus` | `TaskService.updateTaskWithSubTasks` を直接呼び出し | 状態更新と永続化が一体化しているためサービス層へ移管予定 |
| 同上 | `addTask` | `TaskService.createTaskWithSubTasks` を直接呼び出し | 失敗時ローカルロールバックを実施中。ロールバック責務をサービスに移す |
| 同上 | `moveTaskToList` | `TaskService.updateTask` を直接呼び出し | UI からも直接参照されており副作用が分散 |
| 同上 | `deleteTask` | `TaskService.deleteTaskWithSubTasks` を直接呼び出し | 失敗時復元処理あり。サービス移行後も保持が必要 |
| `src/lib/stores/tasks.svelte.ts` | `TaskInteractionsService` の初期化 | `TaskInteractionsService` 内で `taskCoreStore.addTask` を使用 | UI からのタスク作成がストア直結になっている |
| `src/lib/services/ui/task/task-interactions.ts` | `saveNewTask` | `taskCoreStore.addTask` を await し永続化 | 本来はドメインサービスを介すべき |
| `src/lib/services/domain/task/task-mutations.ts` | `toggleTaskStatus` 他 | `taskCoreStore` の CRUD API を直接呼び出し | サービス層の再設計でローカル更新と永続化を集約する |
| `src/lib/stores/task-detail-view-store.svelte.ts` | `handleProjectTaskListChange` | `taskCoreStore.moveTaskToList` を直接呼び出し | 詳細画面での移動操作がストア直結 |
| `src/lib/stores/task-detail/task-edit-form-store.svelte.ts` | `queueSave` 内 | `taskCoreStore.updateTask` を直接呼び出し | フォーム自動保存がストア経由で永続化 |
| `src/lib/services/domain/subtask/subtask-mutations.ts` | `updateSubTask` 後処理 | `taskCoreStore.updateTask` を呼び出し | サブタスク更新時の親タスク更新がストア依存 |
| `src/lib/services/domain/task-recurrence.ts` | `scheduleNextOccurrence` | `taskCoreStore.createRecurringTask` を呼び出し | 将来的に TaskMutations に委譲予定 |

### B. Store API を直接叩いている主要エントリポイント
| 区分 | 呼び出し元 | 使用 API | 主目的 |
| --- | --- | --- | --- |
| UI コンポーネント | `project-list.svelte` | `taskCoreStore.moveTaskToList` | プロジェクトへのドロップ操作 |
| UI コンポーネント | `task-list-display.svelte` | `taskCoreStore.moveTaskToList` | タスク一覧でのドラッグ＆ドロップ移動 |
| UI コンポーネント | `task-date-picker.svelte` | `taskCoreStore.updateTask` | 期日変更・クリア操作 |
| UI サービス | `task-interactions.ts` | `taskCoreStore.addTask` | 新規タスク保存 |
| ドメインサービス | `task-mutations.ts` | `updateTask`/`addTask`/`deleteTask`/`toggleTaskStatus` | タスク操作全般 |
| ドメインサービス | `subtask-mutations.ts` | `taskCoreStore.updateTask` | サブタスク更新伝播 |
| ドメインサービス | `task-recurrence.ts` | `taskCoreStore.createRecurringTask` | 次回発生タスク生成 |
| ストア | `task-detail-view-store.svelte.ts` | `moveTaskToList` | 詳細画面からのタスクリスト変更 |
| ストア | `task-detail/task-edit-form-store.svelte.ts` | `updateTask` | 編集フォームの自動保存 |

### C. テストおよびモックの影響範囲（抜粋）
- `tests/services/domain/task/task-mutations.test.ts`: `taskCoreStore` を直接モックし、副作用を前提に検証。
- `tests/stores/task-store.test.ts`: `taskCoreStore.addTask`/`deleteTask` を利用した挙動を期待。
- 各種 UI テスト（`task-date-picker`, `project-list`, `task-list-display` など）で `taskCoreStore` 呼び出しをスタブ化しているケースあり。

### D. 目標状態のメモ
- `TaskCoreStore` は **純粋な状態変換API**（例: `applyTaskUpdate`, `insertTask`, `removeTask`, `moveTaskBetweenLists`）のみ提供し、永続化は行わない。
- 永続化とロールバック制御は `TaskMutations`（および関連サービス）が一元管理する。
- UI／他ストアは `TaskMutations` などのサービス経由でのみドメイン操作を実行する。
- UI サービス（`task-interactions.ts`）も同様にドメインサービスを利用する形へ差し替える。

> ※ 上記リストは 2025-10-14 時点の `main` ブランチに基づく。今後の着手前に差分がないか再確認すること。

## タスク 2: サービス再設計方針（ドラフト）

### A. `TaskCoreStore` の提供 API（案）
| 分類 | メソッド案 | 役割 | 備考 |
| --- | --- | --- | --- |
| 読み取り | `getTaskById(taskId)` / `findTaskList(listId)` | 既存メソッドを維持 | 純粋なクエリとして利用 |
| 状態更新（タスク単体） | `applyTaskUpdate(taskId, updater)` | ローカルタスクに対して `updater` を適用し、`updatedAt` を更新 | 旧 `updateTask` を分割し永続化を排除 |
| 状態更新（追加） | `insertTask(listId, task, options)` | 指定リストへタスクを挿入し `createdAt/updatedAt` を更新 | 旧 `addTask` のローカル処理部分 |
| 状態更新（削除） | `removeTask(taskId)` | タスクを除去し、プロジェクト更新日時を設定。削除対象を返せるようにする | ロールバック用に {task,list,project,index} を返却 |
| 状態更新（移動） | `moveTaskBetweenLists(taskId, targetListId, options)` | リスト移動をローカルで行い結果を返却（元位置・新位置） | 旧 `moveTaskToList` から永続化を除去 |
| ユーティリティ | `restoreTask(listId, task, index)` | エラー時のロールバック用 | `removeTask` で返した情報を元に戻す |

上記 API は **純粋なローカル状態変換のみ** を実装する。永続化呼び出しは一切含めない。

### B. `TaskMutations` 再設計の概要
1. **標準フロー**（例: タスク更新）
   1. `context = taskStore.getTaskProjectAndList(taskId)` でプロジェクトIDを解決。
   2. `taskCoreStore.applyTaskUpdate` でローカル更新。
   3. `TaskService.updateTaskWithSubTasks` 等で永続化。
   4. 永続化失敗時は `errorHandler` へ通知し、必要に応じてロールバック。
2. **タスク追加**
   - `TaskCoreStore.insertTask` でローカル挿入 → `TaskService.createTaskWithSubTasks` → 失敗時に `removeTask` で巻き戻し。
3. **タスク移動**
   - `moveTaskBetweenLists` の返却情報を保持し、失敗時に `restoreTask` で復元。
4. **タスク削除**
   - `removeTask` で削除対象を退避 → 永続化 → 失敗時に `restoreTask` で戻す。

`TaskMutations` と `TaskService` の役割切り分け:
- `TaskMutations`: ビジネスルール、ローカル状態変更、ロールバック制御、エラーハンドリング。
- `TaskService`（既存 `task-crud.ts`）: 永続化 I/O のみ。

### C. UI／他サービスからの利用指針
- UI コンポーネント・UI サービスは `TaskMutations`（または適切なファサード）経由で操作する。
- 既存の `task-interactions.ts` は `TaskMutations` を依存に持つよう差し替え、`taskCoreStore` 直接呼び出しを廃止。
- `TaskDetailViewStore`・`TaskEditFormStore` などのストアも `TaskMutations` を受け取り、直接操作を避ける。

### D. フォローアップ
- 上記案を実装する際、型定義や戻り値の詳細は実装フェーズで精査（例: ロールバック情報の型 `TaskRemovalContext` 等）。
- 既存コードとの差分を明確にするため、実装前にモジュール単位の TODO リストを追加予定。
- 2025-10-14 実装: `TaskCoreStore` は新API (`insertTask` / `removeTask` / `moveTaskBetweenLists` 等) を提供し、`TaskMutations` が `TaskService` 経由で永続化・ロールバックを担う構造へ移行。`taskStore` で依存注入した `taskMutations` を再利用する形に統一。
