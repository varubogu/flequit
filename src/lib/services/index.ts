/**
 * Services層の公開API
 *
 * コンポーネントはこのファイルから必要なServiceをimportしてください。
 * infrastructure層への直接アクセスは禁止です。
 */

// Domain Services（単一エンティティ操作）
export {
	ProjectCrudService,
	ProjectQueryService,
	ProjectHelpers
} from './domain/project/index';

// Composite Services（CRUD + Store更新）
export { ProjectCompositeService } from './composite/project-composite';
export { TaskListCompositeService } from './composite/task-list-composite';

// Facade（後方互換性・Phase 2完了後削除予定）
export { ProjectService, ProjectsService } from './composite/project-facade';

// UI Services（UI状態管理のみ）
export * from './ui/layout';
export * from './ui/task';
export * from './ui/view';
export * from './ui/task-detail';
