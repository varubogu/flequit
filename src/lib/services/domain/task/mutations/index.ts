/**
 * Task mutations統合エクスポート
 * 各責務ごとに分割されたmutationクラスを統合してエクスポートする
 */

export { TaskCrudMutations } from './task-crud-mutations';
export type {
	TaskCrudMutationDependencies,
	TaskServiceLike as TaskCrudServiceLike
} from './task-crud-mutations';

export { TaskStatusMutations } from './task-status-mutations';
export type { TaskStatusMutationDependencies } from './task-status-mutations';

export { TaskTagMutations } from './task-tag-mutations';
export type { TaskTagMutationDependencies } from './task-tag-mutations';

export { TaskMoveMutations } from './task-move-mutations';
export type {
	TaskMoveMutationDependencies,
	TaskServiceLike as TaskMoveServiceLike
} from './task-move-mutations';
