/**
 * タスクドメインサービス
 *
 * タスクに関連する全ての操作を提供します
 */

export { TaskService } from './task-crud';
export { TaskMutations, type TaskMutationDependencies } from './task-mutations';
export { taskMutations, getTaskMutations } from './task-mutations-instance';
